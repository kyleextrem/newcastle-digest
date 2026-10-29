import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  inspectShopImage,
  isPersistedImageUrl,
  runWithLimit,
  SHOP_IMAGE_MAX_BYTES,
} from './shop-admin-images';

describe('shop admin image files', () => {
  it('accepts a jpeg whose bytes match the file type', () => {
    const bytes = jpegBytes(80);
    const result = inspectShopImage({
      name: 'Tote Photo.JPG',
      size: bytes.byteLength,
      type: 'image/jpeg',
      bytes,
    });
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.contentType, 'image/jpeg');
      assert.equal(result.filename, 'shop-tote-photo.jpg');
    }
  });

  it('rejects a renamed executable, an oversized file, and a type mismatch', () => {
    const exe = Uint8Array.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00]);
    const rejected = inspectShopImage({
      name: 'photo.jpg',
      size: exe.byteLength,
      type: 'image/jpeg',
      bytes: exe,
    });
    assert.equal(rejected.ok, false);

    const jpeg = jpegBytes(32);
    const oversized = inspectShopImage({
      name: 'wide.jpg',
      size: SHOP_IMAGE_MAX_BYTES + 1,
      type: 'image/jpeg',
      bytes: jpeg,
    });
    assert.equal(oversized.ok, false);

    const mismatch = inspectShopImage({
      name: 'photo.png',
      size: jpeg.byteLength,
      type: 'image/png',
      bytes: jpeg,
    });
    assert.equal(mismatch.ok, false);
  });

  it('keeps https image links and runs a limited pool in completion order', async () => {
    assert.equal(isPersistedImageUrl('https://cdn.sanity.io/images/demo/p.jpg'), true);
    assert.equal(isPersistedImageUrl('blob:http://localhost:3004/abc'), false);

    const started: number[] = [];
    const finished: number[] = [];
    await runWithLimit([30, 5, 10], 2, async (wait, index) => {
      started.push(index);
      await new Promise((resolve) => setTimeout(resolve, wait));
      finished.push(index);
    });
    assert.deepEqual(started, [0, 1, 2]);
    assert.deepEqual(finished, [1, 2, 0]);
  });
});

function jpegBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  bytes.fill(0, 3);
  return bytes;
}
