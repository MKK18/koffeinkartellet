import { pb, currentUser } from "./pb.js";

// ── Coffees (shared catalog) ───────────────────────────────

export async function listCoffees(search = "") {
  const opts = { sort: "-created", expand: "added_by" };
  const q = (search || "").trim();
  if (q) {
    const esc = q.replace(/"/g, '\\"');
    opts.filter = `name ~ "${esc}" || roaster ~ "${esc}" || origin ~ "${esc}" || region ~ "${esc}"`;
  }
  const res = await pb.collection("coffees").getList(1, 100, opts);
  return res.items;
}

// For dedupe suggestions while typing a new coffee's name.
export async function searchCoffeesByName(name) {
  const q = (name || "").trim();
  if (q.length < 2) return [];
  const esc = q.replace(/"/g, '\\"');
  const res = await pb.collection("coffees").getList(1, 6, { filter: `name ~ "${esc}"`, sort: "-created" });
  return res.items;
}

export async function getCoffee(id) {
  return pb.collection("coffees").getOne(id, { expand: "added_by" });
}

// fields: plain object. imageBlob: optional Blob to upload as the package photo.
export async function createCoffee(fields, imageBlob) {
  const body = buildCoffeeBody(fields, imageBlob);
  return pb.collection("coffees").create(body);
}

export async function updateCoffee(id, fields, imageBlob) {
  const body = buildCoffeeBody(fields, imageBlob);
  return pb.collection("coffees").update(id, body);
}

export async function deleteCoffee(id) {
  return pb.collection("coffees").delete(id);
}

function buildCoffeeBody(fields, imageBlob) {
  const base = {
    name: fields.name || "",
    roaster: fields.roaster || "",
    origin: fields.origin || "",
    region: fields.region || "",
    producer: fields.producer || "",
    varietal: fields.varietal || "",
    process: fields.process || "",
    roast_level: fields.roastLevel || "",
    altitude: fields.altitude || "",
    harvest: fields.harvest || "",
    importer: fields.importer || "",
    tags: fields.tags || [],
    bag_notes: fields.notes || "",
    added_by: fields.added_by || currentUser()?.id,
  };
  if (imageBlob || fields._clearImage) {
    const fd = new FormData();
    Object.entries(base).forEach(([k, v]) => {
      fd.append(k, k === "tags" ? JSON.stringify(v) : (v == null ? "" : v));
    });
    if (imageBlob) fd.append("image", imageBlob, "package.jpg");
    else fd.append("image", ""); // explicit clear
    return fd;
  }
  return base;
}

// URL for a coffee's package photo (or "" if none). thumb e.g. "300x300".
export function coffeeImageUrl(record, thumb = "") {
  if (!record?.image) return "";
  return pb.files.getURL(record, record.image, thumb ? { thumb } : {});
}

// ── Tastings ───────────────────────────────────────────────

// All tastings (used to show average scores in the catalog list).
export async function listAllTastings() {
  return pb.collection("tastings").getFullList({ sort: "-tasted_on" });
}

// Recent tastings across everyone, for the feed.
export async function listRecentTastings(limit = 50) {
  const res = await pb.collection("tastings").getList(1, limit, { sort: "-created", expand: "user,coffee" });
  return res.items;
}

// Everything one person has tasted (for their profile).
export async function listTastingsByUser(userId) {
  return pb.collection("tastings").getFullList({ filter: `user = "${userId}"`, sort: "-tasted_on", expand: "coffee" });
}

export async function getUser(id) {
  return pb.collection("users").getOne(id);
}

// The current user's household (group) + its members. Null if not in one.
export async function getMyHousehold() {
  const me = currentUser()?.id;
  if (!me) return null;
  const mine = await pb.collection("group_members").getFullList({ filter: `user = "${me}"`, expand: "group" });
  if (!mine.length) return null;
  const groupId = mine[0].group;
  const members = await pb.collection("group_members").getFullList({ filter: `group = "${groupId}"`, expand: "user" });
  return {
    group: mine[0].expand?.group,
    memberIds: members.map((m) => m.user),
    members: members.map((m) => m.expand?.user).filter(Boolean),
  };
}

// All tastings with their coffee + rater attached (for palate analysis).
export async function listTastingsExpanded() {
  return pb.collection("tastings").getFullList({ expand: "user,coffee", sort: "-tasted_on" });
}

// Compact palate signature for "should I buy?" verdicts — per-attribute averages
// for the user and (if in a household) the household combined.
// Returns: { me: { count, avg, tags, origins, processes, varietals, roasts },
//            household: same shape (only if memberIds.length > 1) }
function _statsFor(tastings) {
  const acc = { count: 0, scores: [], tags: {}, origins: {}, processes: {}, varietals: {}, roasts: {} };
  tastings.forEach((t) => {
    const s = Number(t.score);
    const c = t.expand?.coffee;
    if (!s || !c) return;
    acc.count++;
    acc.scores.push(s);
    (c.tags || []).forEach((tag) => { (acc.tags[tag] ||= []).push(s); });
    if (c.origin) (acc.origins[c.origin] ||= []).push(s);
    if (c.process) (acc.processes[c.process] ||= []).push(s);
    if (c.varietal) (acc.varietals[c.varietal] ||= []).push(s);
    if (c.roast_level) (acc.roasts[c.roast_level] ||= []).push(s);
  });
  const avg = (a) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : null;
  const toMap = (obj) => Object.fromEntries(
    Object.entries(obj)
      .map(([k, arr]) => [k, { avg: Number(avg(arr).toFixed(2)), n: arr.length }])
      .sort((a, b) => b[1].n - a[1].n)
      .slice(0, 12)
  );
  return {
    count: acc.count,
    avg: avg(acc.scores) ? Number(avg(acc.scores).toFixed(2)) : null,
    tags: toMap(acc.tags),
    origins: toMap(acc.origins),
    processes: toMap(acc.processes),
    varietals: toMap(acc.varietals),
    roasts: toMap(acc.roasts),
  };
}

export async function palateSummary({ userId, memberIds }) {
  const ids = memberIds && memberIds.length ? memberIds : [userId];
  const filter = ids.map((id) => `user = "${id}"`).join(" || ");
  const tastings = await pb.collection("tastings").getFullList({ filter, expand: "coffee" });
  const me = _statsFor(tastings.filter((t) => t.user === userId));
  const household = ids.length > 1 ? _statsFor(tastings) : null;
  return { me, household };
}

// Return the current user's household, creating one if they don't have it yet.
export async function ensureMyHousehold() {
  const existing = await getMyHousehold();
  if (existing?.group) return existing;
  const me = currentUser();
  const group = await pb.collection("groups").create({ name: `${me.name}'s household`, created_by: me.id });
  await pb.collection("group_members").create({ group: group.id, user: me.id, role: "owner" });
  return { group, memberIds: [me.id], members: [me] };
}

export async function listUsers() {
  return pb.collection("users").getFullList({ sort: "name" });
}

// ── Invites (admin) ────────────────────────────────────────

export function randomInviteCode() {
  const words = ["BEAN", "BREW", "ROAST", "CREMA", "GRIND", "POUR", "CUP", "DRIP"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${w}-${n}`;
}

export async function listInvites() {
  return pb.collection("invites").getFullList({ sort: "-created", expand: "used_by,created_by" });
}

export async function createInvite({ kind = "join_group", group = null, code } = {}) {
  return pb.collection("invites").create({
    code: code || randomInviteCode(),
    kind, group: group || null,
    created_by: currentUser()?.id,
  });
}

export async function deleteInvite(id) {
  return pb.collection("invites").delete(id);
}

export async function listTastingsForCoffee(coffeeId) {
  return pb.collection("tastings").getFullList({
    filter: `coffee = "${coffeeId}"`,
    sort: "-tasted_on",
    expand: "user",
  });
}

export async function createTasting(fields) {
  return pb.collection("tastings").create({ ...fields, user: currentUser()?.id });
}

export async function updateTasting(id, fields) {
  return pb.collection("tastings").update(id, fields);
}

export async function deleteTasting(id) {
  return pb.collection("tastings").delete(id);
}
