#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODE="${1:---materialize}"
reconstruct() {
  local dir="$1" name="$2" out="$3"
  : > "$out.b64"
  shopt -s nullglob
  local parts=("$dir/$name".b64.part*)
  shopt -u nullglob
  if [[ ${#parts[@]} -eq 0 ]]; then
    echo "No archive parts found for $name" >&2
    exit 1
  fi
  for part in "${parts[@]}"; do cat "$part" >> "$out.b64"; done
  base64 --decode "$out.b64" > "$out"
  (cd "$(dirname "$out")" && sha256sum -c "$dir/$name.sha256")
  rm -f "$out.b64"
}
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
OVERLAY_DIR="$ROOT/docs/control/global-regulatory-os"
ARCHIVE='phase0-overlay-v1.0.3.tar.gz'
reconstruct "$OVERLAY_DIR" "$ARCHIVE" "$TMP/$ARCHIVE"
case "$MODE" in
  --materialize)
    tar -xzf "$TMP/$ARCHIVE" -C "$ROOT"
    python "$ROOT/scripts/global-reg-os/apply-repository-patches.py"
    ;;
  --verify) tar -tzf "$TMP/$ARCHIVE" >/dev/null ;;
  *) echo "Usage: $0 [--materialize|--verify]" >&2; exit 2 ;;
esac
