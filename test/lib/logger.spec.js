import { afterEach, describe, expect, it, vi } from "vitest"
import Logger from "../../lib/logger"
import { makeFakeExecution } from "../utils/fake"

describe("Logger", () => {
  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  describe("getLogging", () => {
    it("always url from the newman execution in the log", () => {
      // arrange
      const logger = new Logger()
      const execution = makeFakeExecution()

      // act
      const log = logger.getLogging(execution)

      // assert
      expect(log.url).toContain("https://example.com/api/v1")
    })

    it("includes query parameters in the url if present", () => {
      const logger = new Logger()
      const execution = makeFakeExecution({
        request: {
          method: "GET",
          url: {
            protocol: "https",
            host: ["example", "com"],
            path: ["api", "v1"],
            query: { members: [{ key: "param", value: "value" }] },
          },
          headers: [{ key: "Content-Type", value: "application/json" }],
          body: "",
        },
      })

      const log = logger.getLogging(execution)

      expect(log.url).toBe(
        "Request: GET https://example.com/api/v1?param=value",
      )
    })

    it("only returns url when TESTRAIL_LOGGING env variable is set to 'none'", () => {
      vi.stubEnv("TESTRAIL_LOGGING", "none")
      const logger = new Logger()
      const execution = makeFakeExecution()

      const log = logger.getLogging(execution)

      expect(log.request).toBe("")
      expect(log.response).toBe("")
    })

    it("includes headers when TESTRAIL_LOGGING env variable is set to 'headers'", () => {
      vi.stubEnv("TESTRAIL_LOGGING", "headers")
      const logger = new Logger()
      const execution = makeFakeExecution()

      const log = logger.getLogging(execution)

      expect(log.request).toBe("Headers:\nContent-Type: application/json")
      expect(log.response).toBe("")
    })

    it("includes full request and response when TESTRAIL_LOGGING env variable is set to 'full'", () => {
      vi.stubEnv("TESTRAIL_LOGGING", "full")
      const logger = new Logger()
      const execution = makeFakeExecution({
        request: {
          method: "GET",
          url: {
            protocol: "https",
            host: ["example", "com"],
            path: ["api", "v1"],
            query: { members: [] },
          },
          headers: [{ key: "Content-Type", value: "application/json" }],
          body: '{"key": "value"}',
        },
        response: {
          code: 200,
          status: "OK",
          headers: [{ key: "Content-Type", value: "application/json" }],
          stream: Buffer.from(""),
        },
      })

      const log = logger.getLogging(execution)

      expect(log.request).toBe(
        'Headers:\nContent-Type: application/json\nBody: {"key": "value"}',
      )

      expect(log.response).toContain(
        "Response: 200 OK\nHeaders:\nContent-Type: application/json",
      )
    })

    it("output requestError when responseError is setted", () => {
      vi.stubEnv("TESTRAIL_LOGGING", "full")
      const logger = new Logger()
      const execution = makeFakeExecution({
        response: undefined,
        requestError: { message: "Network error" },
      })

      const log = logger.getLogging(execution)

      expect(log.response).toContain("A request error has occurred.")
      expect(log.response).toContain("Network error")
    })
  })
})
