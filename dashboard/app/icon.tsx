import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 192, height: 192 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#ff6b35',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24px',
        }}
      >
        <span style={{ fontSize: 100, color: 'white', fontWeight: 'bold' }}>O</span>
      </div>
    ),
    { ...size }
  );
}
