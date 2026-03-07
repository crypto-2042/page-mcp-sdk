import type { PageMcpClient } from '../client.js';
import type {
  SkillInfo,
  SkillGetResult,
  SkillExecutionResult,
} from '../types.js';

export type {
  SkillDefinition,
  SkillInfo,
  SkillGetResult,
  SkillExecutionResult,
  SkillExecutionContext,
} from '../types.js';

export class SkillsClient {
  constructor(private readonly client: PageMcpClient) {}

  async list(params?: { cursor?: string; limit?: number }): Promise<{ items: SkillInfo[]; nextCursor?: string }> {
    this.ensureConnected();
    const response = await this.client.getTransport().request('extensions/skills/list', {
      cursor: params?.cursor ?? '0',
      limit: params?.limit,
    });
    if (response.error) throw new Error(response.error.message);
    const result = response.result as { items?: SkillInfo[]; nextCursor?: string } | SkillInfo[];
    if (Array.isArray(result)) return { items: result };
    return { items: result.items ?? [], nextCursor: result.nextCursor };
  }

  async get(name: string): Promise<SkillGetResult> {
    this.ensureConnected();
    const response = await this.client.getTransport().request('extensions/skills/get', { name });
    if (response.error) throw new Error(response.error.message);
    return response.result as SkillGetResult;
  }

  async execute(name: string, args?: Record<string, unknown>): Promise<SkillExecutionResult> {
    this.ensureConnected();
    const response = await this.client.getTransport().request('extensions/skills/execute', {
      name,
      arguments: args ?? {},
    });
    if (response.error) throw new Error(response.error.message);
    return response.result as SkillExecutionResult;
  }

  private ensureConnected(): void {
    if (!this.client.isConnected()) {
      throw new Error('PageMcpClient is not connected. Call connect() first.');
    }
  }
}

export function createSkillsClient(client: PageMcpClient): SkillsClient {
  return new SkillsClient(client);
}
