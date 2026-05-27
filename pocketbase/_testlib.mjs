// Safety guard for E2E tests. They create + delete records, so they must only
// ever run against a throwaway local database — never one with a real account.
// Call right after authenticating as superuser.
export async function assertSafeToTest(pb) {
  const users = await pb.collection("users").getFullList();
  const real = users.filter((u) => !u.email.endsWith("@local.dev"));
  if (real.length) {
    console.error(
      `\n❌ ABORT: this database has ${real.length} real account(s) (e.g. ${real[0].email}).\n` +
      `   Tests create and delete data, so they only run against a throwaway DB.\n` +
      `   Spin up an isolated PocketBase (separate --dir and port) and point the test at it.\n`
    );
    process.exit(1);
  }
}
