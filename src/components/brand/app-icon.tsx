/** SVG used by app/icon.tsx and static brand assets. */
export function AppIconSvg({ size = 32 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="rq-icon-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#rq-icon-grad)" />
      <path
        d="M9 22V10h5.8a3.6 3.6 0 0 1 0 7.2H12v4.8H9zm3-7.2h2.6a1.2 1.2 0 0 0 0-2.4H12v2.4z"
        fill="white"
        fillOpacity={0.95}
      />
      <path
        d="M21 8.5a7 7 0 1 1 0 14"
        fill="none"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity={0.4}
      />
    </svg>
  );
}
