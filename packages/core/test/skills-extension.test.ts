import { describe, expect, test } from 'vitest';
import { EventBus } from '../src/transport.js';
import { PageMcpHost } from '../src/host.js';
import { PageMcpClient } from '../src/client.js';
import { createSkillsClient } from '../src/extensions/skills.js';

describe('Skills extension contract', () => {
  test('supports list/get/execute for registered run handler skills', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerSkill({
      name: 'cart-checkout',
      version: '1.0.0',
      description: 'Checkout flow',
      skillMd: '# cart-checkout\nRun checkout flow.',
      run: async (_ctx, input) => ({ ok: true, input }),
    });
    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();
    const skills = createSkillsClient(client);

    const listed = await skills.list();
    expect(listed.items).toEqual([
      expect.objectContaining({
        name: 'cart-checkout',
        version: '1.0.0',
        hasScript: false,
      }),
    ]);

    const skill = await skills.get('cart-checkout');
    expect(skill).toMatchObject({
      name: 'cart-checkout',
      version: '1.0.0',
      hasScript: false,
    });
    expect(skill.skillMd).toContain('checkout');

    const executed = await skills.execute('cart-checkout', { id: 1 });
    expect(executed).toEqual({
      name: 'cart-checkout',
      success: true,
      output: { ok: true, input: { id: 1 } },
    });
  });

  test('inline script execution is disabled by default', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerSkill({
      name: 'script-skill',
      version: '1.0.0',
      skillMd: '# script skill',
      scriptJs: 'async (_ctx, input) => ({ hello: input.name })',
    });
    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();
    const skills = createSkillsClient(client);

    const result = await skills.execute('script-skill', { name: 'world' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('disabled');
  });

  test('inline script execution can be enabled explicitly', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({
      name: 'test',
      version: '1.0.0',
      bus,
      skills: { allowInlineScriptExecution: true },
    });
    host.registerSkill({
      name: 'script-skill-enabled',
      version: '1.0.0',
      skillMd: '# script skill',
      scriptJs: 'async (_ctx, input) => ({ hello: input.name })',
    });
    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();
    const skills = createSkillsClient(client);

    const result = await skills.execute('script-skill-enabled', { name: 'world' });
    expect(result).toEqual({
      name: 'script-skill-enabled',
      success: true,
      output: { hello: 'world' },
    });
  });

  test('host supports unregisterSkill lifecycle', async () => {
    const bus = new EventBus();
    const host = new PageMcpHost({ name: 'test', version: '1.0.0', bus });
    host.registerSkill({
      name: 'removable-skill',
      version: '1.0.0',
      skillMd: '# removable',
      run: async () => 'ok',
    });
    host.unregisterSkill('removable-skill');
    host.start();

    const client = new PageMcpClient({ bus });
    await client.connect();
    const skills = createSkillsClient(client);

    await expect(skills.get('removable-skill')).rejects.toThrow('Skill not found');
  });
});
