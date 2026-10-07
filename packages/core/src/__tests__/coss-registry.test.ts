import assert from "node:assert/strict"
import { registryItemSchema, registrySchema } from "shadcn/schema"
import { presetRegistry, presets } from "../coss/theme"

test("every preset is a schema-valid shadcn registry item listed in the index", () => {
  const { items, index } = presetRegistry()
  assert.deepEqual(
    items.map((item) => item.name),
    ["default", ...Object.keys(presets)]
  )
  for (const item of items) registryItemSchema.parse(item)
  registrySchema.parse(index)
  assert.deepEqual(
    index.items.map((item) => item.name),
    items.map((item) => item.name)
  )
})
