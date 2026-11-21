//! Tests: `/api/shakedown/*` forwards to shaked (here a stub) and turns its errors into plain codes.
mod common;
use axum::Router;
use axum::extract::{Path, RawQuery};
use axum::http::header;
use axum::response::IntoResponse;
use axum::routing::{get, post};
use controld::shakedown::Shakedown;
use serde_json::{Value, json};

/// A stand-in for shaked on a free loopback port; returns its base URL.
async fn stub_shaked() -> String {
    let app = Router::new()
        .route(
            "/api/health",
            get(|| async { axum::Json(json!({"claude": true})) }),
        )
        .route(
            "/api/branches/{id}/rows",
            get(|Path(id): Path<String>, RawQuery(q): RawQuery| async move {
                axum::Json(json!({"id": id, "query": q}))
            }),
        )
        .route(
            "/api/runs",
            post(|body: String| async move { axum::Json(json!({"got": body})) }),
        )
        .route(
            "/api/runs/{id}",
            get(|| async {
                (
                    axum::http::StatusCode::NOT_FOUND,
                    axum::Json(json!({"error": "there is no run \"x\""})),
                )
            }),
        )
        .route(
            "/api/branches/{id}/stream",
            get(|| async {
                (
                    [(header::CONTENT_TYPE, "text/event-stream")],
                    "event: status\ndata: {}\n\n",
                )
                    .into_response()
            }),
        );
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    tokio::spawn(async move { axum::serve(listener, app).await.unwrap() });
    format!("http://{addr}")
}

async fn served_with(base: Option<&str>) -> common::m2::Served {
    let mut s = common::m2::serve().await;
    if let Some(b) = base {
        s.st = s.st.clone().with_shakedown(Shakedown::new(b));
    }
    s.router = controld::app(s.st.clone(), None);
    s
}

#[tokio::test]
async fn forwards_paths_queries_and_bodies_to_shaked() {
    let s = served_with(Some(&stub_shaked().await)).await;
    let (st, v) = common::m2::get(&s.router, "/api/shakedown/health").await;
    assert_eq!((st.as_u16(), v), (200, json!({"claude": true})));

    let (st, v) = common::m2::get(
        &s.router,
        "/api/shakedown/branches/b-1/rows?seq=3&keys=orders%2F%23W1",
    )
    .await;
    assert_eq!(st.as_u16(), 200);
    assert_eq!(
        v,
        json!({"id": "b-1", "query": "seq=3&keys=orders%2F%23W1"})
    );

    let (st, v) = common::m2::call(
        &s.router,
        "POST",
        "/api/shakedown/runs",
        json!({"task_id": "27"}),
    )
    .await;
    assert_eq!(st.as_u16(), 200);
    let got: Value = serde_json::from_str(v["got"].as_str().unwrap()).unwrap();
    assert_eq!(got, json!({"task_id": "27"}));
}

#[tokio::test]
async fn a_running_branch_feed_streams_as_server_sent_events() {
    let s = served_with(Some(&stub_shaked().await)).await;
    let req = axum::http::Request::builder()
        .uri("/api/shakedown/branches/b-1/stream")
        .header("host", "test")
        .body(axum::body::Body::empty())
        .unwrap();
    let (st, headers, body) = common::community::raw(&s.router, req).await;
    assert_eq!(st.as_u16(), 200);
    assert_eq!(headers[header::CONTENT_TYPE], "text/event-stream");
    assert_eq!(
        String::from_utf8(body).unwrap(),
        "event: status\ndata: {}\n\n"
    );
}

#[tokio::test]
async fn shaked_errors_come_back_as_codes_with_its_text_as_evidence() {
    let s = served_with(Some(&stub_shaked().await)).await;
    let (st, v) = common::m2::get(&s.router, "/api/shakedown/runs/x").await;
    assert_eq!(st.as_u16(), 404);
    assert_eq!(v["error"]["code"], "shakedown_not_found");
    assert_eq!(v["error"]["raw"], "there is no run \"x\"");
}

#[tokio::test]
async fn paths_that_could_leave_shakeds_api_are_refused() {
    let s = served_with(Some(&stub_shaked().await)).await;
    for p in [
        "/api/shakedown/../mcp/b/a",
        "/api/shakedown/runs/%2e%2e/%2e%2e/gateway",
        "/api/shakedown/runs/a.b",
        "/api/shakedown/runs/a%2Fb",
    ] {
        let (st, v) = common::m2::get(&s.router, p).await;
        assert_eq!(
            (st.as_u16(), v["error"]["code"].as_str()),
            (404, Some("not_found")),
            "{p}"
        );
    }
    let (st, _) = common::m2::call(&s.router, "PUT", "/api/shakedown/runs", json!({})).await;
    assert_eq!(st.as_u16(), 405);
}

#[tokio::test]
async fn without_shaked_the_answer_says_so() {
    // Nothing listens on port 1.
    let s = served_with(Some("http://127.0.0.1:1")).await;
    let (st, v) = common::m2::get(&s.router, "/api/shakedown/health").await;
    assert_eq!(
        (st.as_u16(), v["error"]["code"].as_str()),
        (503, Some("shakedown_unreachable"))
    );

    // Hosted (no shakedown wired): Tests need Sculptured on your own computer.
    let s = served_with(None).await;
    let (st, v) = common::m2::get(&s.router, "/api/shakedown/health").await;
    assert_eq!(
        (st.as_u16(), v["error"]["code"].as_str()),
        (409, Some("needs_computer"))
    );
}
