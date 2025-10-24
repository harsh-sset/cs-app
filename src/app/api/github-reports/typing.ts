export interface Root {
    success: boolean
    data: RunResult[]
}

export interface RunResult {
    id: number
    GITHUB_REPO_OWNER_NAME: string
    GITHUB_EVENT_NAME: string
    GITHUB_REPOSITORY: string
    GITHUB_BRANCH: string
    GITHUB_BASE_BRANCH: string
    GITHUB_HEAD_BRANCH: string
    GITHUB_PR_NUMBER: number
    GITHUB_PR_LINK: string
    GITHUB_RUN_ID: number
    GITHUB_RUN_NUMBER: number
    GITHUB_RUN_ATTEMPT: number
    CUSTOMER_SLUG: string
    ANALYSIS_JSON: AnalysisJson
    MARKDOWN_RES: string
    created_at: string
    updated_at: string
}

export interface AnalysisJson {
    tests: Test[]
    coverage: Coverage
    metadata: Metadata
    summary_stats: SummaryStats
    recommendation: Recommendation
    critical_issues: any[]
    validated_improvements: ValidatedImprovement[]
}

export interface Test {
    id: number
    name: string
    input: Input
    impact: string
    result: string
    category: string
    objective: string
    related_lines: number[]
    function_tested: string
    expected_behavior?: ExpectedBehavior
}

export interface Input {
    url?: string
    timeout?: number
    extract?: boolean
    url_fail?: string
    url_success?: string
    force?: boolean
    urls?: string[]
    concurrency?: number
    concurrent?: number
    domain?: string
    failure_url?: string
    success_url?: string
    sequential_requests?: number
    concurrent_requests?: number
}

export interface ExpectedBehavior {
    current: string
    after_fix: string
}

export interface Coverage {
    failed: number
    passed: number
    total_tests: number
    changed_lines: string
    coverage_by_category: CoverageByCategory
    code_coverage_percent: number
}

export interface CoverageByCategory {
    "Edge Case": EdgeCase
    "Core Functionality": CoreFunctionality
    "Positive Improvement": PositiveImprovement
    "Critical Bug Validation": CriticalBugValidation
}

export interface EdgeCase {
    total: number
    passed: number
}

export interface CoreFunctionality {
    total: number
    passed: number
}

export interface PositiveImprovement {
    total: number
    passed: number
}

export interface CriticalBugValidation {
    total: number
    passed: number
}

export interface Metadata {
    branch: string
    feature: string
    job_url: string
    job_title: string
    files_changed: number
    lines_changed: string
}

export interface SummaryStats {
    pass_rate: string
    total_tests: number
    coverage_percent: number
    critical_bugs_found: number
    positive_improvements: number
}

export interface Recommendation {
    reason: string
    status: string
}

export interface ValidatedImprovement {
    name: string
    tests: number[]
    benefit: string
}
