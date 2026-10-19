import { expect, test } from "bun:test"
import { createAppFixture } from "./fixture/app"

const fixture = () =>
  createAppFixture({
    width: 100,
    height: 30,
    config: { animations: false, vim: { enabled: true } } as any,
  })

/** Renders until the frame carries the text, since a keystroke paints on the next frame. */
async function frameHas(setup: Awaited<ReturnType<typeof fixture>>, text: string) {
  for (let attempt = 0; attempt < 50; attempt++) {
    await setup.renderOnce()
    if (setup.captureCharFrame().includes(text)) return true
    await new Promise((resolve) => setTimeout(resolve, 20))
  }
  return false
}

test("prompt inserts spaces in vim insert mode", async () => {
  await using setup = await fixture()
  try {
    await setup.ready
    expect(await frameHas(setup, "-- INSERT --")).toBe(true)
    setup.mockInput.pressKey("a")
    setup.mockInput.pressKey(" ")
    setup.mockInput.pressKey("b")
    expect(await frameHas(setup, "a b")).toBe(true)
  } finally {
    setup.renderer.destroy()
  }
})

test("prompt shows the vim mode and inserts spaces after re-entering insert mode", async () => {
  await using setup = await fixture()
  try {
    await setup.ready
    expect(await frameHas(setup, "-- INSERT --")).toBe(true)
    setup.mockInput.pressKey("a")
    expect(await frameHas(setup, "a")).toBe(true)

    // Normal mode is announced, so the prompt never looks like a text field
    // that silently drops keys.
    setup.mockInput.pressEscape()
    expect(await frameHas(setup, "-- NORMAL --")).toBe(true)
    expect(setup.captureCharFrame()).not.toContain("-- INSERT --")

    setup.mockInput.pressKey("i")
    expect(await frameHas(setup, "-- INSERT --")).toBe(true)

    setup.mockInput.pressKey(" ")
    setup.mockInput.pressKey("b")
    expect(await frameHas(setup, "a b")).toBe(true)
  } finally {
    setup.renderer.destroy()
  }
})

test("the vim mode indicator keeps its width next to a long location", async () => {
  await using setup = await createAppFixture({
    width: 80,
    height: 30,
    config: { animations: false, vim: { enabled: true } } as any,
  })
  try {
    await setup.ready
    expect(await frameHas(setup, "-- INSERT --")).toBe(true)
    setup.mockInput.pressEscape()
    expect(await frameHas(setup, "-- NORMAL --")).toBe(true)

    // The indicator is never squeezed or wrapped onto another row, so the
    // mode stays readable next to a long path.
    const footer = setup
      .captureCharFrame()
      .split("\n")
      .filter((line) => line.includes("NORMAL"))
    expect(footer).toHaveLength(1)
    expect(footer[0]).toContain("-- NORMAL -- ")
  } finally {
    setup.renderer.destroy()
  }
})
