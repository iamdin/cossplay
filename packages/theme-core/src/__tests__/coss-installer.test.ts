import assert from "node:assert/strict"
import { cssInstaller } from "../coss/installer"

function harness(fail: (css: string, previous: string) => boolean) {
  const sent: [string, string][] = []
  let settled = 0
  const installer = cssInstaller(
    async (css, previous) => {
      sent.push([css, previous])
      if (fail(css, previous)) throw Error("transport failed")
    },
    () => {
      settled++
    }
  )
  const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
  return { installer, sent, flush, settled: () => settled }
}

test("failed replacement keeps the acknowledged sheet so disabling still removes it", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  const { installer, sent, flush, settled } = harness((css) => css === "B")
  installer.install("A")
  installer.install("B")
  installer.install("")
  await flush()
  assert.deepEqual(sent, [
    ["A", ""],
    ["B", "A"],
    ["", "A"],
  ])
  assert.equal(installer.active(), false)
  assert.equal(settled(), 3)
})

test("previous sheet is read when the queued operation runs, not when it is requested", async () => {
  const { installer, sent, flush } = harness(() => false)
  installer.install("A")
  installer.install("B")
  installer.install("C")
  await flush()
  assert.deepEqual(sent, [
    ["A", ""],
    ["B", "A"],
    ["C", "B"],
  ])
})

test("an identical request retries after a failure", async () => {
  vi.spyOn(console, "error").mockImplementation(() => {})
  let attempts = 0
  const { installer, sent, flush } = harness(
    (css) => css === "A" && attempts++ === 0
  )
  installer.install("A")
  await flush()
  installer.install("A")
  await flush()
  assert.deepEqual(sent, [
    ["A", ""],
    ["A", ""],
  ])
  installer.install("A")
  await flush()
  assert.equal(sent.length, 2)
})

test("duplicate requests are not sent and active reflects pending USER CSS", async () => {
  const { installer, sent, flush } = harness(() => false)
  assert.equal(installer.active(), false)
  installer.install("A")
  assert.equal(installer.active(), true)
  installer.install("A")
  installer.install("")
  await flush()
  assert.deepEqual(sent, [
    ["A", ""],
    ["", "A"],
  ])
  assert.equal(installer.active(), false)
})
