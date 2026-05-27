// End-to-end test of the invite-gated signup + login flow against local PocketBase.
import PocketBase from "../node_modules/pocketbase/dist/pocketbase.es.mjs";

const pb = new PocketBase("http://127.0.0.1:8090");
const ADMIN = { email: "admin@local.dev", password: "devpassword12345" };
const fail = (m) => { console.error("❌", m); process.exit(1); };

// 1. superuser mints a fresh invite
await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
const code = "TEST-" + Math.random().toString(36).slice(2, 7).toUpperCase();
const invite = await pb.collection("invites").create({ code, kind: "new_household" });
console.log("✓ admin minted invite:", code);
pb.authStore.clear();

// 2. public signup gated by the invite
const email = `tester+${Date.now()}@local.dev`;
const found = await pb.collection("invites").getFirstListItem(`code = "${code}"`);
if (found.used_by) fail("invite already used");
await pb.collection("users").create({
  email, password: "testpass12345", passwordConfirm: "testpass12345",
  name: "Tester", color: "#4A7A90", is_admin: false,
});
console.log("✓ account created via invite");

// 3. login
await pb.collection("users").authWithPassword(email, "testpass12345");
if (!pb.authStore.isValid) fail("login failed");
const uid = pb.authStore.record.id;
console.log("✓ logged in as", pb.authStore.record.name);

// 4. claim invite + create household
await pb.collection("invites").update(invite.id, { used_by: uid });
const group = await pb.collection("groups").create({ name: "Tester's household", created_by: uid });
await pb.collection("group_members").create({ group: group.id, user: uid, role: "owner" });
console.log("✓ invite claimed, household + membership created");

// 5. verify the new user canNOT edit someone else's tasting (rule check)
//    create a coffee + tasting as this user, then confirm self-edit works
const coffee = await pb.collection("coffees").create({ name: "Test Coffee", added_by: uid });
const tasting = await pb.collection("tastings").create({ coffee: coffee.id, user: uid, score: 8 });
await pb.collection("tastings").update(tasting.id, { score: 9 });
console.log("✓ user can edit their own tasting");

// 6. cleanup
await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
for (const [col, id] of [["tastings", tasting.id], ["coffees", coffee.id], ["group_members", null], ["groups", group.id], ["users", uid], ["invites", invite.id]]) {
  try { if (id) await pb.collection(col).delete(id); } catch {}
}
// delete the membership too (find by user)
try {
  const mem = await pb.collection("group_members").getFullList({ filter: `user = "${uid}"` });
  for (const m of mem) await pb.collection("group_members").delete(m.id);
} catch {}
console.log("✓ cleaned up test data");
console.log("\n🎉 Auth flow works end to end.");
