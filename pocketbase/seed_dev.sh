#!/bin/bash
# Seeds a LOCAL dev environment: a throwaway admin + one test invite code.
# Safe to run repeatedly. Local development only — never run against production.
# Usage: from the project root, with PocketBase already running:  bash pocketbase/seed_dev.sh
set -e
cd "$(dirname "$0")"

PB="http://127.0.0.1:8090"
ADMIN_EMAIL="admin@local.dev"
ADMIN_PASS="devpassword12345"

if ! curl -s -o /dev/null "$PB/api/health"; then
  echo "PocketBase isn't running. Start the app first (the launcher does this), then re-run."
  exit 1
fi

# 1. Local throwaway superuser (never deployed)
./pocketbase superuser upsert "$ADMIN_EMAIL" "$ADMIN_PASS" >/dev/null 2>&1 || true
echo "Local admin: $ADMIN_EMAIL / $ADMIN_PASS   (dashboard: $PB/_/)"

# 2. A test invite code so you can sign up locally
TOKEN=$(curl -s -X POST "$PB/api/collections/_superusers/auth-with-password" \
  -H "Content-Type: application/json" \
  -d "{\"identity\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

EXISTS=$(curl -s "$PB/api/collections/invites/records?filter=$(python3 -c "import urllib.parse;print(urllib.parse.quote('code=\"DEV-INVITE\"'))")" \
  -H "Authorization: $TOKEN" | python3 -c "import sys,json;print(json.load(sys.stdin)['totalItems'])")

if [ "$EXISTS" = "0" ]; then
  curl -s -X POST "$PB/api/collections/invites/records" -H "Authorization: $TOKEN" \
    -H "Content-Type: application/json" -d '{"code":"DEV-INVITE","kind":"new_household"}' >/dev/null
  echo "Seeded invite code: DEV-INVITE"
else
  echo "Invite code already exists: DEV-INVITE"
fi
echo ""
echo "Now open the app, click 'Create an account', and use invite code: DEV-INVITE"
