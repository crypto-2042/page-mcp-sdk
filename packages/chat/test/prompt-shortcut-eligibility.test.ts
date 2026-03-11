import { describe, expect, it } from 'vitest';
import { isPromptShortcutEligible } from '../src/chat-widget.js';

describe('prompt shortcut eligibility', () => {
  it('allows prompts without arguments', () => {
    expect(isPromptShortcutEligible({
      name: 'recommend-products',
      description: 'Recommend products',
    })).toBe(true);
  });

  it('allows prompts with only optional arguments', () => {
    expect(isPromptShortcutEligible({
      name: 'compare-products',
      description: 'Compare products',
      arguments: [
        { name: 'left', required: false },
        { name: 'right' },
      ],
    })).toBe(true);
  });

  it('excludes prompts with required arguments', () => {
    expect(isPromptShortcutEligible({
      name: 'checkout-assistant',
      description: 'Guide checkout for a specific customer',
      arguments: [
        { name: 'customer_name', required: true },
      ],
    })).toBe(false);
  });
});
