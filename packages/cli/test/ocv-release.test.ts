import { describe, expect, test } from "bun:test"
import { isOcvUpdate } from "../src/services/updater"

describe("ocv release comparison", () => {
  test("a newer upstream version is an update", () => {
    expect(isOcvUpdate("2.0.32-ocv.5.0", "2.0.33-ocv.5.0")).toBe(true)
    expect(isOcvUpdate("1.18.35-ocv.4.13", "2.0.0-ocv.5.0")).toBe(true)
  })

  test("an older upstream version is not an update", () => {
    // The published ocv release still tracks opencode v1, so a v2 build must
    // not be told to install it.
    expect(isOcvUpdate("2.0.32-ocv.5.0", "1.18.35-ocv.4.13")).toBe(false)
    expect(isOcvUpdate("2.0.32-ocv.5.0", "1.18.35-ocv.9.9")).toBe(false)
  })

  test("the same upstream version needs a newer track", () => {
    expect(isOcvUpdate("2.0.32-ocv.5.0", "2.0.32-ocv.5.1")).toBe(true)
    expect(isOcvUpdate("2.0.32-ocv.5.1", "2.0.32-ocv.5.0")).toBe(false)
    expect(isOcvUpdate("2.0.32-ocv.5.0", "2.0.32-ocv.5.0")).toBe(false)
  })

  test("an unreadable release is never an update", () => {
    expect(isOcvUpdate("2.0.32-ocv.5.0", "not-a-version")).toBe(false)
  })

  test("a build without a version takes the release", () => {
    expect(isOcvUpdate("local", "2.0.32-ocv.5.0")).toBe(true)
  })
})
