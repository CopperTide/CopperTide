//! `coppertide guard`, Claude Code's PreToolUse hook for protections, run as Claude Code runs it.
use std::io::Write;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

fn guard(input: &str, rules: Option<&str>) -> (String, Duration) {
    guard_with(input, rules, "COPPERTIDE_PROTECTION")
}

/// `guard` with the rules in variable `var`.
fn guard_with(input: &str, rules: Option<&str>, var: &str) -> (String, Duration) {
    let mut cmd = Command::new(env!("CARGO_BIN_EXE_coppertide"));
    cmd.arg("guard")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .env_remove("COPPERTIDE_PROTECTION")
        .env_remove("SCULPTURED_PROTECTION");
    if let Some(r) = rules {
        cmd.env(var, r);
    }
    let start = Instant::now();
    let mut child = cmd.spawn().unwrap();
    child
        .stdin
        .take()
        .unwrap()
        .write_all(input.as_bytes())
        .unwrap();
    let out = child.wait_with_output().unwrap();
    assert!(out.status.success(), "the guard always exits 0");
    (String::from_utf8(out.stdout).unwrap(), start.elapsed())
}

const RULES: &str = r#"{"max_read_bytes":102400,"shell_output_chars":8000}"#;

#[test]
fn an_agent_started_before_the_rename_keeps_its_rules() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("big.csv"), vec![b'x'; 300_000]).unwrap();
    let input = format!(
        r#"{{"hook_event_name":"PreToolUse","tool_name":"Read","cwd":"{}","tool_input":{{"file_path":"big.csv"}}}}"#,
        dir.path().display()
    );
    let (out, _) = guard_with(&input, Some(RULES), "SCULPTURED_PROTECTION");
    assert!(out.contains("deny"), "{out}");
}

#[test]
fn a_whole_read_of_a_large_file_is_refused_quickly_and_anything_else_passes() {
    let dir = tempfile::tempdir().unwrap();
    std::fs::write(dir.path().join("big.csv"), vec![b'x'; 300_000]).unwrap();
    let read = |args: &str| {
        format!(
            r#"{{"hook_event_name":"PreToolUse","tool_name":"Read","cwd":"{}","tool_input":{{"file_path":"big.csv"{args}}}}}"#,
            dir.path().display()
        )
    };
    let (out, _) = guard(&read(""), Some(RULES));
    let v: serde_json::Value = serde_json::from_str(&out).expect("a JSON refusal");
    assert_eq!(v["hookSpecificOutput"]["permissionDecision"], "deny");
    assert!(
        v["hookSpecificOutput"]["permissionDecisionReason"]
            .as_str()
            .unwrap()
            .contains("big.csv is 293 KB")
    );
    assert_eq!(
        guard(&read(r#","offset":1,"limit":100"#), Some(RULES)).0,
        "",
        "a ranged read passes"
    );
    assert_eq!(guard(&read(""), None).0, "", "no rules: everything passes");
    assert_eq!(
        guard("not json", Some(RULES)).0,
        "",
        "unreadable input passes"
    );
    // Fast: the quickest of a few runs, process start included.
    let fastest = (0..5)
        .map(|_| guard(&read(""), Some(RULES)).1)
        .min()
        .unwrap();
    assert!(
        fastest < Duration::from_millis(20),
        "the guard took {fastest:?}"
    );
}
