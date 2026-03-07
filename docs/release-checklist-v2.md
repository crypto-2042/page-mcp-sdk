# Release Checklist (v2)

1. Bump versions for all changed packages.
2. Confirm migration guide is published.
3. Confirm compatibility matrix is published.
4. Run verification script: `bash scripts/verify-v2.sh`.
5. Validate build artifacts for `@page-mcp/core` and `@page-mcp/webmcp-adapter`.
6. Publish packages in dependency order (`core` -> adapters -> chat).
