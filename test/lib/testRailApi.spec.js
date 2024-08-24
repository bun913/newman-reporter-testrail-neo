import { afterEach, describe, expect, it, vi } from "vitest";
import { makeFakeRequest, makeFakeTestRailApi } from "../utils/request";
import { setEnvVars } from "../utils/env";

describe("TestRailApi", () => {
  afterEach(() => {
    vi.resetAllMocks();
    vi.unstubAllEnvs();
  });

  describe("getProjectInfo", () => {
    it("sends reqeust to proper get_project/:projectId", () => {
      // arrange
      setEnvVars(vi, { projectId: "123" });
      const fakeRequest = makeFakeRequest(vi)
      const sut = makeFakeTestRailApi(vi, fakeRequest, { projectId: "123" });

      // act
      sut.getProjectInfo();

      // assert
      expect(sut.request).toHaveBeenCalledWith(
        "GET",
        "https://example.com/index.php?/api/v2/get_project/testProjectId",
        expect.anything()
      )
    });
  });
});
