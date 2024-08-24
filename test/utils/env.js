export const setEnvVars = (vi, setEnvs = {}) => {
  // set required environment variables
  vi.stubEnv("TESTRAIL_DOMAIN", "example.com")
  vi.stubEnv("TESTRAIL_USERNAME", "dummyUser")
  vi.stubEnv("TESTRAIL_APIKEY", "hogeApiKey")
  vi.stubEnv("TESTRAIL_PROJECTID", "testProjectId")

  // set env if provided
  for (const key of Object.keys(setEnvs)) {
    vi.stubEnv(key, setEnvs[key])
  }
}
