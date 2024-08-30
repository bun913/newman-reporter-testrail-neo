import { afterEach, describe, expect, it, vi } from "vitest"
import TestRailReporter from "../../lib/index"

describe("TestRailReporter", () => {
  describe("smoke test", () => {
    it("should be defined", () => {
      expect(TestRailReporter).toBeDefined()
    })
  })
})
