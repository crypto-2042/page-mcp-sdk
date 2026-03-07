import { describe, expect, test } from 'vitest';
import * as core from '../src/index.js';
import { PageMcpClient } from '../src/client.js';

describe('Extensions boundary', () => {
  test('core root exports do not expose legacy skills runtime directly', () => {
    expect((core as Record<string, unknown>).SkillRunner).toBeUndefined();
    expect((core as Record<string, unknown>).createSkillRunner).toBeUndefined();
    expect((core as Record<string, unknown>).Extensions).toBeDefined();
    expect(((core as Record<string, any>).Extensions?.createSkillsClient)).toBeTypeOf('function');
  });

  test('default client surface excludes skill RPC helpers', () => {
    expect((PageMcpClient.prototype as Record<string, unknown>).listSkills).toBeUndefined();
    expect((PageMcpClient.prototype as Record<string, unknown>).executeSkill).toBeUndefined();
  });
});
