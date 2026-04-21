import { ImageResponse } from 'next/og';

export const size = { width: 512, height: 512 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#05070d',
          position: 'relative',
        }}
      >
        {/* Tron grid backdrop */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(#0f1a2b 1px, transparent 1px), linear-gradient(90deg, #0f1a2b 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.5,
            display: 'flex',
          }}
        />
        {/* Outer halo */}
        <div
          style={{
            width: 340,
            height: 340,
            borderRadius: '50%',
            border: '8px solid #39d0ff',
            boxShadow: '0 0 80px #39d0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner node */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: '50%',
              background: '#39ff8e',
              boxShadow: '0 0 60px #39ff8e, 0 0 120px #39ff8e',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
