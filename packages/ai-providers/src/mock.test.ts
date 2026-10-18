import { describe, expect, it } from 'vitest';
import { createMockProvider } from './mock';

const request = {
  prompt: 'Where do people recommend Northwind?',
  promptVersionId: '55555555-5555-4555-8555-555555555555',
  surface: 'CONSUMER_SEARCH' as const,
  engineId: 'mock-consumer_search',
  locale: 'en-US',
  market: 'US',
  idempotencyKey: 'mock-key-12345678',
};

describe('mock provider', () => {
  it('advertises three distinct surfaces and marks itself as a mock', async () => {
    const provider = createMockProvider();
    expect(provider.identity.mock).toBe(true);
    const capabilities = await provider.capabilities();
    expect(capabilities.map((item) => item.surface)).toEqual([
      'MODEL_API',
      'GROUNDED_SEARCH',
      'CONSUMER_SEARCH',
    ]);
    expect(capabilities.find((item) => item.surface === 'MODEL_API')?.supportsCitations).toBe(false);
    expect(capabilities.find((item) => item.surface === 'CONSUMER_SEARCH')?.supportsCitations).toBe(true);
  });

  it('returns an explicitly labeled fixture and no live citation', async () => {
    const result = await createMockProvider().execute(request);
    expect(result.responseText).toBe('MOCK_PROVIDER_RESPONSE');
    expect(result.citations[0]?.url).toContain('example.invalid');
    expect(result.cost?.estimatedAmount).toBe('0.000001');
  });

  it('categorizes a configured failure without a network call', async () => {
    const result = await createMockProvider({ fail: 'rate_limited' }).execute({
      ...request,
      surface: 'MODEL_API',
    });
    expect(result.status).toBe('failed');
    expect(result.error?.category).toBe('rate_limited');
    expect(result.error?.retryable).toBe(true);
    expect(result.citations).toEqual([]);
  });
});
