import { afterEach, describe, expect, it, vi } from "vitest"
import getEnv from "../../lib/environment"
import TestRailResultSender from "../../lib/tsetRailResultSender"
import { setEnvVars } from "../utils/env"
import {
  makeAllFakeApi,
  makeFakeAddResultsResponse,
  makeFakeJsonfiyResult,
  makeFakeRequest,
  makeFakeTestRailApi,
  makeTestrailReporterWithFakeApi,
} from "../utils/fake"
import makeNewmanResult from "../utils/newman"

const makeFakeSender = (vi, env = {}, fakeRequest = undefined) => {
  setEnvVars(vi, env)
  const fakeEnv = getEnv()
  if (fakeRequest === undefined) {
    return new TestRailResultSender(
      makeFakeTestRailApi(vi, makeFakeRequest(vi)),
      fakeEnv,
    )
  }
  return new TestRailResultSender(makeFakeTestRailApi(vi, fakeRequest), fakeEnv)
}

describe("TestRailResultSender", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  describe("sendResults", () => {
    it("sendResults outputs an error message if no test cases were found", () => {
      // arrange
      const errorSpy = vi.spyOn(console, "error")
      const sut = makeFakeSender(vi)
      const results = []

      // act
      const result = sut.sendResults(results)

      // assert
      expect(errorSpy).toHaveBeenCalledWith(
        "\nnewman-reporter-testrail-neo: No test cases were found.",
      )
    })

    it("returns runInfo if test cases were found", () => {
      // arrange
      const projectName = "testProject"
      const fakeApi = makeAllFakeApi(vi, {}, projectName)
      const env = getEnv()
      const sut = new TestRailResultSender(fakeApi, env)

      // act
      const result = sut.sendResults(makeFakeJsonfiyResult(vi))

      // assert
      expect(result).toHaveProperty("runId")
      expect(result).toHaveProperty("url")
    })
  })

  describe("determineTestRailRun", () => {
    it("fetch existing TestRail runid from TestRail when TEST_RAIL_RUNID is set", () => {
      // arrange
      const sut = makeFakeSender(vi, { TESTRAIL_RUNID: "123" })

      // act
      sut.determineTestRailRun([])

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_run/123",
        expect.anything(),
      )
    })

    it("creates a new TestRail run under the TestPlan when TESTRAIL_PLANID is set", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        runs: [{ id: "789", url: "https://example.com/hoge" }],
      })
      const sut = makeFakeSender(vi, { TESTRAIL_PLANID: "456" }, fakeRequest)

      // act
      sut.determineTestRailRun([])

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/add_plan_entry/456",
        expect.anything(),
      )
    })

    it("creates a new TestRail run under the project when no TESTRAIL_PLANID and TEST_RAIL_RUNID are set", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        id: "123",
        url: "https://example.com/hoge",
      })
      const sut = makeFakeSender(vi, {}, fakeRequest)

      // act
      sut.determineTestRailRun([])

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/add_run/testProjectId",
        expect.anything(),
      )
    })
  })

  describe("getExistingRun", () => {
    it("fetches the latest run under the project when TEST_RAIL_RUNID is set to 'latest'", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        runs: [{ id: "789", url: "https://example.com/hoge" }],
      })
      const sut = makeFakeSender(vi, { TESTRAIL_RUNID: "latest" }, fakeRequest)

      // act
      sut.getExistingRun()

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_runs/testProjectId",
        expect.anything(),
      )
    })

    it("fetches the run when TEST_RAIL_RUNID is set to a specific run id", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        url: "https://example.com/hoge",
      })
      const sut = makeFakeSender(vi, { TESTRAIL_RUNID: "555" }, fakeRequest)

      // act
      sut.getExistingRun()

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_run/555",
        expect.anything(),
      )
    })
  })

  describe("getRunTitle", () => {
    it("returns the project name and current date if no title is set", () => {
      // arrange
      const sut = makeFakeSender(vi, {})
      sut.testRailApi.getProjectInfo = vi.fn().mockReturnValue({
        getBody: () => JSON.stringify({ name: "testProject" }),
      })

      // act
      const result = sut.getRunTitle()

      // assert
      expect(result).toContain("testProject: Automated Test Run")
    })

    it("returns the title if set", () => {
      // arrange
      const sut = makeFakeSender(vi, { TESTRAIL_TITLE: "Test Title" })

      // act
      const result = sut.getRunTitle()

      // assert
      expect(result).toEqual("Test Title")
    })
  })

  describe("addResultsToTestRail", () => {
    it("adds results under the specific run to TestRail", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeSender(vi, {}, fakeRequest)

      // act
      sut.addResultsToTestRail({ runId: "123" }, [])

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/add_results_for_cases/123",
        expect.anything(),
      )
    })
  })

  describe("logTestRailUrl", () => {
    it("logs the TestRail URL", () => {
      // arrange
      const logSpy = vi.spyOn(console, "log")
      const sut = makeFakeSender(vi, {})

      // act
      sut.logTestRailUrl("https://example.com/hoge")

      // assert
      expect(logSpy).toHaveBeenCalledWith("\nhttps://example.com/hoge")
    })
  })

  describe("closeRunIfNeeded", () => {
    it("closes the run if the env variable is not set to false", () => {
      // arrange
      const sut = makeFakeSender(vi, { TESTRAIL_CLOSE_RUN: "true" })

      // act
      sut.closeRunIfNeeded("123")

      // assert
      expect(sut.testRailApi.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/close_run/123",
        expect.anything(),
      )
    })

    it("does not close the run if the env variable is set to false", () => {
      // arrange
      const sut = makeFakeSender(vi, { TESTRAIL_CLOSE_RUN: "false" })

      // act
      sut.closeRunIfNeeded("123")

      // assert
      expect(sut.testRailApi.request).not.toHaveBeenCalled()
    })
  })
})
