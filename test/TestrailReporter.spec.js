import { afterEach, describe, expect, it, vi } from "vitest"
import TestrailReporter from "../lib/TestrailReporter"
import getEnv from "../lib/environment"
import { makeSampleEmitter } from "./utils/emitter"
import { setEnvVars } from "./utils/env"
import {
  makeFakeJsonifyResult,
  makeTestrailReporterWithFakeApi,
} from "./utils/fake"
import makeNewmanResult from "./utils/newman"

describe("TestrailReporter", () => {
  describe("onComplete", () => {
    describe("raise error when required options are missing", () => {
      afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllEnvs()
      })
      it("raise error when domain option is missing", () => {
        // arrange
        const erroSpy = vi.spyOn(console, "error")
        vi.stubEnv("TESTRAIL_USERNAME", "username")
        vi.stubEnv("TESTRAIL_APIKEY", "apikey")
        vi.stubEnv("TESTRAIL_PROJECTID", "projectid")
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})

        // act
        sut.onComplete()

        // assert
        expect(erroSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "A required environment variable domain was not found.",
          ),
        )
      })

      it("raise error when username option is missing", () => {
        // arrange
        const erroSpy = vi.spyOn(console, "error")
        vi.stubEnv("TESTRAIL_DOMAIN", "domain")
        vi.stubEnv("TESTRAIL_APIKEY", "apikey")
        vi.stubEnv("TESTRAIL_PROJECTID", "projectid")
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})

        // act
        sut.onComplete()

        // assert
        expect(erroSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "A required environment variable username was not found.",
          ),
        )
      })

      it("raise error when apikey option is missing", () => {
        // arrange
        const erroSpy = vi.spyOn(console, "error")
        vi.stubEnv("TESTRAIL_DOMAIN", "domain")
        vi.stubEnv("TESTRAIL_USERNAME", "username")
        vi.stubEnv("TESTRAIL_PROJECTID", "projectid")
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})

        // act
        sut.onComplete()

        // assert
        expect(erroSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "A required environment variable apikey was not found.",
          ),
        )
      })

      it("raise error when projectid option is missing", () => {
        // arrange
        const erroSpy = vi.spyOn(console, "error")
        vi.stubEnv("TESTRAIL_DOMAIN", "domain")
        vi.stubEnv("TESTRAIL_USERNAME", "username")
        vi.stubEnv("TESTRAIL_APIKEY", "apikey")
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})

        // act
        sut.onComplete()

        // assert
        expect(erroSpy).toHaveBeenCalledWith(
          expect.stringContaining(
            "A required environment variable projectId was not found.",
          ),
        )
      })
    })
  })

  describe("jsonifyResults", () => {
    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    describe("converts newwman test results to TestRail-compatible JSON format", () => {
      it("converts a test result to one TestRail test run", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult()

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(1)
        expect(sut.results[0].case_id).toBe("01")
      })

      it("converts two mapped test case to two TestRail testruns", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ caseNumbers: "C01 C02" })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(2)
        expect(sut.results[0].case_id).toBe("01")
        expect(sut.results[1].case_id).toBe("02")
      })

      it("converts two test cases to two TestRail test runs", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult().concat(
          makeNewmanResult({ caseNumbers: "C02" }),
        )

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(2)
        expect(sut.results[0].case_id).toBe("01")
        expect(sut.results[1].case_id).toBe("02")
      })
    })

    describe("failed test case handling", () => {
      it("converts a failed test case to a failed TestRail test run", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ error: true })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(1)
        expect(sut.results[0].case_id).toBe("01")
        // status_id: https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/statuses/
        expect(sut.results[0].status_id).toBe(5)
      })
    })

    describe("skipped test case handling", () => {
      it("converts a skipped test case to a skipped TestRail test run", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ skipped: true })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(1)
        expect(sut.results[0].case_id).toBe("01")
        // status_id: https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/statuses/
        expect(sut.results[0].status_id).toBe(4)
      })
    })

    describe("umarked test case handling", () => {
      it("skip when not including test caseid top of the test case title", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ caseNumbers: "" })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(0)
      })
    })

    describe("TESTRAIL_STEPS env value is", () => {
      describe("true: reports multiple assertions as a steps if they have same test case ids", () => {
        it("reports as an failed test case when one step fails, even if others succeed", () => {
          // arrange
          setEnvVars(vi)
          vi.stubEnv("TESTRAIL_STEPS", "true")
          const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
          sut.env = getEnv()
          const executions = makeNewmanResult({
            caseNumbers: "C1",
            error: true,
          }).concat(makeNewmanResult({ caseNumbers: "C1" }))

          // act
          sut.jsonifyResults(executions)

          // assert
          expect(sut.results).lengthOf(1)
          // status_id: https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/statuses/
          expect(sut.results[0].status_id).toBe(5)
        })

        it("resports as an success test case when all steps are success", () => {
          // arrange
          setEnvVars(vi)
          vi.stubEnv("TESTRAIL_STEPS", "true")
          const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
          sut.env = getEnv()
          const executions = makeNewmanResult({ caseNumbers: "C1" }).concat(
            makeNewmanResult({ caseNumbers: "C1" }),
          )

          // act
          sut.jsonifyResults(executions)

          // assert
          expect(sut.results).lengthOf(1)
          // status_id: https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/statuses/
          expect(sut.results[0].status_id).toBe(1)
        })
      })

      describe("false (default value): reports multipe assertions as multiple test results", () => {
        it("reports as two test results", () => {
          // arrange
          setEnvVars(vi)
          vi.stubEnv("TESTRAIL_STEPS", "false")
          const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
          sut.env = getEnv()
          const executions = makeNewmanResult({
            caseNumbers: "C1",
            error: true,
          }).concat(makeNewmanResult({ caseNumbers: "C1" }))

          // act
          sut.jsonifyResults(executions)

          // assert
          expect(sut.results).lengthOf(2)
          // status_id: https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/statuses/
          expect(sut.results[0].status_id).toBe(5)
          expect(sut.results[1].status_id).toBe(1)
        })
      })
    })

    describe("User wants to establish connection by title not by case id", () => {
      describe("When TESTRAIL_TITLE_MATCHING env value is `true`", () => {
        it("Newman assertions with title `TestTitle` matched to TestRail test case with `TestTitle`", () => {
          // arrange
          setEnvVars(vi)
          vi.stubEnv("TESTRAIL_TITLE_MATCHING", "true")
          const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
          sut.testRailApi.getCases = vi
            .fn()
            .mockReturnValueOnce([{ id: 1, title: "TestTitle" }])
          sut.env = getEnv()
          const executions = makeNewmanResult({ assertionName: "TestTitle" })

          // act
          sut.jsonifyResults(executions)

          // assert
          expect(sut.results).lengthOf(1)
          expect(sut.results[0].case_id).toBe("1")
        })

        it("Newman assertions with title `NoMatchedTitle` not matched to TestRail test case with `TestTitle`", () => {
          // arrange
          setEnvVars(vi)
          vi.stubEnv("TESTRAIL_TITLE_MATCHING", "true")
          const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
          sut.testRailApi.getCases = vi
            .fn()
            .mockReturnValueOnce([{ id: 1, title: "TestTitle" }])
          sut.env = getEnv()
          const executions = makeNewmanResult({
            assertionName: "NoMatchedTitle",
          })

          // act
          sut.jsonifyResults(executions)

          // assert
          expect(sut.results).lengthOf(0)
        })
      })
    })

    describe("test rail v1 API", () => {
      it("works for TestRail v1 api", () => {
        // arrange
        setEnvVars(vi)
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ tldOnly: true })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results).lengthOf(1)
        expect(sut.results[0].case_id).toBe("01")
        expect(sut.results[0].status_id).toBe(1)
      })
    })

    describe("custome env value", () => {
      it("include a custom_key_value in result json when TESTRAIL_CUSTOM_$HOGE setted", () => {
        // arrange
        setEnvVars(vi)
        vi.stubEnv("TESTRAIL_CUSTOM_customenvvar", "123")
        const sut = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
        sut.env = getEnv()
        const executions = makeNewmanResult({ tldOnly: true })

        // act
        sut.jsonifyResults(executions)

        // assert
        expect(sut.results[0].customenvvar).toBe("123")
      })
    })
  })

  describe("pushToTestRail", () => {
    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    describe("when results are available", () => {
      it("uses provided title when title is set", () => {
        // arrange
        const testTitle = "testTitle"
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.title = testTitle
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.addRun).toHaveBeenCalledWith(
          testTitle,
          expect.anything(),
        )
      })

      it("uses `${projectName}: Automated YYYY-MM-DD` formmated title when title is not set", () => {
        // arrange
        const title = "testProjectName2"
        const sut = makeTestrailReporterWithFakeApi(vi, {}, title)
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.addRun).toHaveBeenCalledWith(
          // title,
          expect.stringContaining(`${title}: Automated`),
          expect.anything(),
        )
      })
    })

    describe("when runId is set", () => {
      it("uses provided runId when runId environemnt variable is set", () => {
        // arrange
        const runId = "123"
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.runId = runId
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.addResults).toHaveBeenCalledWith(
          runId,
          expect.anything(),
        )
      })

      it("get latest runId from Testrail when runId is equal to 'latest'", () => {
        // arrange
        const runId = "latest"
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.runId = runId
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.getRuns).toHaveBeenCalled()
      })
    })

    describe("when testPlan id is set", () => {
      it("add new test-run under the project and use the tet-run id to add results", () => {
        // arrange
        const testPlanId = "123"
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.testPlanId = testPlanId
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.addPlanEntry).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
        )
        expect(sut.testRailApi.addResults).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
        )
      })

      it("runId is used if both testPlan and run-id are set", () => {
        // arrange
        const testPlanId = "123"
        const runId = "456"
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.testPlanId = testPlanId
        sut.env.runId = runId
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.addPlanEntry).not.toHaveBeenCalled()
      })
    })

    describe("when closeRun is set", () => {
      it("close the run when closeRun is not set to 'false'", () => {
        // arrange
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.closeRun = "true"
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.closeRun).toHaveBeenCalled()
      })

      it("does not close the run when closeRun is set to 'false'", () => {
        // arrange
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.env.closeRun = "false"
        sut.results = makeFakeJsonifyResult()

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(sut.testRailApi.closeRun).not.toHaveBeenCalled()
      })
    })

    describe("when no results are available", () => {
      it("does not call any TestRail API", () => {
        // arrange
        const sut = makeTestrailReporterWithFakeApi(vi)
        sut.results = []
        const consoleSpy = vi.spyOn(console, "error")

        // act
        sut.pushToTestrail({ summary: {} })

        // assert
        expect(consoleSpy).toHaveBeenCalledWith(
          "\nnewman-reporter-testrail-neo: No test cases were found.",
        )
      })
    })
  })
})
