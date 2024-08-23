import { afterEach, describe, expect, it, vi } from "vitest"
import TestrailReporter from "../lib/TestrailReporter"
import { makeSampleEmitter } from "./utils/emitter"

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
})
