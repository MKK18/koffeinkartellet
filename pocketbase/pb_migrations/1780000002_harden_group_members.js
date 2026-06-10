/// <reference path="../pb_data/types.d.ts" />
// SECURITY: group_members.createRule was "@request.auth.id != ''" with no
// ownership constraint, so any authed user could insert a membership into ANY
// group (joining private households uninvited) and could set an arbitrary
// `user` relation (adding other people). Require that the row belongs to the
// requester. Invite-based group joins go through the /api/signup hook, which
// runs with $app privileges and bypasses this rule.
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_714390402")
  unmarshal({
    "createRule": "@request.auth.id != \"\" && user = @request.auth.id"
  }, collection)
  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_714390402")
  unmarshal({
    "createRule": "@request.auth.id != \"\""
  }, collection)
  return app.save(collection)
})
