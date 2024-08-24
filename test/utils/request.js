import { setEnvVars } from "./env";
import  TestRailApi  from "../../lib/testRailApi";

export const makeFakeRequest = (vi, fakeResponse={"fake": true}) => {
  const mockRequest = vi.fn((method, url, options) => {
    return {
      statusCode: 200,
      getBody: () => JSON.stringify(fakeResponse),
    };
  });
  return mockRequest;
};

export const makeFakeTestRailApi = (vi,fakeRequest, envOverrids = {}) => {
  // fake TestRailApi
  setEnvVars(vi, envOverrids);
  return new TestRailApi(fakeRequest)
};
