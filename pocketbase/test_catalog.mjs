// E2E: shared catalog + tastings from two people + aggregation, against local PocketBase.
import PocketBase from "../node_modules/pocketbase/dist/pocketbase.es.mjs";
const pb = new PocketBase("http://127.0.0.1:8090");
const ADMIN = { email: "admin@local.dev", password: "devpassword12345" };
const fail = (m) => { console.error("❌", m); process.exit(1); };
const cleanup = [];

// admin mints two invites
await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
const mkInvite = async () => (await pb.collection("invites").create({ code: "C-" + Math.random().toString(36).slice(2, 7), kind: "new_household" }));
const inv1 = await mkInvite(), inv2 = await mkInvite();
cleanup.push(["invites", inv1.id], ["invites", inv2.id]);
pb.authStore.clear();

// helper: signup + login
async function joinAs(name, color) {
  const email = `${name.toLowerCase()}+${Date.now()}@local.dev`;
  await pb.collection("users").create({ email, password: "testpass12345", passwordConfirm: "testpass12345", name, color, is_admin: false });
  await pb.collection("users").authWithPassword(email, "testpass12345");
  return pb.authStore.record.id;
}

// Kiki adds a coffee to the shared catalog
const kiki = await joinAs("Kiki", "#C0704A");
cleanup.push(["users", kiki]);
const coffee = await pb.collection("coffees").create({
  name: "Daye Bensa Bombe", roaster: "DAK", origin: "Ethiopia", region: "Sidamo",
  process: "Natural", roast_level: "Light", tags: ["Fruity", "Floral", "Berry"],
  bag_notes: "Strawberry jam, jasmine.", added_by: kiki,
});
cleanup.push(["coffees", coffee.id]);
if (!Array.isArray(coffee.tags) || coffee.tags.length !== 3) fail("tags didn't store as array");
console.log("✓ Kiki added coffee to shared catalog (tags stored as array)");

// Kiki rates it
const tK = await pb.collection("tastings").create({ coffee: coffee.id, user: kiki, score: 9, grind: 18, brew_method: "V60", notes: "The one.", tasted_on: "2026-05-20 10:00:00.000Z" });
cleanup.push(["tastings", tK.id]);

// Madsy joins and rates the SAME catalog entry
const madsy = await joinAs("Madsy", "#4A7A90");
cleanup.push(["users", madsy]);
const tM = await pb.collection("tastings").create({ coffee: coffee.id, user: madsy, score: 8, grind: 16, brew_method: "Aeropress", tasted_on: "2026-05-22 10:00:00.000Z" });
cleanup.push(["tastings", tM.id]);
console.log("✓ Madsy rated the same shared entry (no duplicate coffee)");

// list coffees + aggregate (what Catalog.jsx does)
const list = await pb.collection("coffees").getList(1, 100, { sort: "-created", expand: "added_by" });
const tastings = await pb.collection("tastings").getFullList({ expand: "user" });
const forCoffee = tastings.filter((t) => t.coffee === coffee.id).map((t) => Number(t.score));
const avg = (forCoffee.reduce((a, x) => a + x, 0) / forCoffee.length).toFixed(1);
if (avg !== "8.5") fail(`expected avg 8.5, got ${avg}`);
console.log(`✓ catalog shows avg ${avg} from ${forCoffee.length} tastings`);

// per-person breakdown (what CoffeeDetail.jsx shows)
const detail = await pb.collection("tastings").getFullList({ filter: `coffee = "${coffee.id}"`, expand: "user" });
const names = detail.map((t) => `${t.expand.user.name}:${t.score}`).sort().join(", ");
console.log("✓ side-by-side:", names);

// cleanup (as admin)
await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
for (const [col, id] of cleanup.reverse()) { try { await pb.collection(col).delete(id); } catch {} }
// remove any stray group/memberships from signup
for (const col of ["group_members", "groups"]) {
  try { const r = await pb.collection(col).getFullList(); for (const x of r) await pb.collection(col).delete(x.id); } catch {}
}
console.log("✓ cleaned up\n🎉 Catalog + tastings flow works end to end.");
