#!/bin/sh
# Installs CopperTide's `coppertide` for this user and connects this computer to your account.
#   curl -fsSL __ORIGIN__/install.sh | sh -s -- --key <one-time key from the Computers page>
# Downloads the build for this OS and processor, checks its SHA-256, installs it to ~/.local/bin
# (no sudo), then runs `coppertide connect __ORIGIN__ --install-service <your args>`: it connects,
# lets agents work in your home folder (unless you chose folders), and keeps running in the
# background, starting again whenever you log in. Windows: install.ps1.
set -eu

ORIGIN="__ORIGIN__"
RELEASES="__RELEASES__"

say() { printf '%s\n' "$*"; }
die() { printf 'CopperTide install: %s\n' "$*" >&2; exit 1; }

target() {
  case "$(uname -s)-$(uname -m)" in
    Linux-x86_64 | Linux-amd64) echo x86_64-unknown-linux-gnu ;;
    Linux-aarch64 | Linux-arm64) echo aarch64-unknown-linux-gnu ;;
    Darwin-x86_64)
      # A Rosetta shell on Apple silicon reports x86_64; it gets the native build.
      if [ "$(sysctl -n sysctl.proc_translated 2>/dev/null || true)" = 1 ]; then echo aarch64-apple-darwin
      else echo x86_64-apple-darwin; fi ;;
    Darwin-arm64 | Darwin-aarch64) echo aarch64-apple-darwin ;;
    *) die "unsupported system: $(uname -s) $(uname -m). CopperTide runs on Linux and macOS for now." ;;
  esac
}

fetch() { # url file
  case "$1" in
    file://*) cp "${1#file://}" "$2" ;;
    *) curl -fsSL "$1" -o "$2" || die "could not download $1" ;;
  esac
}

sha256() {
  if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1" | cut -d' ' -f1
  elif command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1" | cut -d' ' -f1
  else die "no sha256sum or shasum to check the download with"; fi
}

main() {
  t=$(target)
  asset="coppertide-$t.tar.gz"
  tmp=$(mktemp -d)
  trap 'rm -rf "$tmp"' EXIT
  say "Downloading CopperTide for $t…"
  ( fetch "$RELEASES/$asset" "$tmp/$asset" ) 2>/dev/null \
    || die "there is no CopperTide build for $t at $RELEASES yet. Nothing was installed."
  fetch "$RELEASES/$asset.sha256" "$tmp/$asset.sha256"
  want=$(cut -d' ' -f1 < "$tmp/$asset.sha256")
  got=$(sha256 "$tmp/$asset")
  [ "$want" = "$got" ] || die "checksum mismatch for $asset (expected $want, got $got). Nothing was installed."
  tar -xzf "$tmp/$asset" -C "$tmp"
  bin="$HOME/.local/bin"
  mkdir -p "$bin"
  cp "$tmp/coppertide" "$bin/coppertide.new"
  chmod 755 "$bin/coppertide.new"
  mv "$bin/coppertide.new" "$bin/coppertide"
  # An install from before the rename: its path now runs this one.
  if [ -e "$bin/sculptured" ] || [ -L "$bin/sculptured" ]; then
    ln -sfn coppertide "$bin/sculptured.new" && mv -f "$bin/sculptured.new" "$bin/sculptured"
  fi
  say "Installed $bin/coppertide"
  case ":$PATH:" in
    *":$bin:"*) ;;
    *) say "Note: $bin is not on your PATH. Add it to use \`coppertide\` directly." ;;
  esac
  say "Connecting this computer to $ORIGIN…"
  "$bin/coppertide" connect "$ORIGIN" --install-service "$@"
}

main "$@"
