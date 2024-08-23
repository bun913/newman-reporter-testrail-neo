import { describe, expect, it } from "vitest";
import TestrailReporter from "../lib/TestrailReporter";

describe("TestrailReporter", () => {
  describe("constructor", () => {
    it("raise error when domain option is missing", () => {
      expect(() => {
        new TestrailReporter();
      }).toThrowError("A required environment variable domain was not found.");
    });
  });
});
