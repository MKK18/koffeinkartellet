/// <reference path="../pb_data/types.d.ts" />
// SECURITY: invites were world-readable (listRule/viewRule = "") which leaked
// every invite code to anyone, defeating the gated signup. And updateRule had
// been loosened to any authed user. Lock all access to admins only.
// Signup validates + consumes invites server-side via the /api/signup hook,
// which runs with $app privileges and bypasses these rules — so the client
// never needs to read or write invites directly.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2452428166")
  unmarshal({
    "listRule": "@request.auth.is_admin = true",
    "viewRule": "@request.auth.is_admin = true",
    "createRule": "@request.auth.is_admin = true",
    "updateRule": "@request.auth.is_admin = true",
    "deleteRule": "@request.auth.is_admin = true"
  }, collection)
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2452428166")
  unmarshal({
    "listRule": "",
    "viewRule": "",
    "createRule": "@request.auth.is_admin = true",
    "updateRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.is_admin = true"
  }, collection)
  return app.save(collection)
})
