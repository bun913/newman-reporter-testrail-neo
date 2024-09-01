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

  // constructor tests would go here if needed

  describe("processExecutions", () => {
    it("processes multiple executions and generates results for three test cases (C1, C2, C3)", () => {
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

  describe("processExecution", () => {
    it("processes a single test case execution (C1) and includes comment and status code 400 in the result", () => {
      // arrange
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

    it("processes multiple assertions (C1, C2, C3) in a single execution and generates three results", () => {
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

    it("does not add comments to the result when TESTRAIL_LOGGING environment variable is set to 'none'", () => {
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

    it("combines multiple step assertions into one result when TESTRAIL_STEPS environment variable is set to 'true'", () => {
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

  // processAssertion and processTestCase tests would go here if needed

  describe("createTestCaseResult", () => {
    it("creates a basic result object for a passing test case (C1)", () => {
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

    it("creates a result object indicating failure for a failed test case (C1)", () => {
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

    it("creates a result object indicating skip for a skipped test case (C1)", () => {
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

    it("adds version information to the result when TESTRAIL_VERSION environment variable is set", () => {
      const mockAssertion = makeFakeAssertion({ name: "C1 Single test case" })
      const testCaseString = "C1"
      const sut = makefakeProcessor({ TESTRAIL_VERSION: "1.0" })

      // act
      const result = sut.createTestCaseResult(testCaseString, mockAssertion)
      expect(result.version).toEqual("1.0")
    })

    it("converts response time of 2000ms to 2s and adds it to the result", () => {
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

    it("rounds up response time of 2500ms to 3s and adds it to the result", () => {
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

    it("rounds down response time of 2499ms to 2s and adds it to the result", () => {
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

  describe("addCustomFields", () => {
    it("adds two custom fields from environment variables to the result object", () => {
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
    it("adds duplicate failing cases as separate results when TESTRAIL_STEPS is 'false'", () => {
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
