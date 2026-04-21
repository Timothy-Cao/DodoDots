import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
            backgroundSize: '14px 14px',
            opacity: 0.5,
            display: 'flex',
          }}
        />
        {/* Outer halo */}
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            border: '3px solid #39d0ff',
            boxShadow: '0 0 28px #39d0ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Inner node */}
          <div
            style={{
              width: 50,
              height: 50,
              borderRadius: '50%',
              background: '#39ff8e',
              boxShadow: '0 0 20px #39ff8e, 0 0 40px #39ff8e',
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
