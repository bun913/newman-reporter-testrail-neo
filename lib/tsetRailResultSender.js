// TestRailResultSender.js
const dayjs = require("dayjs")

class TestRailResultSender {
  constructor(testRailApi, env) {
    this.testRailApi = testRailApi
    this.env = env
  }

  sendResults(results) {
    if (results.length === 0) {
      console.error("\nnewman-reporter-testrail-neo: No test cases were found.")
      return null
    }

    const runInfo = this.determineTestRailRun(results)
    this.addResultsToTestRail(runInfo, results)
    this.logTestRailUrl(runInfo.url)
    this.closeRunIfNeeded(runInfo.runId)

    return runInfo
  }

  determineTestRailRun(results) {
    if (this.env.runId) {
      return this.getExistingRun()
    }
    if (this.env.testPlanId) {
      return this.addNewTestPlanEntry(results)
    }
    return this.addNewRun(results)
  }

  getExistingRun() {
    let runId = this.env.runId
    if (runId.toLowerCase() === "latest") {
      const response = this.testRailApi.getRuns()
      runId = JSON.parse(response.getBody()).runs[0].id
    }
    const response = this.testRailApi.getRun(runId)
    const runInfo = JSON.parse(response.getBody())
    return { runId, url: runInfo.url }
  }

  addNewTestPlanEntry(results) {
    const title = this.getRunTitle()
    const response = this.testRailApi.addPlanEntry(title, results)
    const responseBody = JSON.parse(response.getBody())
    return { runId: responseBody.runs[0].id, url: responseBody.runs[0].url }
  }

  addNewRun(results) {
    const title = this.getRunTitle()
    const response = this.testRailApi.addRun(title, results)
    const responseBody = JSON.parse(response.getBody())
    return { runId: responseBody.id, url: responseBody.url }
  }

  getRunTitle() {
    if (this.env.title) return this.env.title
    const response = this.testRailApi.getProjectInfo()
    const projectName = JSON.parse(response.getBody()).name
    return `${projectName}: Automated Test Run ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
  }

  addResultsToTestRail(runInfo, results) {
    return this.testRailApi.addResults(runInfo.runId, results)
  }

  logTestRailUrl(url) {
    console.log(`\n${url}`)
  }

  closeRunIfNeeded(runId) {
    if (this.env.closeRun.toLowerCase() !== "false") {
      console.log("Closing run.")
      this.testRailApi.closeRun(runId)
    }
  }
}

module.exports = TestRailResultSender
