#!/usr/bin/env python3
"""Create the Koffeinkartellet schema in a local PocketBase via the Admin REST API.
Idempotent-ish: deletes app collections if they already exist, then recreates them.
"""
import json, urllib.request, urllib.error, sys

BASE = "http://127.0.0.1:8090"
ADMIN_EMAIL = "admin@local.dev"
ADMIN_PASS = "devpassword12345"

def req(method, path, token=None, body=None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    if token:
        r.add_header("Authorization", token)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"  ! {method} {path} -> {e.code}: {e.read().decode()[:400]}")
        raise

# --- auth ---
auth = req("POST", "/api/collections/_superusers/auth-with-password", body={
    "identity": ADMIN_EMAIL, "password": ADMIN_PASS})
TOKEN = auth["token"]
print("authed as superuser")

# --- helpers ---
def find_collection(name):
    try:
        return req("GET", f"/api/collections/{name}", TOKEN)
    except Exception:
        return None

def delete_if_exists(name):
    c = find_collection(name)
    if c and not c.get("system"):
        req("DELETE", f"/api/collections/{c['id']}", TOKEN)
        print(f"deleted existing '{name}'")

def create(coll):
    res = req("POST", "/api/collections", TOKEN, coll)
    print(f"created '{res['name']}' (id={res['id']})")
    return res

def txt(name, required=False, maxlen=0):
    return {"type": "text", "name": name, "required": required, "min": 0, "max": maxlen, "pattern": ""}

def num(name, mn=None, mx=None):
    f = {"type": "number", "name": name, "required": False}
    if mn is not None: f["min"] = mn
    if mx is not None: f["max"] = mx
    return f

def boolean(name):
    return {"type": "bool", "name": name, "required": False}

def jsonf(name):
    return {"type": "json", "name": name, "required": False, "maxSize": 200000}

def datef(name):
    return {"type": "date", "name": name, "required": False}

def autocreated():
    return {"type": "autodate", "name": "created", "onCreate": True, "onUpdate": False}

def autoupdated():
    return {"type": "autodate", "name": "updated", "onCreate": True, "onUpdate": True}

def rel(name, collection_id, required=False, cascade=False, maxSelect=1):
    return {"type": "relation", "name": name, "required": required,
            "collectionId": collection_id, "cascadeDelete": cascade,
            "minSelect": 0, "maxSelect": maxSelect}

def filef(name):
    return {"type": "file", "name": name, "required": False, "maxSelect": 1,
            "maxSize": 5242880, "mimeTypes": ["image/jpeg", "image/png", "image/webp"],
            "thumbs": ["100x100", "300x300"]}

def sel(name, values):
    return {"type": "select", "name": name, "required": False,
            "maxSelect": 1, "values": values}

AUTH_OK = "@request.auth.id != ''"

# --- 1. extend users with color, is_admin, bio ---
users = find_collection("users")
existing_names = {f["name"] for f in users["fields"]}
for f in [txt("color", maxlen=20), boolean("is_admin"), txt("bio", maxlen=500)]:
    if f["name"] not in existing_names:
        users["fields"].append(f)
# logged-in users can view each other's public profile (email stays hidden
# unless emailVisibility); needed for tasting attribution + profiles.
req("PATCH", f"/api/collections/{users['id']}", TOKEN, {
    "fields": users["fields"],
    "listRule": AUTH_OK,
    "viewRule": AUTH_OK,
})
print("extended 'users' with color, is_admin, bio + opened list/view to authed users")

# --- order matters for relations: delete dependents first ---
for name in ["follows", "group_members", "invites", "tastings", "groups", "coffees"]:
    delete_if_exists(name)

# --- 2. coffees (shared catalog) ---
users_id = users["id"]
coffees = create({
    "type": "base", "name": "coffees",
    "fields": [
        txt("name", required=True, maxlen=200), txt("roaster", maxlen=200),
        txt("origin", maxlen=100), txt("region", maxlen=150), txt("producer", maxlen=200),
        txt("varietal", maxlen=100), txt("process", maxlen=60), txt("roast_level", maxlen=40),
        txt("altitude", maxlen=60), txt("harvest", maxlen=80), txt("importer", maxlen=200),
        jsonf("tags"), txt("bag_notes", maxlen=2000), filef("image"),
        num("acidity", 0, 5), num("body", 0, 5), num("sweetness", 0, 5),
        rel("added_by", users_id), autocreated(), autoupdated(),
    ],
    "listRule": AUTH_OK, "viewRule": AUTH_OK, "createRule": AUTH_OK,
    "updateRule": AUTH_OK,
    "deleteRule": "@request.auth.id != '' && (added_by = @request.auth.id || @request.auth.is_admin = true)",
})

# --- 3. groups ---
groups = create({
    "type": "base", "name": "groups",
    "fields": [
        txt("name", required=True, maxlen=120), txt("slug", maxlen=60),
        rel("created_by", users_id), autocreated(),
    ],
    "listRule": AUTH_OK, "viewRule": AUTH_OK, "createRule": AUTH_OK,
    "updateRule": "created_by = @request.auth.id || @request.auth.is_admin = true",
    "deleteRule": "created_by = @request.auth.id || @request.auth.is_admin = true",
})

# --- 4. tastings ---
tastings = create({
    "type": "base", "name": "tastings",
    "fields": [
        rel("coffee", coffees["id"], required=True, cascade=True),
        rel("user", users_id, required=True),
        num("score", 0, 10), num("grind"), txt("notes", maxlen=2000),
        txt("brew_method", maxlen=120), datef("tasted_on"), autocreated(),
    ],
    "listRule": AUTH_OK, "viewRule": AUTH_OK,
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "updateRule": "user = @request.auth.id",
    "deleteRule": "user = @request.auth.id",
})

# --- 5. group_members ---
group_members = create({
    "type": "base", "name": "group_members",
    "fields": [
        rel("group", groups["id"], required=True, cascade=True),
        rel("user", users_id, required=True, cascade=True),
        sel("role", ["owner", "member"]), autocreated(),
    ],
    "listRule": AUTH_OK, "viewRule": AUTH_OK,
    "createRule": AUTH_OK,
    "updateRule": "@request.auth.is_admin = true",
    "deleteRule": "@request.auth.is_admin = true || user = @request.auth.id",
})

# --- 6. invites (admin-issued) ---
invites = create({
    "type": "base", "name": "invites",
    "fields": [
        txt("code", required=True, maxlen=40),
        rel("created_by", users_id),
        rel("group", groups["id"]),
        sel("kind", ["join_group", "new_household"]),
        txt("email_hint", maxlen=200),
        rel("used_by", users_id),
        datef("expires"), autocreated(),
    ],
    # code must be checkable before login (signup), so view/list are public;
    # only admins can create. Tighten later with a hook.
    "listRule": "", "viewRule": "",
    "createRule": "@request.auth.is_admin = true",
    "updateRule": "@request.auth.is_admin = true",
    "deleteRule": "@request.auth.is_admin = true",
})

# --- 7. follows ---
follows = create({
    "type": "base", "name": "follows",
    "fields": [
        rel("follower", users_id, required=True, cascade=True),
        rel("followee", users_id, required=True, cascade=True),
        autocreated(),
    ],
    "listRule": AUTH_OK, "viewRule": AUTH_OK,
    "createRule": "@request.auth.id != '' && follower = @request.auth.id",
    "deleteRule": "follower = @request.auth.id",
})

print("\nAll collections created.")
cols = req("GET", "/api/collections?perPage=100", TOKEN)
names = [c["name"] for c in cols["items"] if not c.get("system")]
print("App collections:", ", ".join(sorted(names)))
