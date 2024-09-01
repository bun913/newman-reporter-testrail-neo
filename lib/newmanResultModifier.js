class NewmanResultModifier {
  constructor(isUseTitle, testRailApi, orgExecutions) {
    this.isUseTitle = isUseTitle
    this.testRailApi = testRailApi
    this.orgExecutions = orgExecutions
  }

  addTestCaseIdsToAssertionsIfNeeded() {
    if (this.isUseTitle.toLowerCase() !== "true") return this.orgExecutions
    const allCases = this.testRailApi.getCases()

    return this.orgExecutions.map((execution) => {
      const modifiedAssertions = execution.assertions.map((assertion) => {
        const match = allCases.find(
          (testCase) =>
            testCase.title === assertion.assertion ||
            testCase.title === execution.item.name ||
            new RegExp(`^C${testCase.id}\\b`).test(execution.item.name),
        )

        return match
          ? { ...assertion, assertion: `C${match.id} ${assertion.assertion}` }
          : assertion
      })

      return { ...execution, assertions: modifiedAssertions }
    })
  }
}

module.exports = NewmanResultModifier
