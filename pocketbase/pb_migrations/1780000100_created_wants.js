/// <reference path="../pb_data/types.d.ts" />
// "Want to try": a member circles a coffee they haven't cupped yet (e.g. saved
// from a café scan as a maybe). One row per member per coffee; rows vanish with
// the coffee. Visible to signed-in members like tastings; only the owner can
// add or remove their own.
migrate((app) => {
  const collection = new Collection({
    "createRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "user = @request.auth.id",
    "listRule": "@request.auth.id != ''",
    "viewRule": "@request.auth.id != ''",
    "updateRule": null,
    "fields": [
      {
        "autogeneratePattern": "[a-z0-9]{15}",
        "help": "",
        "hidden": false,
        "id": "text3208210256",
        "max": 15,
        "min": 15,
        "name": "id",
        "pattern": "^[a-z0-9]+$",
        "presentable": false,
        "primaryKey": true,
        "required": true,
        "system": true,
        "type": "text"
      },
      {
        "cascadeDelete": true,
        "collectionId": "pbc_3630618622",
        "help": "",
        "hidden": false,
        "id": "relation1401235892",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "coffee",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "cascadeDelete": true,
        "collectionId": "_pb_users_auth_",
        "help": "",
        "hidden": false,
        "id": "relation2375276106",
        "maxSelect": 1,
        "minSelect": 0,
        "name": "user",
        "presentable": false,
        "required": true,
        "system": false,
        "type": "relation"
      },
      {
        "hidden": false,
        "id": "autodate2990389176",
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      }
    ],
    "id": "pbc_2201190001",
    "indexes": [
      "CREATE UNIQUE INDEX `idx_wants_user_coffee` ON `wants` (`user`, `coffee`)"
    ],
    "name": "wants",
    "system": false,
    "type": "base"
  });
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2201190001");
  return app.delete(collection);
});
