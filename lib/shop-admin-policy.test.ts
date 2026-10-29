import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  AdminInputError,
  decideStockChange,
  googleAccountMayAdminister,
  isAllowedAdminEmail,
  shopAdminIsConfigured,
  parseAdminEmails,
  parseAudToCents,
  parseProductDraft,
  slugifyProductName,
} from './shop-admin-policy';

const allowlist = ['editor@newcastledigest.com'];

describe('shop admin access', () => {
  it('parses the allowlist and ignores unsigned-in accounts', () => {
    assert.deepEqual(
      parseAdminEmails(' Editor@NewcastleDigest.com, not-an-email, editor@newcastledigest.com '),
      ['editor@newcastledigest.com'],
    );
    assert.equal(isAllowedAdminEmail('editor@newcastledigest.com', allowlist), true);
    assert.equal(
      googleAccountMayAdminister(
        { provider: 'google', email: 'editor@newcastledigest.com', emailVerified: true },
        allowlist,
      ),
      true,
    );
    assert.equal(
      googleAccountMayAdminister(
        { provider: 'google', email: 'editor@newcastledigest.com', emailVerified: false },
        allowlist,
      ),
      false,
    );
    assert.equal(
      googleAccountMayAdminister(
        { provider: 'google', email: 'other@example.com', emailVerified: true },
        allowlist,
      ),
      false,
    );
    assert.equal(shopAdminIsConfigured({}), false);
    assert.equal(
      shopAdminIsConfigured({
        AUTH_SECRET: 'secret',
        AUTH_GOOGLE_ID: 'id',
        AUTH_GOOGLE_SECRET: 'secret',
        SHOP_ADMIN_EMAILS: 'editor@newcastledigest.com',
      }),
      true,
    );
  });
});

describe('shop admin product input', () => {
  it('turns a name into a slug and a dollar price into cents', () => {
    assert.equal(slugifyProductName(' Café Tote! '), 'cafe-tote');
    assert.equal(parseAudToCents('24'), 2400);
    assert.equal(parseAudToCents('24.5'), 2450);
    assert.equal(parseAudToCents('24.555'), null);
    assert.equal(parseAudToCents('-1'), null);
  });

  it('keeps published simple products priced, and refuses client stock below reserved', () => {
    const parsed = parseProductDraft({
      name: 'Tote',
      slug: '',
      description: 'Heavy cotton',
      requiresShipping: true,
      status: 'active',
      kind: 'simple',
      price: '18.00',
      sku: 'TOTE-01',
      onHand: 4,
      images: [{ url: 'https://cdn.example.com/tote.jpg', alt: 'Tote' }],
    });
    assert.equal(parsed.slug, 'tote');
    assert.equal(parsed.priceCents, 1800);
    assert.equal(parsed.images[0]?.url, 'https://cdn.example.com/tote.jpg');
    assert.equal(parsed.images[0]?.variantId, null);

    assert.equal(
      decideStockChange({ hasInventory: false, onHand: 0, reserved: 0, desired: 4 }).action,
      'open',
    );
    assert.deepEqual(
      decideStockChange({ hasInventory: true, onHand: 4, reserved: 1, desired: 6 }),
      { action: 'adjust', nextOnHand: 6, delta: 2 },
    );
    assert.equal(
      decideStockChange({ hasInventory: true, onHand: 4, reserved: 2, desired: 1 }).action,
      'invalid',
    );
    assert.throws(
      () =>
        parseProductDraft({
          name: 'Tote',
          status: 'active',
          kind: 'simple',
          price: '18',
          sku: 'TOTE-01',
          onHand: null,
        }),
      AdminInputError,
    );
  });

  it('puts variant prices on the options and ignores a product-level price', () => {
    assert.throws(
      () =>
        parseProductDraft({
          name: 'Cap',
          status: 'draft',
          kind: 'variants',
          price: '10.00',
          sku: '',
          variants: [],
        }),
      AdminInputError,
    );

    const parsed = parseProductDraft({
      name: 'Cap',
      status: 'active',
      kind: 'variants',
      price: '',
      sku: '',
      variants: [
        { name: 'Navy', sku: 'CAP-N', price: '32.00', active: true, onHand: 2 },
        { id: '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b', remove: true },
      ],
    });
    assert.equal(parsed.priceCents, null);
    assert.equal(parsed.variants[0]?.priceCents, 3200);
    assert.equal(parsed.variants[1]?.remove, true);
  });

  it('keeps existing https image links and option photos', () => {
    const parsed = parseProductDraft({
      name: 'Cap',
      status: 'draft',
      kind: 'variants',
      price: '',
      sku: '',
      variants: [{ name: 'Navy', sku: 'CAP-N', price: '32.00', active: true, onHand: 1 }],
      images: [
        { url: 'https://cdn.sanity.io/images/demo/production/old.jpg', alt: 'Front' },
        {
          url: 'https://cdn.example.com/navy.jpg',
          alt: 'Navy',
          variantId: '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b',
        },
      ],
    });
    assert.equal(parsed.images[0]?.variantId, null);
    assert.equal(parsed.images[1]?.variantId, '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b');
    assert.throws(
      () =>
        parseProductDraft({
          name: 'Tote',
          status: 'draft',
          kind: 'simple',
          images: [
            {
              url: 'https://cdn.example.com/navy.jpg',
              variantId: '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b',
            },
          ],
        }),
      AdminInputError,
    );
  });
});
