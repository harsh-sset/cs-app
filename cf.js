import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import mysql from 'mysql2/promise';
import functions from '@google-cloud/functions-framework';

const requestSchema = z.object({
  appId: z.string().min(1),
  appPrivateKey: z.string().min(1),
  commentContent: z.string().min(1),
  github: z.object({
    repo: z.string().min(1),
    owner: z.string().min(1),
    branch: z.string().min(1),
    baseBranch: z.string().min(1),
    headBranch: z.string().min(1),
    prNumber: z.number().optional(),
    prLink: z.string().optional(),
    runId: z.string().min(1),
    runNumber: z.number().optional(),
    runAttempt: z.number().optional(),
    commentId: z.string().min(1),
  }),
});


const MetadataSchema = z.object({
  job_title: z.string(),
  job_url: z.string().url(),
  branch: z.string(),
  feature: z.string(),
  lines_changed: z.string().optional(),
  files_changed: z.number().optional(),
});

// ---------- Test Case ----------
const TestCaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.enum([
    "Critical Bug Validation",
    "Positive Improvement",
    "Core Functionality",
    "Edge Case",
  ]),
  objective: z.string(),
  function_tested: z.string().optional(),
  related_lines: z.array(z.number()).optional(),
  input: z.record(z.any()).optional(),
  expected_behavior: z
    .object({
      current: z.string().optional(),
      after_fix: z.string().optional(),
    })
    .optional(),
  result: z.enum(["PASS", "FAIL"]),
  linked_issue: z
    .object({
      severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
      bug_ref: z.string(),
    })
    .optional(),
  impact: z.string().optional(),
});

// ---------- Coverage ----------
const CoverageCategorySchema = z.object({
  total: z.number(),
  passed: z.number(),
});

const CoverageSchema = z.object({
  total_tests: z.number(),
  passed: z.number(),
  failed: z.number(),
  code_coverage_percent: z.number(),
  changed_lines: z.string().optional(),
  coverage_by_category: z.record(CoverageCategorySchema),
});

// ---------- Critical Issues ----------
const CriticalIssueSchema = z.object({
  id: z.string(),
  description: z.string(),
  evidence: z.array(z.union([z.string(), z.number()])),
  impact: z.array(z.string()),
  affected_types: z.array(z.string()),
  required_fix: z.object({
    lines_to_change: z.string(),
    snippet: z.string(),
    estimated_effort: z.string(),
  }),
  status: z.enum(["BLOCKING", "FIXED", "OPEN"]),
});

// ---------- Validated Improvements ----------
const ValidatedImprovementSchema = z.object({
  name: z.string(),
  tests: z.array(z.number()),
  benefit: z.string(),
});

// ---------- Recommendation ----------
const RecommendationSchema = z.object({
  status: z.enum(["MERGE", "DO_NOT_MERGE", "REVIEW_NEEDED"]),
  reason: z.string(),
});

// ---------- Summary Stats ----------
const SummaryStatsSchema = z.object({
  total_tests: z.number(),
  pass_rate: z.string(),
  critical_bugs_found: z.number(),
  positive_improvements: z.number(),
  coverage_percent: z.number(),
});

// ---------- Root Schema ----------
export const PRTestReviewSchema = z.object({
  metadata: MetadataSchema,
  tests: z.array(TestCaseSchema),
  coverage: CoverageSchema,
  critical_issues: z.array(CriticalIssueSchema),
  validated_improvements: z.array(ValidatedImprovementSchema),
  recommendation: RecommendationSchema,
  summary_stats: SummaryStatsSchema,
});


let connPool;
const getPool = () => {
  if (!connPool) {
    connPool = mysql.createPool({
      socketPath: `/cloudsql/aiagents-473818:us-central1:cs-agent-mw`,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
  }
  return connPool;
};

/** GitHub Events Table
CREATE TABLE github_events (
id BIGINT AUTO_INCREMENT PRIMARY KEY,
GITHUB_REPO_OWNER_NAME VARCHAR(255),
GITHUB_EVENT_NAME VARCHAR(100),
GITHUB_REPOSITORY VARCHAR(255),
GITHUB_BRANCH VARCHAR(255),
GITHUB_BASE_BRANCH VARCHAR(255),
GITHUB_HEAD_BRANCH VARCHAR(255),
GITHUB_PR_NUMBER INT,
GITHUB_PR_LINK VARCHAR(512),
GITHUB_RUN_ID BIGINT,
GITHUB_RUN_NUMBER INT,
GITHUB_RUN_ATTEMPT INT,
CUSTOMER_SLUG VARCHAR(100),
ANALYSIS_JSON JSON,
MARKDOWN_RES LONGTEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
INDEX idx_repo_owner (GITHUB_REPO_OWNER_NAME),
INDEX idx_repository (GITHUB_REPOSITORY),
INDEX idx_pr_number (GITHUB_PR_NUMBER),
INDEX idx_run_id (GITHUB_RUN_ID)
)
 */

functions.http('reporting', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appId, appPrivateKey, commentContent, github } = requestSchema.parse(req.body);
    const { repo, owner, branch, baseBranch, headBranch, prNumber, prLink, runId, runNumber, runAttempt, commentId } = github;

    const db = getPool();
    const [rows] = await db.query('SELECT * FROM api_auth_users WHERE client_id = ?', [appId]);
    
    if (rows.length === 0 || rows[0].client_secret !== appPrivateKey) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const anthropic = createAnthropic({
      apiKey: rows[0].anthropic_api_key
    });

    const customerSlug = rows[0].customer_slug;

    const data = await generateObject({
      model: anthropic('claude-sonnet-4-5-20250929'),
      schema: PRTestReviewSchema,
      prompt: `You are a code-review intelligence system.
Your job is to extract structured data from detailed PR review comments that include tests, bugs, coverage, and recommendations.

Goal: Convert an unstructured review into a structured, test-focused JSON object that conforms to the schema below.

Emphasize test cases as the primary entity — each test should describe what it verifies, its result (PASS/FAIL), and any related code lines or features.

Use concise, machine-readable strings. Do not include markdown formatting, headings, or prose commentary.

Always include:

metadata: PR/job context

tests: all tests with names, objectives, and results

coverage: coverage summary with pass/fail counts

critical_issues: blocking problems confirmed by failing tests

validated_improvements: successful optimizations confirmed by passing tests

recommendation: final merge advice

summary_stats: overall results

{
  "metadata": {...},
  "tests": [...],
  "coverage": {...},
  "critical_issues": [...],
  "validated_improvements": [...],
  "recommendation": {...},
  "summary_stats": {...}
}

Comment to review: 
 ${commentContent}`,
    });
    // insert the data into the github_events table
    await db.execute('INSERT INTO github_events (GITHUB_REPO_OWNER_NAME, GITHUB_EVENT_NAME, GITHUB_REPOSITORY, GITHUB_BRANCH, GITHUB_BASE_BRANCH, GITHUB_HEAD_BRANCH, GITHUB_PR_NUMBER, GITHUB_PR_LINK, GITHUB_RUN_ID, GITHUB_RUN_NUMBER, GITHUB_RUN_ATTEMPT, CUSTOMER_SLUG, ANALYSIS_JSON, MARKDOWN_RES) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
        [owner, 
        'PR_REVIEW', 
        repo, 
        branch, 
        baseBranch, 
        headBranch, 
        prNumber, 
        prLink, 
        runId, 
        runNumber, 
        runAttempt, 
        customerSlug, 
        JSON.stringify(data.object), 
        commentContent]);

    return res.status(200).json({ success: true, response: data.object });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    return res.status(500).json({ error: error.message });
  }
});