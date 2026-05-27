#!/bin/sh
set -e

# Create/update the admin (superuser) from env vars on boot, if provided.
# Set SUPERUSER_EMAIL + SUPERUSER_PASSWORD in the host's environment.
if [ -n "$SUPERUSER_EMAIL" ] && [ -n "$SUPERUSER_PASSWORD" ]; then
  ./pocketbase superuser upsert "$SUPERUSER_EMAIL" "$SUPERUSER_PASSWORD" || true
fi

# Migrations in pb_migrations/ are applied automatically on serve.
# Listen on all interfaces and the platform-provided port (Railway sets $PORT).
exec ./pocketbase serve --http=0.0.0.0:"${PORT:-8090}"
