#!/bin/sh
# Tests install.sh against a local, file:// release built by deploy/release/package.sh around a
# fake `coppertide` that records how it was run. No network; nothing outside a temp folder.
set -eu
here=$(cd "$(dirname "$0")" && pwd)
repo=$(cd "$here/../.." && pwd)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
fail() { echo "FAIL: $*" >&2; exit 1; }

case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) target=x86_64-unknown-linux-gnu ;;
  Linux-aarch64 | Linux-arm64) target=aarch64-unknown-linux-gnu ;;
  Darwin-x86_64) target=x86_64-apple-darwin ;;
  Darwin-arm64) target=aarch64-apple-darwin ;;
  *) echo "skip: no test target for this machine"; exit 0 ;;
esac

mkdir -p "$work/bin" "$work/rel"
cat > "$work/bin/coppertide" <<'X'
#!/bin/sh
echo "ran: $*" > "$HOME/ran.txt"
X
chmod +x "$work/bin/coppertide"
sh "$repo/deploy/release/package.sh" "$target" "$work/bin/coppertide" "$work/rel"

render() { sed -e "s#__ORIGIN__#https://app.test#" -e "s#__RELEASES__#file://$work/rel#" "$repo/deploy/install/install.sh" > "$work/install.sh"; }
render

# 1. Installs and connects.
HOME="$work/h1" sh "$work/install.sh" --allow X > "$work/out1" 2>&1 || { cat "$work/out1"; fail "install failed"; }
[ -x "$work/h1/.local/bin/coppertide" ] || fail "not installed"
[ "$(cat "$work/h1/ran.txt")" = "ran: connect https://app.test --install-service --allow X" ] || fail "connect (as a background service) not run as expected: $(cat "$work/h1/ran.txt")"

# 2. A changed checksum stops everything.
cp "$work/rel/coppertide-$target.tar.gz.sha256" "$work/good.sha256"
printf '%064d  %s\n' 0 "coppertide-$target.tar.gz" > "$work/rel/coppertide-$target.tar.gz.sha256"
if HOME="$work/h2" sh "$work/install.sh" > "$work/out2" 2>&1; then fail "a bad checksum was accepted"; fi
grep -q "checksum mismatch" "$work/out2" || { cat "$work/out2"; fail "no checksum message"; }
[ ! -e "$work/h2/.local/bin/coppertide" ] || fail "installed despite a bad checksum"

# 3. An unknown architecture stops with a message.
mkdir -p "$work/shim"
printf '#!/bin/sh\ncase "$1" in -s) echo Linux;; -m) echo riscv128;; esac\n' > "$work/shim/uname"
chmod +x "$work/shim/uname"
if HOME="$work/h3" PATH="$work/shim:$PATH" sh "$work/install.sh" > "$work/out3" 2>&1; then fail "an unknown arch was accepted"; fi
grep -q "unsupported" "$work/out3" || { cat "$work/out3"; fail "no unsupported message"; }

cp "$work/good.sha256" "$work/rel/coppertide-$target.tar.gz.sha256"

# 4. A Rosetta shell on Apple silicon (uname -m says x86_64) gets the Apple-silicon build.
sh "$repo/deploy/release/package.sh" aarch64-apple-darwin "$work/bin/coppertide" "$work/rel" > /dev/null
mkdir -p "$work/mac"
printf '#!/bin/sh\ncase "$1" in -s) echo Darwin;; -m) echo x86_64;; esac\n' > "$work/mac/uname"
printf '#!/bin/sh\n[ "$2" = sysctl.proc_translated ] && echo "$TRANSLATED"\n' > "$work/mac/sysctl"
chmod +x "$work/mac/uname" "$work/mac/sysctl"
HOME="$work/h4" TRANSLATED=1 PATH="$work/mac:$PATH" sh "$work/install.sh" > "$work/out4" 2>&1 || { cat "$work/out4"; fail "Rosetta shell did not install"; }
[ -x "$work/h4/.local/bin/coppertide" ] || fail "Rosetta shell: not installed"

# 5. An Intel Mac gets the Intel build.
mkdir -p "$work/intel"
printf '#!/bin/sh\n# intel build\necho "ran: $*" > "$HOME/ran.txt"\n' > "$work/intel/coppertide"
chmod +x "$work/intel/coppertide"
sh "$repo/deploy/release/package.sh" x86_64-apple-darwin "$work/intel/coppertide" "$work/rel" > /dev/null
HOME="$work/h5" TRANSLATED=0 PATH="$work/mac:$PATH" sh "$work/install.sh" > "$work/out5" 2>&1 || { cat "$work/out5"; fail "an Intel Mac did not install"; }
grep -q "intel build" "$work/h5/.local/bin/coppertide" || fail "an Intel Mac got the wrong build"
grep -q "intel build" "$work/h4/.local/bin/coppertide" && fail "the Rosetta shell got the Intel build"

# 6. A computer with an install from before the rename: its old path now runs the new build.
mkdir -p "$work/h6/.local/bin"
printf '#!/bin/sh\necho old\n' > "$work/h6/.local/bin/sculptured"
chmod +x "$work/h6/.local/bin/sculptured"
HOME="$work/h6" sh "$work/install.sh" > "$work/out6" 2>&1 || { cat "$work/out6"; fail "an update over an old install failed"; }
[ -L "$work/h6/.local/bin/sculptured" ] || fail "the old path is not a link to the new build"
[ "$(readlink "$work/h6/.local/bin/sculptured")" = coppertide ] || fail "the old path links elsewhere"
# A first install makes no old path.
[ ! -e "$work/h1/.local/bin/sculptured" ] || fail "a first install made the old path"

# 7. An installer from before the rename, given this archive under its old name, finds `sculptured`.
tar -tzf "$work/rel/coppertide-$target.tar.gz" | grep -qx sculptured || fail "the archive has no sculptured for old installers"
mkdir -p "$work/old" && tar -xzf "$work/rel/coppertide-$target.tar.gz" -C "$work/old"
cmp -s "$work/old/sculptured" "$work/old/coppertide" || fail "the old name is not the same build"

# 8. A build packaged before the rename (only `sculptured` inside) still installs as coppertide.
mkdir -p "$work/pre" "$work/prerel"
cp "$work/bin/coppertide" "$work/pre/sculptured"
tar -czf "$work/prerel/coppertide-$target.tar.gz" -C "$work/pre" sculptured
sum=$( (sha256sum "$work/prerel/coppertide-$target.tar.gz" 2>/dev/null || shasum -a 256 "$work/prerel/coppertide-$target.tar.gz") | cut -d' ' -f1)
printf '%s  %s\n' "$sum" "coppertide-$target.tar.gz" > "$work/prerel/coppertide-$target.tar.gz.sha256"
sed -e "s#__ORIGIN__#https://app.test#" -e "s#__RELEASES__#file://$work/prerel#" "$repo/deploy/install/install.sh" > "$work/install-pre.sh"
HOME="$work/h8" sh "$work/install-pre.sh" > "$work/out8" 2>&1 || { cat "$work/out8"; fail "a build packaged before the rename did not install"; }
[ -x "$work/h8/.local/bin/coppertide" ] || fail "a build packaged before the rename: not installed"

echo "install.sh: all checks passed"
