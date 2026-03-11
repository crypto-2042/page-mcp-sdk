import { describe, expect, it } from 'vitest';
import { getInitialAttachedResourceUris } from '../src/chat-widget.js';

describe('resource selection state', () => {
  it('uses default attached resources that are present in the discovered list', () => {
    expect(getInitialAttachedResourceUris(
      [
        { uri: 'page://selector/.product-name', name: 'Visible Product Names', description: 'Visible names' },
        { uri: 'page://selector/#cart-total', name: 'Cart Summary Text', description: 'Cart total' },
      ],
      ['page://selector/#cart-total']
    )).toEqual(['page://selector/#cart-total']);
  });

  it('filters out default attached resources that are not in the discovered list', () => {
    expect(getInitialAttachedResourceUris(
      [
        { uri: 'page://selector/.product-name', name: 'Visible Product Names', description: 'Visible names' },
      ],
      ['page://selector/#cart-total', 'page://selector/.product-name']
    )).toEqual(['page://selector/.product-name']);
  });
});
