/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const request = require("sync-request")
const dayjs = require("dayjs")
const getEnv = require("./environment")
const TestRailApi = require("./testRailApi")
const TestRailResultProcessor = require("./testRailResultProcessor")
const NewmanResultModifier = require("./newmanResultModifier")
const requiredOptions = ["domain", "username", "apikey", "projectId"]

class TestRailReporter {
  constructor(emitter, reporterOptions, options) {
    this.results = []
    this.testRailApi = new TestRailApi(request)
    emitter.on("beforeDone", (err, args) => {
      this.onComplete(err, args)
    })
  }

  onComplete(err, args) {
    this.env = getEnv()

    const hasMissingOptions = this.validateRequiredEnvironmentVariables()

    if (!hasMissingOptions) {
      this.jsonifyResults(args.summary.run.executions)
      this.pushToTestrail(args.summary)
    }
  }

  jsonifyResults(executions) {
    let filteredExecutions =
      this.getAssertionsIncludingAssertionsOnly(executions)

    const resultModifier = new NewmanResultModifier(
      this.env.useTitles,
      this.testRailApi,
      filteredExecutions,
    )
    filteredExecutions = resultModifier.addTestCaseIdsToAssertionsIfNeeded()

    const resultProcessor = new TestRailResultProcessor(this.env, this.results)
    resultProcessor.processExecutions(filteredExecutions)

    return JSON.stringify({ results: this.results })
  }

  pushToTestrail(summary) {
    if (this.results.length > 0) {
      const testRailApi = this.testRailApi
      // TODO: not repeatable use responce variable
      let response

      let { title } = this.env
      // Create a title using project name if no better title is specified
      if (!title) {
        response = testRailApi.getProjectInfo()
        title = `${
          JSON.parse(response.getBody()).name
        }: Automated Test Run ${dayjs().format("YYYY-MM-DD HH:mm:ss")}`
      }

      let { runId } = this.env
      let url
      if (runId) {
        // Get first run id from get_runs if latest specified
        if (this.env.runId.toLowerCase() === "latest") {
          response = testRailApi.getRuns()
          runId = JSON.parse(response.getBody()).runs[0].id
        }
        response = testRailApi.getRun(runId)
        url = JSON.parse(response.getBody()).url
      } else if (this.env.testPlanId) {
        // Add a new test run to the provided test plan id
        response = testRailApi.addPlanEntry(title, this.results)
        runId = JSON.parse(response.getBody()).runs[0].id
        url = JSON.parse(response.getBody()).runs[0].url
      } else {
        // Add a new test run if no run id was specified
        response = testRailApi.addRun(title, this.results)
        runId = JSON.parse(response.getBody()).id
        url = JSON.parse(response.getBody()).url
      }

      summary.testrail = {
        run_id: runId,
        results: this.results,
      }
      response = testRailApi.addResults(runId, this.results)
      console.log(`\n${url}`)

      const { closeRun } = this.env
      if (closeRun.toLowerCase() !== "false") {
        console.log("Closing run.")
        response = testRailApi.closeRun(runId)
      }
    } else {
      console.error("\nnewman-reporter-testrail-neo: No test cases were found.")
    }
  }

  getAssertionsIncludingAssertionsOnly(executions) {
    return executions.filter((testExecution) => {
      return testExecution.assertions && testExecution.assertions.length > 0
    })
  }

  validateRequiredEnvironmentVariables() {
    let hasMissingOptions = false
    for (const option of requiredOptions) {
      if (this.env[option] === undefined) {
        console.error(
          `\nnewman-reporter-testrail-neo: A required environment variable ${option} was not found.`,
        )
        hasMissingOptions = true
      }
    }
    return hasMissingOptions
  }
}

module.exports = TestRailReporter
