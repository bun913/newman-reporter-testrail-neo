/* eslint-disable class-methods-use-this */
/* eslint-disable no-underscore-dangle */
const request = require("sync-request")
const dayjs = require("dayjs")
const getEnv = require("./environment")
const TestRailApi = require("./testRailApi")
const TestRailResultProcessor = require("./testRailResultProcessor")
const TestRailResultSender = require("./tsetRailResultSender")
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
      const testRailSender = new TestRailResultSender(testRailApi, this.env)
      testRailSender.sendResults(this.results)
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
