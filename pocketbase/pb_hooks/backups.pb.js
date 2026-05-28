/// <reference path="../pb_data/types.d.ts" />
//
// Configure scheduled off-box backups from env vars on each boot.
//
// To turn ON off-box backups, set these on Railway (Cloudflare R2 recommended):
//   BACKUP_S3_BUCKET        e.g. "koffeinkartellet-backups"
//   BACKUP_S3_ENDPOINT      e.g. "https://<account-id>.r2.cloudflarestorage.com"
//   BACKUP_S3_ACCESS_KEY    the R2 API token's Access Key ID
//   BACKUP_S3_SECRET        the R2 API token's Secret Access Key
//
// Optional:
//   BACKUP_S3_REGION        default "auto" (correct for R2)
//   BACKUP_S3_PATH_STYLE    "true" to force path-style URLs (rarely needed)
//   BACKUP_CRON             default "0 3 * * *" — daily 03:00 UTC
//   BACKUP_MAX_KEEP         default 14 — keep this many newest snapshots
//
// If no BACKUP_S3_BUCKET is set, PocketBase still runs the cron locally —
// snapshots accumulate in pb_data, which is still on the Railway volume
// (better than nothing, but NOT off-box).

onBootstrap((e) => {
  e.next();
  try {
    const s = $app.settings();
    s.backups.cron = $os.getenv("BACKUP_CRON") || "0 3 * * *";
    s.backups.cronMaxKeep = Number($os.getenv("BACKUP_MAX_KEEP") || 14);

    const bucket = $os.getenv("BACKUP_S3_BUCKET");
    if (bucket) {
      s.backups.s3.enabled = true;
      s.backups.s3.bucket = bucket;
      s.backups.s3.region = $os.getenv("BACKUP_S3_REGION") || "auto";
      s.backups.s3.endpoint = $os.getenv("BACKUP_S3_ENDPOINT") || "";
      s.backups.s3.accessKey = $os.getenv("BACKUP_S3_ACCESS_KEY") || "";
      s.backups.s3.secret = $os.getenv("BACKUP_S3_SECRET") || "";
      s.backups.s3.forcePathStyle = $os.getenv("BACKUP_S3_PATH_STYLE") === "true";
      console.log("[backups] off-box S3 enabled — bucket:", bucket, "cron:", s.backups.cron);
    } else {
      s.backups.s3.enabled = false;
      console.log("[backups] local-only (set BACKUP_S3_* env vars for off-box)");
    }

    $app.save(s);
  } catch (err) {
    console.log("[backups] configuration failed:", err);
  }
});
