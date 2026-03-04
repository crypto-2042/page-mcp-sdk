// ============================================================
// Page MCP SDK — Skill Runner
// ============================================================

import type { SkillDefinition, SkillResult } from './types.js';

export type ToolExecutor = (toolName: string, args: Record<string, unknown>) => Promise<unknown>;

/**
 * Executes a Skill's steps sequentially, passing data between steps.
 */
export class SkillRunner {
    /**
     * Run a skill to completion.
     *
     * @param skill     The skill definition containing steps
     * @param args      User-provided arguments
     * @param executor  Function to call a registered tool by name
     */
    async run(
        skill: SkillDefinition,
        args: Record<string, unknown>,
        executor: ToolExecutor,
    ): Promise<SkillResult> {
        const stepResults: Record<string, unknown> = {};

        for (const step of skill.steps) {
            try {
                // 1. Map input: combine user args + previous step results
                const toolInput = step.input(args, stepResults);

                // 2. Execute the referenced tool
                const result = await executor(step.tool, toolInput);

                // 3. Validate if validator is provided
                if (step.validate) {
                    const isValid = step.validate(result, args);
                    if (!isValid) {
                        return {
                            success: false,
                            steps: stepResults,
                            error: step.onFail?.error ?? `Step "${step.name}" validation failed`,
                        };
                    }
                }

                // 4. Store result for subsequent steps
                stepResults[step.name] = result;
            } catch (err) {
                return {
                    success: false,
                    steps: stepResults,
                    error: `Step "${step.name}" threw: ${err instanceof Error ? err.message : String(err)}`,
                };
            }
        }

        return { success: true, steps: stepResults };
    }
}
