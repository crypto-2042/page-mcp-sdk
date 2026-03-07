# Test Report

## Core protocol suite

- Command: `pnpm --filter @page-mcp/core test -- --reporter=verbose`
- Result: 8 test files passed, 14 tests passed, 0 failed.
- Raw output: `/tmp/page-mcp-core-test-report.txt`

## Full verification

- Command: `bash scripts/verify-v2.sh`
- Result: PASS (`install`, `typecheck`, `test`, `build` all succeeded across workspace).

## Covered suites

- MCP method surface
- Tools contract
- Tool lifecycle
- Resources contract
- Prompts contract
- Capabilities + pagination + notifications
- Core export boundary
- Extension boundary
