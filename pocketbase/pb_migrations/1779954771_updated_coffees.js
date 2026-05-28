/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3630618622")

  // add field
  collection.fields.addAt(18, new Field({
    "help": "",
    "hidden": false,
    "id": "number992417142",
    "max": 5,
    "min": 0,
    "name": "acidity",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(19, new Field({
    "help": "",
    "hidden": false,
    "id": "number3685223346",
    "max": 5,
    "min": 0,
    "name": "body",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(20, new Field({
    "help": "",
    "hidden": false,
    "id": "number1554795483",
    "max": 5,
    "min": 0,
    "name": "sweetness",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3630618622")

  // remove field
  collection.fields.removeById("number992417142")

  // remove field
  collection.fields.removeById("number3685223346")

  // remove field
  collection.fields.removeById("number1554795483")

  return app.save(collection)
})
