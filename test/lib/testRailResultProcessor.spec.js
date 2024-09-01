import { afterEach, describe, expect, it, vi } from "vitest"
import getEnv from "../../lib/environment"
import { setEnvVars } from "../utils/env"
import { makeFakeAssertion } from "../utils/fake"
const TestRailResultProcessor = require("../../lib/testRailResultProcessor")
const Logger = require("../../lib/logger")

const makefakeProcessor = (env = {}, results = []) => {
  setEnvVars(vi, env)
  const setEnv = getEnv()
  return new TestRailResultProcessor(setEnv, results)
}

const fakeLog = {
  error: null,
}

describe("TestRailResultProcessor", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })
  describe("createTestCaseResult", () => {
    it("creates a basic test case result for a passing test", () => {
      const mockAssertion = makeFakeAssertion("C1 Single test case")
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.case_id).toEqual("1")
      expect(result.status_id).toEqual(1)
      expect(result.comment).toEqual("C1 Single test case")
      expect(result.elapsed).toEqual("1s")
    })
  })
})
