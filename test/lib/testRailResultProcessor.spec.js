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
    it("creates a basic test case result when a passing test given", () => {
      // arrange
      const mockAssertion = makeFakeAssertion({ name: "C1 Single test case" })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)

      // assert
      expect(result.case_id).toEqual("1")
      expect(result.status_id).toEqual(1)
      expect(result.comment).toEqual("C1 Single test case")
      expect(result.elapsed).toEqual("1s")
    })

    it("creates a faling test case result when a failed test given", () => {
      // arrange
      const mockAssertion = makeFakeAssertion({
        name: "C1 Single test case",
        error: true,
      })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)

      // assert
      expect(result.case_id).toEqual("1")
      expect(result.status_id).toEqual(5)
      expect(result.comment).toEqual("C1 Single test case")
      expect(result.elapsed).toEqual("1s")
    })

    it("creates a skipped test case result when a skipped test given", () => {
      // arrange
      const mockAssertion = makeFakeAssertion({
        name: "C1 Single test case",
        skipped: true,
      })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)

      // assert
      expect(result.case_id).toEqual("1")
      expect(result.status_id).toEqual(4)
      expect(result.comment).toEqual("C1 Single test case")
      expect(result.elapsed).toEqual("1s")
    })

    it("add version to result if provided", () => {
      const mockAssertion = makeFakeAssertion({ name: "C1 Single test case" })
      const testCaseString = "C1"
      const sut = makefakeProcessor({ TESTRAIL_VERSION: "1.0" })

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.version).toEqual("1.0")
    })

    it("add responseTime when provided(2000ms to 2s)", () => {
      const mockAssertion = makeFakeAssertion({
        name: "C1 Single test case",
        response: {
          responseTime: 2000,
        },
      })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.elapsed).toEqual("2s")
    })

    it("add responseTime when provided(2500ms to 3s)", () => {
      const mockAssertion = makeFakeAssertion({
        name: "C1 Single test case",
        response: {
          responseTime: 2500,
        },
      })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.elapsed).toEqual("3s")
    })

    it("add responseTime when provided(2499ms to 2s)", () => {
      const mockAssertion = makeFakeAssertion({
        name: "C1 Single test case",
        response: {
          responseTime: 2499,
        },
      })
      const testCaseString = "C1"
      const sut = makefakeProcessor()

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.elapsed).toEqual("2s")
    })
  })
})
