const Logger = require("./logger")

class TestRailResultProcessor {
  constructor(env, results) {
    this.env = env
    this.results = results
    this.testCaseRegex = /\bC(\d+)\b/
    this.duplicateFailingCases = []
  }

  processExecutions(filteredExecutions) {
    filteredExecutions.forEach(this.processExecution.bind(this))
    this.handleDuplicateFailures()
    this.calculateFinalStatus()
  }

  processExecution(execution) {
    const logger = new Logger()
    const log = logger.getLogging(execution)
    const currentRequestsAssertions = []

    execution.assertions.forEach((assertion) =>
      this.processAssertion(assertion, log, currentRequestsAssertions),
    )
  }

  processAssertion(assertion, log, currentRequestsAssertions) {
    const strings = assertion.assertion.split(" ")
    let i = 0
    while (i < strings.length && strings[i].match(this.testCaseRegex)) {
      this.processTestCase(
        strings[i],
        assertion,
        log,
        currentRequestsAssertions,
      )
      i += 1
    }
  }

  processTestCase(testCaseString, assertion, log, currentRequestsAssertions) {
    const currentResult = this.createTestCaseResult(testCaseString, assertion)
    this.addLoggingToResult(
      currentResult,
      assertion,
      log,
      currentRequestsAssertions,
    )
    this.addCustomFields(currentResult)
    this.addResultToResults(currentResult)
  }

  createTestCaseResult(testCaseString, assertion) {
    const currentResult = {
      case_id: testCaseString.match(this.testCaseRegex)[1],
      comment: assertion.assertion,
      status_id: this.determineStatusId(assertion),
    }
    if (this.env.version) currentResult.version = this.env.version
    currentResult.elapsed = this.calculateElapsedTime(assertion)
    return currentResult
  }

  determineStatusId(assertion) {
    if (assertion.skipped) return this.env.skipped_id
    if (assertion.error) {
      this.handleFailure(assertion)
      return this.env.fail_id
    }
    return this.env.pass_id
  }

  handleFailure(assertion) {
    if (
      this.results
        .map((result) => result.case_id)
        .includes(assertion.case_id) &&
      !this.duplicateFailingCases.includes(assertion.case_id)
    ) {
      this.duplicateFailingCases.push(assertion.case_id)
    }
  }

  calculateElapsedTime(assertion) {
    const responseTime = assertion.response && assertion.response.responseTime
    return `${responseTime ? Math.round(responseTime / 1000) || 1 : 1}s`
  }

  addLoggingToResult(currentResult, assertion, log, currentRequestsAssertions) {
    if (this.env.logging.toLowerCase() === "none") return
    if (
      !currentRequestsAssertions.includes(currentResult.case_id) ||
      this.env.steps.toLowerCase() !== "false"
    ) {
      currentResult.comment += `\n${log.url}\n\n${log.request}\n\n${log.response}`
    }
    currentRequestsAssertions.push(currentResult.case_id)
  }

  addCustomFields(currentResult) {
    this.env.customKeys.forEach((key) => {
      const testrailKey = key.replace("TESTRAIL_CUSTOM_", "")
      currentResult[testrailKey] = process.env[key]
    })
  }

  addResultToResults(currentResult) {
    if (this.env.steps.toLowerCase() !== "true") {
      this.results.push(currentResult)
    } else {
      this.addStepResult(currentResult)
    }
  }

  addStepResult(currentResult) {
    const parentIndex = this.results.findIndex(
      (result) => result.case_id === currentResult.case_id,
    )
    if (parentIndex === -1) {
      currentResult[this.env.stepResultKey] = [
        {
          status_id: currentResult.status_id,
          content: currentResult.comment,
        },
      ]
      delete currentResult.comment
      this.results.push(currentResult)
    } else {
      this.results[parentIndex][this.env.stepResultKey].push({
        status_id: currentResult.status_id,
        content: currentResult.comment,
      })
    }
  }

  handleDuplicateFailures() {
    if (this.env.steps.toLowerCase() !== "true") {
      this.duplicateFailingCases.forEach((testCase) => {
        this.results.push({
          case_id: testCase,
          status_id: this.env.fail_id,
        })
      })
    }
  }

  calculateFinalStatus() {
    if (this.env.steps.toLowerCase() === "true") {
      this.results = this.results.map((result) => {
        if (
          result[this.env.stepResultKey].some(
            (step) => step.status_id === this.env.fail_id,
          )
        ) {
          return { ...result, status_id: this.env.fail_id }
        }
        return { ...result, status_id: this.env.pass_id }
      })
    }
  }
}

module.exports = TestRailResultProcessor
