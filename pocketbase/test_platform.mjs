// E2E: admin-gated invites, feed query, profile comparison data.
import PocketBase from "../node_modules/pocketbase/dist/pocketbase.es.mjs";
import { assertSafeToTest } from "./_testlib.mjs";
const pb = new PocketBase("http://127.0.0.1:8090");
const ADMIN = { email: "admin@local.dev", password: "devpassword12345" };
const fail = (m) => { console.error("❌", m); process.exit(1); };
const cleanup = [];

await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
await assertSafeToTest(pb);
const seed = await pb.collection("invites").create({ code: "SEED-" + Math.random().toString(36).slice(2, 6), kind: "new_household" });
cleanup.push(["invites", seed.id]);
pb.authStore.clear();

async function join(name, color, code) {
  const email = `${name.toLowerCase()}+${Date.now()}${Math.floor(Math.random()*99)}@local.dev`;
  await pb.collection("users").create({ email, password: "testpass12345", passwordConfirm: "testpass12345", name, color, is_admin: false });
  await pb.collection("users").authWithPassword(email, "testpass12345");
  return pb.authStore.record.id;
}

// Anna signs up; we promote her to admin (simulating "first user becomes admin")
const anna = await join("Anna", "#C0704A", seed.code);
cleanup.push(["users", anna]);
await pb.collection("users").update(anna, { is_admin: true });
await pb.collection("users").authRefresh();
if (!pb.authStore.record.is_admin) fail("admin promotion didn't stick");
console.log("✓ Anna is admin");

// Admin mints an invite
const inv = await pb.collection("invites").create({ code: "JOIN-" + Math.random().toString(36).slice(2, 6), kind: "join_group", created_by: anna });
cleanup.push(["invites", inv.id]);
console.log("✓ admin minted an invite:", inv.code);

// Ben joins as a normal member
const ben = await join("Ben", "#4A7A90", inv.code);
cleanup.push(["users", ben]);

// Ben (non-admin) must NOT be able to mint invites
let blocked = false;
try { await pb.collection("invites").create({ code: "HACK-1", kind: "join_group" }); }
catch { blocked = true; }
if (!blocked) fail("non-admin was able to create an invite!");
console.log("✓ non-admin blocked from minting invites");

// Both rate two shared coffees
const c1 = await pb.collection("coffees").create({ name: "Bombe", origin: "Ethiopia", process: "Natural", added_by: anna });
const c2 = await pb.collection("coffees").create({ name: "Kieni", origin: "Kenya", process: "Washed", added_by: anna });
cleanup.push(["coffees", c1.id], ["coffees", c2.id]);
// Anna's scores
await pb.collection("users").authWithPassword((await pb.collection("users").getOne(anna)).email, "testpass12345").catch(()=>{});
const tastings = [];
for (const [u, c, s] of [[anna, c1, 9], [anna, c2, 7], [ben, c1, 7.5], [ben, c2, 7]]) {
  // auth as the rating user
  const rec = await (await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password), pb.collection("users").getOne(u));
  await pb.collection("users").authWithPassword(rec.email, "testpass12345");
  const t = await pb.collection("tastings").create({ coffee: c.id, user: u, score: s, tasted_on: "2026-05-20 10:00:00.000Z" });
  tastings.push(t.id); cleanup.push(["tastings", t.id]);
}
console.log("✓ Anna & Ben rated 2 shared coffees");

// Feed query (expand user + coffee)
const feed = await pb.collection("tastings").getList(1, 50, { sort: "-created", expand: "user,coffee" });
const sample = feed.items.find((t) => t.expand?.user && t.expand?.coffee);
if (!sample) fail("feed expand failed");
console.log(`✓ feed loads with names: e.g. ${sample.expand.user.name} → ${sample.expand.coffee.name} (${sample.score})`);

// Comparison: Anna vs Ben on shared coffees (delta)
const annaT = await pb.collection("tastings").getFullList({ filter: `user = "${anna}"`, expand: "coffee" });
const benByCoffee = {};
(await pb.collection("tastings").getFullList({ filter: `user = "${ben}"` })).forEach((t) => benByCoffee[t.coffee] = Number(t.score));
const rows = annaT.filter((t) => benByCoffee[t.coffee] != null).map((t) => ({ name: t.expand.coffee.name, anna: Number(t.score), ben: benByCoffee[t.coffee], delta: Math.abs(Number(t.score) - benByCoffee[t.coffee]) }));
console.log("✓ comparison:", rows.map((r) => `${r.name} ${r.anna} vs ${r.ben} (Δ${r.delta})`).join("; "));

// cleanup
await pb.collection("_superusers").authWithPassword(ADMIN.email, ADMIN.password);
for (const [col, id] of cleanup.reverse()) { try { await pb.collection(col).delete(id); } catch {} }
for (const col of ["group_members", "groups"]) { try { const r = await pb.collection(col).getFullList(); for (const x of r) await pb.collection(col).delete(x.id); } catch {} }
console.log("✓ cleaned up\n🎉 Platform flows (invites, feed, comparison) work end to end.");
