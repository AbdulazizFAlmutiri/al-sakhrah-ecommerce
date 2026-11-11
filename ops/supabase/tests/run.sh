#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$DIR/.." && pwd)"
PGBIN="${PGBIN:-/usr/lib/postgresql/16/bin}"

if [ "$(id -u)" = "0" ]; then
  TMP="$(mktemp -d)"; chmod 755 "$TMP"
  cp -r "$ROOT" "$TMP/supabase"; chown -R postgres "$TMP"
  exec runuser -u postgres -- env PGBIN="$PGBIN" bash "$TMP/supabase/tests/run.sh"
fi

WORK="$(mktemp -d)"
cleanup() { "$PGBIN/pg_ctl" -D "$WORK/data" stop -m fast >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT
"$PGBIN/initdb" -D "$WORK/data" -U postgres -A trust >/dev/null
"$PGBIN/pg_ctl" -D "$WORK/data" -o "-k $WORK -p 54329 -c listen_addresses=''" -l "$WORK/log" start -w >/dev/null
PSQL=(psql -X -h "$WORK" -p 54329 -U postgres -d postgres -v ON_ERROR_STOP=1 -q)

"${PSQL[@]}" -f "$DIR/shim.sql"
for f in "$ROOT"/migrations/*.sql; do "${PSQL[@]}" -f "$f"; done
"${PSQL[@]}" -f "$DIR/helpers.sql"
for f in "$DIR"/[0-9]*.test.sql; do
  echo "== $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done
echo "ALL SQL TESTS PASSED"
