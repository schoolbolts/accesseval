import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'AccessEval — ADA Website Accessibility Scanner';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f1729',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        {/* Top accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: 'linear-gradient(90deg, #059669, #34d399, #059669)',
          }}
        />

        {/* Icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#059669',
            marginBottom: '32px',
          }}
        >
          {/* Accessibility figure simplified */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="4.5" r="2" fill="white" stroke="none" />
            <path d="M12 7.5V14" />
            <path d="M9 10h6" />
            <path d="M10 14l-2 6" />
            <path d="M14 14l2 6" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            display: 'flex',
            fontSize: '72px',
            fontWeight: 800,
            color: 'white',
            letterSpacing: '-2px',
            lineHeight: 1.1,
            marginBottom: '20px',
          }}
        >
          Access
          <span style={{ color: '#059669' }}>Eval</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: 'flex',
            fontSize: '28px',
            fontWeight: 400,
            color: '#94a3b8',
            textAlign: 'center',
            lineHeight: 1.4,
            maxWidth: '800px',
          }}
        >
          ADA Website Accessibility Scanner for Schools & Government
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#059669',
            }}
          />
          <div
            style={{
              display: 'flex',
              fontSize: '16px',
              color: '#64748b',
              fontWeight: 500,
            }}
          >
            accesseval.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
