import { ImageResponse } from 'next/og';

export const alt = 'Newcastle Digest';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#251f18',
          color: '#faf9f6',
          padding: '72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            letterSpacing: 6,
            textTransform: 'uppercase',
            color: '#849bff',
          }}
        >
          Newcastle Digest
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 0.95, letterSpacing: -2 }}>
            What&apos;s on in Newcastle,
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 76,
              fontWeight: 800,
              lineHeight: 0.95,
              letterSpacing: -2,
              color: '#849bff',
            }}
          >
            every Wednesday.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
