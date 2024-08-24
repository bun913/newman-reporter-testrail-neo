import { afterEach, describe, expect, it, vi } from "vitest"
import TestrailReporter from "../lib/TestrailReporter"
import { makeSampleEmitter } from "./utils/emitter"
import { setEnvVars } from "./utils/env"
import makeNewmanResult from "./utils/newman"
import getEnv from "../lib/environment"

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
        console.log(sut.results)
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
})
