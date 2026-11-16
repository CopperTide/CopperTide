//! The names CopperTide uses on a computer: `COPPERTIDE_*` environment variables and the
//! `~/.coppertide` data folder. Installs from before the rename used `SCULPTURED_*` and
//! `~/.sculptured`; both are still honoured, so a runner installed then keeps working.
use std::ffi::OsString;
use std::path::{Path, PathBuf};

/// The prefix of every environment variable CopperTide reads.
pub const ENV_PREFIX: &str = "COPPERTIDE_";
/// The prefix the same variables had before the rename.
pub const LEGACY_ENV_PREFIX: &str = "SCULPTURED_";
/// The data folder in the home folder.
pub const DATA_FOLDER: &str = ".coppertide";
/// The data folder before the rename.
pub const LEGACY_DATA_FOLDER: &str = ".sculptured";

/// The pre-rename name of `name` (`COPPERTIDE_X` → `SCULPTURED_X`); None for any other name.
#[must_use]
pub fn legacy_env_name(name: &str) -> Option<String> {
    name.strip_prefix(ENV_PREFIX)
        .map(|rest| format!("{LEGACY_ENV_PREFIX}{rest}"))
}

/// The environment variable `name` (a `COPPERTIDE_*` name), else its `SCULPTURED_*` twin.
#[must_use]
pub fn env_var_os(name: &str) -> Option<OsString> {
    lookup(name, |k| std::env::var_os(k))
}

/// `env_var_os` as text; None when unset or not valid UTF-8.
#[must_use]
pub fn env_var(name: &str) -> Option<String> {
    env_var_os(name).and_then(|v| v.into_string().ok())
}

fn lookup(name: &str, get: impl Fn(&str) -> Option<OsString>) -> Option<OsString> {
    get(name).or_else(|| legacy_env_name(name).and_then(|old| get(&old)))
}

/// `(COPPERTIDE_X, value)` for each `SCULPTURED_X` in `vars` whose new name is not set: what to set
/// at start so code (and clap's `env = …`) that reads only the new names sees the old values.
pub fn legacy_env_to_adopt(
    vars: impl IntoIterator<Item = (OsString, OsString)>,
) -> Vec<(String, OsString)> {
    let vars: Vec<(OsString, OsString)> = vars.into_iter().collect();
    let set = |k: &str| vars.iter().any(|(n, _)| n.to_str() == Some(k));
    vars.iter()
        .filter_map(|(n, v)| {
            let rest = n.to_str()?.strip_prefix(LEGACY_ENV_PREFIX)?;
            let current = format!("{ENV_PREFIX}{rest}");
            (!rest.is_empty() && !set(&current)).then(|| (current, v.clone()))
        })
        .collect()
}

/// The data folder in `home` to use: `~/.coppertide`, unless only `~/.sculptured` exists.
#[must_use]
pub fn data_home(home: &Path) -> PathBuf {
    let current = home.join(DATA_FOLDER);
    let legacy = home.join(LEGACY_DATA_FOLDER);
    if !current.exists() && legacy.is_dir() {
        legacy
    } else {
        current
    }
}

/// A path given on a command line or in an old login service: one under `~/.sculptured` that is no
/// longer there is the same path under `~/.coppertide` once that exists (after `migrate_data_home`).
#[must_use]
pub fn honour_legacy_path(path: &Path, home: &Path) -> PathBuf {
    let Ok(rest) = path.strip_prefix(home.join(LEGACY_DATA_FOLDER)) else {
        return path.to_path_buf();
    };
    let moved = home.join(DATA_FOLDER).join(rest);
    if !path.exists() && moved.exists() {
        moved
    } else {
        path.to_path_buf()
    }
}

/// What `migrate_data_home` did.
#[derive(Debug, PartialEq, Eq)]
pub enum Migration {
    /// Nothing to move: `~/.coppertide` exists, or `~/.sculptured` does not.
    Nothing,
    /// `~/.sculptured` became `~/.coppertide`.
    Moved,
    /// `~/.sculptured` stays in use where it is, for the reason given.
    Kept(String),
}

/// Moves `~/.sculptured` to `~/.coppertide` when only the old one exists and no runner is using it
/// (an agent runner holds `hostd.lock` in its folder). Afterwards `~/.sculptured` links to the new
/// folder, so absolute paths saved under it (agents' git copies, old login services) still work.
pub fn migrate_data_home(home: &Path) -> Migration {
    let current = home.join(DATA_FOLDER);
    let legacy = home.join(LEGACY_DATA_FOLDER);
    let is_real_dir = std::fs::symlink_metadata(&legacy).is_ok_and(|m| m.is_dir());
    if current.exists() || !is_real_dir {
        return Migration::Nothing;
    }
    if let Some(lock) = held_runner_lock(&legacy, 4) {
        return Migration::Kept(format!("a runner is using it ({})", lock.display()));
    }
    if let Err(e) = std::fs::rename(&legacy, &current) {
        return Migration::Kept(e.to_string());
    }
    link_back(&current, &legacy);
    Migration::Moved
}

#[cfg(unix)]
fn link_back(current: &Path, legacy: &Path) {
    let _ = std::os::unix::fs::symlink(current.file_name().unwrap_or_default(), legacy);
}

#[cfg(windows)]
fn link_back(current: &Path, legacy: &Path) {
    // A junction needs no administrator rights, unlike a symbolic link.
    let _ = std::process::Command::new("cmd")
        .args(["/C", "mklink", "/J"])
        .arg(legacy)
        .arg(current)
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status();
}

#[cfg(not(any(unix, windows)))]
fn link_back(_: &Path, _: &Path) {}

/// The first `hostd.lock` within `depth` folders of `dir` that a running runner holds.
fn held_runner_lock(dir: &Path, depth: usize) -> Option<PathBuf> {
    let lock = dir.join("hostd.lock");
    if let Ok(f) = std::fs::OpenOptions::new().write(true).open(&lock)
        && f.try_lock().is_err()
    {
        return Some(lock);
    }
    if depth == 0 {
        return None;
    }
    std::fs::read_dir(dir)
        .ok()?
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_ok_and(|t| t.is_dir()))
        .find_map(|e| held_runner_lock(&e.path(), depth - 1))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn os(s: &str) -> OsString {
        s.into()
    }

    #[test]
    fn the_new_name_is_read_first_and_the_old_one_is_the_fallback() {
        let env = |pairs: &'static [(&'static str, &'static str)]| {
            move |k: &str| pairs.iter().find(|(n, _)| *n == k).map(|(_, v)| os(v))
        };
        let both = env(&[
            ("COPPERTIDE_DATA_DIR", "/new"),
            ("SCULPTURED_DATA_DIR", "/old"),
        ]);
        assert_eq!(lookup("COPPERTIDE_DATA_DIR", both), Some(os("/new")));
        let old = env(&[("SCULPTURED_DATA_DIR", "/old")]);
        assert_eq!(lookup("COPPERTIDE_DATA_DIR", old), Some(os("/old")));
        assert_eq!(lookup("COPPERTIDE_DATA_DIR", env(&[])), None);
        // Only CopperTide's own names have a twin.
        assert_eq!(lookup("HOME", env(&[("SCULPTURED_HOME", "/x")])), None);
        assert_eq!(
            legacy_env_name("COPPERTIDE_SEAT_TOKEN").as_deref(),
            Some("SCULPTURED_SEAT_TOKEN")
        );
    }

    #[test]
    fn old_variables_are_adopted_unless_the_new_one_is_set() {
        let got = legacy_env_to_adopt([
            (os("SCULPTURED_HOST_TOKEN"), os("t")),
            (os("SCULPTURED_DATA_DIR"), os("/old")),
            (os("COPPERTIDE_DATA_DIR"), os("/new")),
            (os("SCULPTURED_"), os("nothing")),
            (os("PATH"), os("/bin")),
        ]);
        assert_eq!(got, vec![("COPPERTIDE_HOST_TOKEN".to_string(), os("t"))]);
    }

    #[test]
    fn new_installs_use_coppertide_and_old_ones_move_there() {
        let home = tempfile::tempdir().unwrap();
        let h = home.path();
        assert_eq!(data_home(h), h.join(".coppertide"));
        assert_eq!(migrate_data_home(h), Migration::Nothing);

        std::fs::create_dir_all(h.join(".sculptured/runner")).unwrap();
        std::fs::write(h.join(".sculptured/runner/device.json"), "{}").unwrap();
        assert_eq!(data_home(h), h.join(".sculptured"));
        assert_eq!(migrate_data_home(h), Migration::Moved);
        assert!(h.join(".coppertide/runner/device.json").is_file());
        assert_eq!(data_home(h), h.join(".coppertide"));
        // Paths saved under the old folder still lead to the files.
        assert!(h.join(".sculptured/runner/device.json").is_file());
        assert_eq!(migrate_data_home(h), Migration::Nothing);
    }

    #[test]
    fn a_folder_a_running_runner_holds_is_used_where_it_is() {
        let home = tempfile::tempdir().unwrap();
        let h = home.path();
        let dir = h.join(".sculptured/runner/hostd");
        std::fs::create_dir_all(&dir).unwrap();
        let held = std::fs::File::create(dir.join("hostd.lock")).unwrap();
        held.lock().unwrap();
        assert!(matches!(migrate_data_home(h), Migration::Kept(why) if why.contains("hostd.lock")));
        assert_eq!(data_home(h), h.join(".sculptured"));
        drop(held);
        // Once it stops, the next start moves it.
        assert_eq!(migrate_data_home(h), Migration::Moved);
    }

    #[test]
    fn an_old_path_that_moved_is_found_in_the_new_folder() {
        let home = tempfile::tempdir().unwrap();
        let h = home.path();
        std::fs::create_dir_all(h.join(".coppertide/runner")).unwrap();
        let old = h.join(".sculptured/runner");
        assert_eq!(honour_legacy_path(&old, h), h.join(".coppertide/runner"));
        let elsewhere = h.join("data");
        assert_eq!(honour_legacy_path(&elsewhere, h), elsewhere);
    }
}
