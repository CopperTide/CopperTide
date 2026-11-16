#!/bin/sh
# Packages a `coppertide` binary for a release: coppertide-<target>.tar.gz and its .sha256.
#   deploy/release/package.sh <target> <path/to/coppertide> <outdir>
# A Windows target (…-windows-…) packs coppertide.exe and, next to it, coppertide-background.exe (the
# window-less launcher its logon task runs). Windows 10 and later unpack .tar.gz with their own tar.
# The archive also holds the same program under its old names (sculptured, sculptured.exe,
# sculptured-background.exe), stored as hard links so it is no bigger: an installer from before the
# rename, given this archive under its old name by the server, still finds what it copies.
set -eu
target=$1; binary=$2; out=$3
mkdir -p "$out"
stage=$(mktemp -d)
trap 'rm -rf "$stage"' EXIT
case "$target" in
  *windows*)
    cp "$binary" "$stage/coppertide.exe"
    background="$(dirname "$binary")/coppertide-background.exe"
    [ -f "$background" ] || background="$(dirname "$binary")/sculptured-background.exe"
    cp "$background" "$stage/coppertide-background.exe"
    ln "$stage/coppertide.exe" "$stage/sculptured.exe"
    ln "$stage/coppertide-background.exe" "$stage/sculptured-background.exe"
    files="coppertide.exe coppertide-background.exe sculptured.exe sculptured-background.exe" ;;
  *)
    cp "$binary" "$stage/coppertide"
    chmod 755 "$stage/coppertide"
    ln "$stage/coppertide" "$stage/sculptured"
    files="coppertide sculptured" ;;
esac
asset="coppertide-$target.tar.gz"
# shellcheck disable=SC2086 # $files is a list of names
tar -czf "$out/$asset" -C "$stage" $files
if command -v sha256sum >/dev/null 2>&1; then sum=$(sha256sum "$out/$asset" | cut -d' ' -f1)
else sum=$(shasum -a 256 "$out/$asset" | cut -d' ' -f1); fi
printf '%s  %s\n' "$sum" "$asset" > "$out/$asset.sha256"
echo "$out/$asset"
