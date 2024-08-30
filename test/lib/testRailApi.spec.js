import { afterEach, describe, expect, it, vi } from "vitest"
import { setEnvVars } from "../utils/env"
import { makeFakeRequest, makeFakeTestRailApi } from "../utils/fake"

describe("TestRailApi", () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  describe("constructor", () => {
    it("adds X-API-IDENT header when betaApi is set to true", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)

      // act
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_BETA_API: "true",
      })

      // assert
      expect(sut.headers["X-API-IDENT"]).toBe("BETA")
    })

    it("does not add X-API-IDENT header when betaApi is set to false", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)

      // act
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_BETA_API: "false",
      })

      // assert
      expect(sut.headers["X-API-IDENT"]).toBeUndefined()
    })
  })

  describe("getProjectInfo", () => {
    it("sends reqeust to DOMAIN/api/v2/get_project/testProjectId when suiteId is not set", () => {
      // arrange
      setEnvVars(vi, { projectId: "123" })
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest, { projectId: "123" })

      // act
      sut.getProjectInfo()

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_project/testProjectId",
        expect.anything(),
      )
    })

    it("sends request to DOMAIN/api_v2_get_suite/:suiteId when suiteId is set", () => {
      // arrange
      setEnvVars(vi, { TESTRAIL_SUITEID: "456", TESTRAIL_PROJECTID: "123" })
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest)

      // act
      sut.getProjectInfo()

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_suite/456",
        expect.anything(),
      )
    })
  })

  describe("getRuns", () => {
    it("sends request to DOMAIN/api/v2/get_runs/:projectId when suiteId is not set", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PROJECTID: "123",
      })

      // act
      sut.getRuns()

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_runs/123",
        expect.anything(),
      )
    })
  })

  describe("getRun", () => {
    it("sends request to DOMAIN/api/v2/get_run/:runId", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest)

      // act
      sut.getRun("456")

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_run/456",
        expect.anything(),
      )
    })
  })

  describe("getCases", () => {
    it("sends request to DOMAIN/api/v2/get_cases/:projectId when suiteId is not set", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        _links: {
          next: null,
        },
        cases: [
          { id: 1, title: "case1" },
          { id: 2, title: "case2" },
        ],
      })
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PROJECTID: "123",
      })

      // act
      sut.getCases()

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_cases/123",
        expect.anything(),
      )
    })

    it("sends request to DOMAIN/api/v2/get_cases/:projectId&suite_id=:suiteId when suiteId is set", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi, {
        _links: {
          next: null,
        },
        cases: [
          { id: 1, title: "case1" },
          { id: 2, title: "case2" },
        ],
      })
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PROJECTID: "123",
        TESTRAIL_SUITEID: "456",
      })

      // act
      sut.getCases()

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_cases/123&suite_id=456",
        expect.anything(),
      )
    })

    it("handles pagination when there are multiple pages of cases", () => {
      // arrange
      const fakeRequest = vi
        .fn()
        .mockReturnValueOnce({
          getBody: () =>
            JSON.stringify({
              _links: { next: "/api/v2/get_cases/123&offset=100" },
              cases: [{ id: 1, title: "case1" }],
            }),
        })
        .mockReturnValueOnce({
          getBody: () =>
            JSON.stringify({
              _links: { next: null },
              cases: [{ id: 2, title: "case2" }],
            }),
        })
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PROJECTID: "123",
      })

      // act
      const result = sut.getCases()

      // assert
      expect(fakeRequest).toHaveBeenCalledTimes(2)
      expect(result).toEqual([
        { id: 1, title: "case1" },
        { id: 2, title: "case2" },
      ])
    })
  })
  describe("addRun", () => {
    it("sends request to DOMAIN/api/v2/add_run/:projectId", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PROJECTID: "123",
      })

      // act
      sut.addRun("title", [])

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/add_run/123",
        expect.anything(),
      )
    })
  })

  describe("addPlanEntry", () => {
    it("sends request to DOMAIN/api/v2/add_plan_entry/:planId", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest, {
        TESTRAIL_PLANID: "123",
      })

      // act
      sut.addPlanEntry("title", [])

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/add_plan_entry/123",
        expect.anything(),
      )
    })
  })

  describe("closeRun", () => {
    it("sends request to DOMAIN/api/v2/close_run/:runId", () => {
      // arrange
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest)

      // act
      sut.closeRun("456")

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "POST",
        "https://example.com/index.php?/api/v2/close_run/456",
        expect.anything(),
      )
    })
  })
})
