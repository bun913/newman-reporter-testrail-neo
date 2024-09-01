import NewmanResultModifier from "../../lib/newmanResultModifier";
import { afterEach, describe, expect, it, vi } from "vitest";
import makeNewmanResult from "../utils/newman";
import { setEnvVars } from "../utils/env";
import { makeFakeRequest, makeFakeTestRailApi } from "../utils/fake";

const makeFakeApi = (vi, fakeResponse, env) => {
  const defaultResponse = {
    _links: {
      next: null,
    },
    cases: [
      { id: 1, title: "case1" },
      { id: 2, title: "case2" },
    ],
  };
  const fakeRequest = makeFakeRequest(vi, fakeResponse || defaultResponse);
  return makeFakeTestRailApi(vi, fakeRequest, env);
};

describe("NewmanResultModifier", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetAllMocks();
  });

  describe("addTestCaseIdsToAssertions", () => {
    it("nothing changes if isUseTitle is not true", () => {
      // arrange
      const fakeApi = makeFakeApi(vi, null, {});
      const executions = makeNewmanResult();
      const sut = new NewmanResultModifier("false", fakeApi, executions)
      // act
      const result = sut.addTestCaseIdsToAssertions();
      // assert
      expect(result).toEqual(executions);
    });

    it("addTestCaseIds to assertion titles", () => {
        // arrange
        const fakeApi = makeFakeApi(vi, null, {})
        const executions = makeNewmanResult({
            assertionName: "case1"
        })
        const multiCaseExecutions = executions.concat(makeNewmanResult({
            assertionName: "case2"
        }))
        const sut = new NewmanResultModifier("true", fakeApi, multiCaseExecutions)

        // act
        const results = sut.addTestCaseIdsToAssertions()
        // assert
        expect(results[0].assertions[0].assertion).toEqual("C1 case1")
        expect(results[1].assertions[0].assertion).toEqual("C2 case2")
    })
  });
});
