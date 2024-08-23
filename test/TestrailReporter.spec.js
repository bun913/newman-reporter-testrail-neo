import { describe, expect, it } from "vitest"
import { TestrailReporter } from "../lib/TestrailReporter"

describe("TestrailReporter", () => {
	describe("onComplete", () => {
		it("raise error when domain option is missing", () => {
			const testrailReporter = new TestrailReporter()
			expect(() => testrailReporter.onComplete()).toThrowError(
				"A required environment variable domain was not found.",
			)
		})
	})
})
