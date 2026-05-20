import { cn } from "@/lib/utils";

type RecalliqMarkProps = {
  className?: string;
  size?: number;
};

/** Icon-only mark — favicon, avatars, compact UI. */
export function RecalliqMark({ className, size = 32 }: RecalliqMarkProps) {
  const id = "rq-mark-grad";
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="45%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${id})`} />
      <path
        d="M9 22V10h5.8a3.6 3.6 0 0 1 0 7.2H12v4.8H9zm3-7.2h2.6a1.2 1.2 0 0 0 0-2.4H12v2.4z"
        fill="white"
        fillOpacity={0.95}
      />
      <path
        d="M19 22c0-6 2.5-10.5 6-12"
        fill="none"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity={0.55}
      />
      <path
        d="M21 8.5a7 7 0 1 1 0 14"
        fill="none"
        stroke="white"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeOpacity={0.35}
      />
    </svg>
  );
}
