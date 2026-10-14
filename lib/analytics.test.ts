import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizePageLocation } from './analytics';

describe('sanitizePageLocation', () => {
  it('removes the email query param and any value that contains @', () => {
    const sanitized = sanitizePageLocation(
      'https://www.newcastledigest.com/thank-you?src=subscribe_page&email=ada%40example.com&ref=ada@example.com&utm=weekly',
    );
    const url = new URL(sanitized);
    assert.equal(url.searchParams.get('src'), 'subscribe_page');
    assert.equal(url.searchParams.get('utm'), 'weekly');
    assert.equal(url.searchParams.has('email'), false);
    assert.equal(url.searchParams.has('ref'), false);
    assert.equal(sanitized.includes('email='), false);
    assert.equal(sanitized.includes('@'), false);
  });

  it('leaves a clean page location unchanged aside from URL normalisation', () => {
    const sanitized = sanitizePageLocation('https://www.newcastledigest.com/journal/spring-guide?src=homepage');
    assert.equal(sanitized, 'https://www.newcastledigest.com/journal/spring-guide?src=homepage');
  });
});
