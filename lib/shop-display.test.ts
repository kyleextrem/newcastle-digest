import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  CART_VERSION,
  addCartItem,
  availabilityLabel,
  buildCartPreview,
  cataloguePriceLabel,
  formatAudCents,
  parseCart,
  serializeCart,
  type CartCatalogRow,
  type CartItem,
} from './shop-display';

const productId = '6f1e8c2a-1b3d-4e5f-8a9b-0c1d2e3f4a5b';
const variantId = '7a2b9d3c-2c4e-4f60-9b0c-1d2e3f4a5b6c';

describe('catalogue display', () => {
  it('formats AUD cents', () => {
    assert.equal(formatAudCents(2500), '$25.00');
    assert.equal(formatAudCents(0), '$0.00');
  });

  it('labels simple and variant prices', () => {
    assert.equal(
      cataloguePriceLabel({
        priceCents: 1800,
        variantCount: 0,
        minVariantPriceCents: null,
        maxVariantPriceCents: null,
      }),
      '$18.00',
    );
    assert.equal(
      cataloguePriceLabel({
        priceCents: null,
        variantCount: 2,
        minVariantPriceCents: 1500,
        maxVariantPriceCents: 3200,
      }),
      'From $15.00',
    );
    assert.equal(availabilityLabel(0), 'Sold out');
    assert.equal(availabilityLabel(1), 'Only 1 left');
    assert.equal(availabilityLabel(8), 'In stock');
  });
});

describe('shop cart storage', () => {
  it('keeps only identifiers and quantities', () => {
    const stored = {
      version: CART_VERSION,
      items: [
        {
          productId,
          variantId: null,
          quantity: 2,
          priceCents: 9999,
          name: 'Should not survive',
        },
      ],
    };

    const parsed = parseCart(stored);
    assert.deepEqual(parsed, [{ productId, variantId: null, quantity: 2 }]);
    assert.equal(serializeCart(parsed).includes('priceCents'), false);
    assert.equal(serializeCart(parsed).includes('Should not survive'), false);
  });

  it('rejects an unknown cart version and merges the same line', () => {
    assert.deepEqual(parseCart({ version: 2, items: [] }), []);
    const start: CartItem[] = [{ productId, variantId, quantity: 1 }];
    assert.deepEqual(addCartItem(start, { productId, variantId, quantity: 2 }), [
      { productId, variantId, quantity: 3 },
    ]);
  });
});

describe('cart preview', () => {
  it('prices a simple product from the catalogue row, not the cart', () => {
    const items: CartItem[] = [{ productId, variantId: null, quantity: 2 }];
    const preview = buildCartPreview(items, [simpleRow({ priceCents: 1250, available: 4 })]);
    assert.equal(preview.checkoutAvailable, true);
    assert.equal(preview.lines[0]?.state, 'available');
    assert.equal(preview.lines[0]?.unitPriceLabel, '$12.50');
    assert.equal(preview.lines[0]?.linePriceLabel, '$25.00');
    assert.equal(preview.totalLabel, '$25.00');
  });

  it('marks sold-out, limited, and mismatched variants', () => {
    const soldOut = buildCartPreview(
      [{ productId, variantId: null, quantity: 1 }],
      [simpleRow({ priceCents: 1000, available: 0 })],
    );
    assert.equal(soldOut.lines[0]?.state, 'sold_out');
    assert.equal(soldOut.totalLabel, null);

    const limited = buildCartPreview(
      [{ productId, variantId: null, quantity: 4 }],
      [simpleRow({ priceCents: 1000, available: 2 })],
    );
    assert.equal(limited.lines[0]?.state, 'limited');
    assert.equal(limited.checkoutAvailable, false);

    const wrongShape = buildCartPreview(
      [{ productId, variantId, quantity: 1 }],
      [simpleRow({ priceCents: 1000, available: 5 })],
    );
    assert.equal(wrongShape.lines[0]?.state, 'unavailable');
  });
});

function simpleRow(input: { priceCents: number; available: number }): CartCatalogRow {
  return {
    productId,
    variantId: null,
    productFound: true,
    active: true,
    hasVariants: false,
    variantFound: false,
    variantActive: false,
    productName: 'Tote',
    variantName: null,
    slug: 'tote',
    priceCents: input.priceCents,
    available: input.available,
    imageUrl: null,
    imageAlt: '',
  };
}
