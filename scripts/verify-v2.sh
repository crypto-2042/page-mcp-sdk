#!/usr/bin/env bash
set -euo pipefail

pnpm install --force --config.confirmModulesPurge=false
pnpm -r run typecheck
pnpm -r run test
pnpm -r run build
