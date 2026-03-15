import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const size = {
  width: 180,
  height: 180,
};
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '180px',
          height: '180px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '40px',
          backgroundColor: '#059669',
        }}
      >
        <svg
          width="110"
          height="110"
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
    ),
    {
      ...size,
    },
  );
}
