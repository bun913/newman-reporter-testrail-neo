import TestrailReporter from "../../lib/TestrailReporter"
import TestRailApi from "../../lib/testRailApi"
import { makeSampleEmitter } from "./emitter"
import { setEnvVars } from "./env"

export const makeFakeRequest = (vi, fakeResponse = { fake: true }) => {
  const mockRequest = vi.fn((method, url, options) => {
    return {
      statusCode: 200,
      getBody: () => JSON.stringify(fakeResponse),
    }
  })
  return mockRequest
}

export const makeFakeTestRailApi = (vi, fakeRequest, envOverrids = {}) => {
  // fake TestRailApi
  setEnvVars(vi, envOverrids)
  return new TestRailApi(fakeRequest)
}

// /get_projects https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/projects/
export const makeFakeGetProjectResponse = (options = {}) => {
  const defaultResponse = {
    announcement: "",
    completed_on: null,
    id: 1,
    is_completed: false,
    name: "testProject",
    show_announcement: true,
    url: "https://example.com/index.php?/api/v2/get_project/1",
  }

  return { ...defaultResponse, ...options }
}

// export 
export const makeFakeGetRunsResponse = (options = {}) => {
  const defaultReponse = {
    "offset": 0,
    "limit": 250,
    "size": 250,
    "_links": {
        "next": "/api/v2/get_cases/1&limit=250&offset=250",
        "prev": null
    },
    "runs": [
        {
            "id": 81,
            "name": "Test run 1",
        },
        {
            "id": 82,
            "name": "Test run 2",
        },
    ]
  }
  return { ...defaultReponse, ...options}
}

// get_run https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/runs/
export const makeFakeGetRunResponse = (options = {}) => {
  const defaultResponse = {
    assignedto_id: 6,
    blocked_count: 0,
    completed_on: null,
    config: "Firefox, Ubuntu 12",
    config_ids: [2, 6],
    created_by: 1,
    created_on: 1393845644,
    refs: "SAN-1",
    custom_status1_count: 0,
    custom_status2_count: 0,
    custom_status3_count: 0,
    custom_status4_count: 0,
    custom_status5_count: 0,
    custom_status6_count: 0,
    custom_status7_count: 0,
    description: null,
    failed_count: 2,
    id: 81,
    include_all: false,
    is_completed: false,
    milestone_id: 7,
    name: "File Formats",
    passed_count: 2,
    plan_id: 80,
    project_id: 1,
    retest_count: 1,
    suite_id: 4,
    untested_count: 3,
    updated_on: null,
    url: "http://<server>/testrail/index.php?/runs/view/81",
  }

  return { ...defaultResponse, ...options }
}

// https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/plans/
export const makeFakeAddPlanEntryResponse = (options = {}) => {
  const defaultResponse = {
    id: 3,
    suite_id: 1,
    assignedto_id: 1,
    include_all: true,
    name: "Test Run 1",
    description: null,
    config_ids: [1, 2, 4, 5, 6],
    refs: null,
    runs: [
      {
        id: 4,
        suite_id: 1,
        name: "Test Run 1, Chrome",
        description: null,
        config_ids: [2, 5],
        assignedto_id: 1,
        include_all: false,
        case_ids: [1, 2, 3],
        refs: null,
      },
      {
        id: 5,
        suite_id: 1,
        name: "Test Run 1, Firefox",
        description: null,
        config_ids: [2, 6],
        assignedto_id: 2,
        include_all: false,
        case_ids: [1, 2, 3, 5, 8],
        refs: null,
      },
    ],
    entries: [
      {
        id: "3933d74b-4282-4c1f-be62-a641ab427063",
        run_id: 4,
        name: "Test Run 1, Chrome",
        description: null,
      },
      {
        id: "f89d5bd0-85b6-4f8c-957c-5f88e522418a",
        run_id: 5,
        name: "Test Run 1, Firefox",
        description: null,
      },
    ],
  }

  return { ...defaultResponse, ...options }
}

// https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/runs/
export const makeFakeAddRunResponse = (options = {}) => {
  const defaultResponse = {
    suite_id: 1,
    name: "This is a new test run",
    assignedto_id: 5,
    refs: "SAN-1, SAN-2",
    include_all: false,
    case_ids: [1, 2, 3, 4, 7, 8],
  }

  return { ...defaultResponse, ...options }
}

// https://docs.testrail.techmatrix.jp/testrail/docs/702/api/reference/results/
export const makeFakeAddResultsResponse = (options = {}) => {
  const defaultResponse = {
    results: [
      {
        test_id: 101,
        status_id: 5,
        comment: "This test failed",
        defects: "TR-7",
      },
      {
        test_id: 102,
        status_id: 1,
        comment: "This test passed",
        elapsed: "5m",
        version: "1.0 RC1",
      },
      {
        test_id: 101,
        assignedto_id: 5,
        comment: "Assigned this test to Joe",
      },
    ],
  }

  // オプションで結果を上書きまたは追加
  if (options.results) {
    return {
      results: options.results,
    }
  }

  // 個別の結果をカスタマイズする場合
  return {
    results: defaultResponse.results.map((result, index) => ({
      ...result,
      ...(options[index] || {}),
    })),
  }
}

export const makeTestrailReporterWithFakeApi = (
  vi,
  envOverrids = {},
  projectName = "testProject",
) => {
  const fakeTestRailApi = makeFakeTestRailApi(vi, makeFakeRequest(vi))
  // fake TestRailApiの関数をスタブする
  fakeTestRailApi.getProjectInfo = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(
        makeFakeGetProjectResponse({
          name: projectName,
        }),
      )
    },
  })
  fakeTestRailApi.getRuns = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeGetRunsResponse())
    },
  })
  fakeTestRailApi.getRun = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeGetRunResponse())
    },
  })
  fakeTestRailApi.addPlanEntry = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeAddPlanEntryResponse())
    },
  })
  fakeTestRailApi.addRun = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeAddRunResponse())
    },
  })
  fakeTestRailApi.addResults = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeAddResultsResponse())
    },
  })
  fakeTestRailApi.closeRun = vi.fn().mockReturnValue({
    getBody: () => {
      return JSON.stringify(makeFakeAddResultsResponse())
    },
  })
  // envOverridsで環境変数を上書きする
  setEnvVars(vi, envOverrids)
  const fakeReporter = new TestrailReporter(makeSampleEmitter(vi.fn()), {}, {})
  fakeReporter.testRailApi = fakeTestRailApi
  fakeReporter.env = fakeTestRailApi.env
  return fakeReporter
}

export const makeFakeJsonifyResult = () => {
  return [
    {
      case_id: "01",
      comment:
        "C01 Status code is 400\n" +
        "Request: GET https://www.test.com/test/v1\n" +
        "\n" +
        "Headers:\n" +
        "Content-Type: application/json\n" +
        "\n" +
        "\n" +
        "\n" +
        "Response: 400 Bad Request\n" +
        "Headers:\n" +
        "Connection: close\n" +
        "Body: \n",
      status_id: 1,
      elapsed: "1s",
    },
    {
      case_id: "02",
      comment:
        "C02 Status code is 200\n" +
        "Request: GET https://www.test.com/test/v2\n" +
        "\n" +
        "Headers:\n" +
        "Content-Type: application/json\n" +
        "\n" +
        "\n" +
        "\n" +
        "Response: 200 OK\n" +
        "Headers:\n" +
        "Connection: close\n" +
        "Body: \n",
      status_id: 5,
      elapsed: "1s",
    },
  ]
}
