import { afterEach, describe, expect, it, vi } from "vitest"
import getEnv from "../../lib/environment"
import { setEnvVars } from "../utils/env"
import { makeFakeAssertion, makeFakeExecution } from "../utils/fake"
import makeNewmanResult from "../utils/newman"
const TestRailResultProcessor = require("../../lib/testRailResultProcessor")

const makefakeProcessor = (env = {}, results = []) => {
  setEnvVars(vi, env)
  const setEnv = getEnv()
  return new TestRailResultProcessor(setEnv, results)
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
      // arrange
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
      // arrange
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
      // arrange
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

  describe("processExecution", () => {
    it("processes a single test case execution", () => {
      // arrange
      // const fakeExecution = makeNewma
      const sut = makefakeProcessor()
      const fakeExecution = makeNewmanResult({ caseNumbers: "C1" })[0]

      // act
      sut.processExecution(fakeExecution)

      // assert
      expect(sut.results).toHaveLength(1)
      expect(sut.results[0].case_id).toEqual("1")
      expect(sut.results[0].comment).toContain("C1")
      expect(sut.results[0].comment).toContain("Status code is 400")
    })

    it("processes mutliple assertions in a single execution", () => {
      // arrange
      const sut = makefakeProcessor()
      const fakeExecution = makeNewmanResult({ caseNumbers: "C1 C2 C3" })[0]

      // act
      sut.processExecution(fakeExecution)

      // assert
      expect(sut.results).toHaveLength(3)
      expect(sut.results[0].case_id).toEqual("1")
      expect(sut.results[1].case_id).toEqual("2")
      expect(sut.results[2].case_id).toEqual("3")
    })

    it("does not add logging when env.logging is set to 'none'", () => {
      // arrange
      const sut = makefakeProcessor({ TESTRAIL_LOGGING: "none" })
      const fakeExecution = makeNewmanResult({
        assertionName: "C1 No Comment",
      })[0]

      // act
      sut.processExecution(fakeExecution)

      // assert
      expect(sut.results[0].comment).toEqual("C1 No Comment")
    })

    it("set multiple step assertions to a result when env.steps is set to 'true'", () => {
      // arrange
      const sut = makefakeProcessor({ TESTRAIL_STEPS: "true" })
      const fakeExecution = makeNewmanResult({ caseNumbers: "C1" })[0]
      const fake2 = makeNewmanResult({ caseNumbers: "C1" })[0]
      fakeExecution.assertions.push(fake2.assertions[0])

      // act
      sut.processExecution(fakeExecution)

      // assert
      expect(sut.results).toHaveLength(1)
      expect(sut.results[0].custom_step_results).toHaveLength(2)
    })
  })

  describe("processExecutions", () => {
    it("processes multiple executions", () => {
      // arrange
      const sut = makefakeProcessor()
      const fakeExecutions = makeNewmanResult({ caseNumbers: "C1 C2 C3" })

      // act
      sut.processExecutions(fakeExecutions)

      // assert
      expect(sut.results).toHaveLength(3)
      expect(sut.results[0].case_id).toEqual("1")
      expect(sut.results[1].case_id).toEqual("2")
      expect(sut.results[2].case_id).toEqual("3")
    })
  })

  describe("addCustomFields", () => {
    it("adds custom fields to the result", () => {
      // arrange
      const sut = makefakeProcessor({
        TESTRAIL_CUSTOM_FIELD1: "value1",
        TESTRAIL_CUSTOM_FIELD2: "value2",
      })
      const result = {}

      // act
      sut.addCustomFields(result)

      // assert
      expect(result).toMatchObject({
        FIELD1: "value1",
        FIELD2: "value2",
      })
    })
  })

  describe("handleDuplicateFailures", () => {
    it("adds duplicate failing cases when steps is false", () => {
      const sut = makefakeProcessor({
        TESTRAIL_STEPS: "false",
      })
      sut.duplicateFailingCases = ["1", "2"]
      sut.handleDuplicateFailures()

      expect(sut.results).toHaveLength(2)
      expect(sut.results.every((result) => result.status_id === 5)).toBeTruthy()
    })
  })
})
