/// <reference path="../pb_data/types.d.ts" />
// SECURITY: the users collection had the default public createRule, so anyone
// could POST /api/collections/users/records and register WITHOUT an invite —
// the invite gate was only enforced in client JS. Lock direct creation to
// admins; legitimate signups go through the /api/signup hook (runs with $app
// privileges, bypasses this rule, and requires a valid invite code).
migrate((app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  unmarshal({ "createRule": "@request.auth.is_admin = true" }, collection)
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("_pb_users_auth_")
  unmarshal({ "createRule": "" }, collection)
  return app.save(collection)
})
