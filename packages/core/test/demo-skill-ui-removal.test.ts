import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, test } from 'vitest';

describe('demo skill UI removal', () => {
  test('demo debug modal no longer exposes skills UI or quick tests', () => {
    const demoHtml = readFileSync(resolve(process.cwd(), '../../demo/index.html'), 'utf8');

    expect(demoHtml).not.toContain('Registered tools, resources, skills and RPC traffic');
    expect(demoHtml).not.toContain('🚀 Skills');
    expect(demoHtml).not.toContain('id="mcp-skills"');
    expect(demoHtml).not.toContain("qTest('listSkills')");
    expect(demoHtml).not.toContain("qTest('verifySkills')");
    expect(demoHtml).not.toContain("action === 'listSkills'");
    expect(demoHtml).not.toContain("action === 'verifySkills'");
  });

  test('demo resources, tools, and prompts follow the current protocol examples', () => {
    const demoHtml = readFileSync(resolve(process.cwd(), '../../demo/index.html'), 'utf8');

    expect(demoHtml).not.toContain("uri: 'page://cart'");
    expect(demoHtml).not.toContain("uri: 'page://products'");
    expect(demoHtml).not.toContain("uri: 'page://orders'");
    expect(demoHtml).not.toContain('handler: async () => ({ items: store.cart');

    expect(demoHtml).toContain("uri: 'page://selector/.product-name'");
    expect(demoHtml).toContain("uri: 'page://selector/.product-price'");
    expect(demoHtml).toContain("uri: 'page://selector/#cart-total'");
    expect(demoHtml).not.toContain("uri: 'page://selector/.order-card'");

    expect(demoHtml).toContain("mimeType: 'application/json'");
    expect(demoHtml).toContain("mimeType: 'text/plain'");
    expect(demoHtml).not.toContain("mimeType: 'text/html'");

    expect(demoHtml).toContain("qTest('readProductNames')");
    expect(demoHtml).toContain("qTest('readCartSummary')");
    expect(demoHtml).toContain("action === 'readProductNames'");
    expect(demoHtml).toContain("action === 'readCartSummary'");

    expect(demoHtml).not.toContain('execute: async () => store.products.map');
    expect(demoHtml).toContain("name: 'searchProducts'");
    expect(demoHtml).toContain("name: 'getProductInfo'");
    expect(demoHtml).toContain("annotations: { readOnlyHint: true }");
    expect(demoHtml).not.toContain('handler: async () => ({');
    expect(demoHtml).toContain('messages: [{ role: \'user\', content: { type: \'text\', text: promptTextMap[name] } }]');
  });

  test('demo MCP surface is simplified to the focused shopping scenario', () => {
    const demoHtml = readFileSync(resolve(process.cwd(), '../../demo/index.html'), 'utf8');

    expect(demoHtml).toContain("name: 'searchProducts'");
    expect(demoHtml).toContain("name: 'getProductInfo'");
    expect(demoHtml).toContain("name: 'addToCart'");
    expect(demoHtml).toContain("name: 'placeOrder'");

    expect(demoHtml).not.toContain("name: 'getProductList'");
    expect(demoHtml).not.toContain("name: 'checkStock'");
    expect(demoHtml).not.toContain("name: 'removeFromCart'");
    expect(demoHtml).not.toContain("name: 'getCartContents'");
    expect(demoHtml).not.toContain("name: 'quickBuy'");

    expect(demoHtml).toContain("name: 'Visible Product Names'");
    expect(demoHtml).toContain("name: 'Visible Product Prices'");
    expect(demoHtml).toContain("name: 'Cart Summary Text'");
    expect(demoHtml).not.toContain("name: 'Latest Order Card'");

    expect(demoHtml).toContain("registerPromptShortcut('recommend-products'");
    expect(demoHtml).toContain("registerPromptShortcut('deal-finder'");
    expect(demoHtml).toContain("registerPromptShortcut('cart-summary'");
    expect(demoHtml).not.toContain("registerPromptShortcut('compare-all'");
    expect(demoHtml).not.toContain("registerPromptShortcut('gift-ideas'");
    expect(demoHtml).not.toContain("registerPromptShortcut('tech-support'");

    expect(demoHtml).not.toContain('Chat Verification');
    expect(demoHtml).not.toContain("prefillChatVerification('prompts')");
    expect(demoHtml).toContain("defaultAttachedResources: ['page://selector/.product-name', 'page://selector/#cart-total']");
    expect(demoHtml).not.toContain("defaultAttachedResources: ['page://selector/.product-name', 'page://selector/.product-price'");
  });

  test('demo copy highlights light theme and stop-response chat controls', () => {
    const demoHtml = readFileSync(resolve(process.cwd(), '../../demo/index.html'), 'utf8');

    expect(demoHtml).toContain('Light');
    expect(demoHtml).toContain('theme icon in the chat header');
    expect(demoHtml).toContain('stop icon');
    expect(demoHtml).toContain('stop-response behavior');
  });
});
