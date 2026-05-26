type Props = {
  size?: number;
  className?: string;
};

export default function DocuMindLogo({ size = 40, className }: Props) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id="documind-logo-fill" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b82f6" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <path
        d="M17 12c-4.4 1.8-7 5.5-7 10.4 0 2.4.6 4.4 1.8 6.3 1.4 2.2 3.4 3.8 5.8 4.8"
        stroke="url(#documind-logo-fill)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M31 12c4.4 1.8 7 5.5 7 10.4 0 2.4-.6 4.4-1.8 6.3-1.4 2.2-3.4 3.8-5.8 4.8"
        stroke="url(#documind-logo-fill)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M15.2 18.2 24 14l8.8 4.2v10.8L24 33.2l-8.8-4.2V18.2Z"
        stroke="url(#documind-logo-fill)"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M24 14v19.2" stroke="url(#documind-logo-fill)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="m15.2 18.2 8.8 4.2 8.8-4.2" stroke="url(#documind-logo-fill)" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="14" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
      <circle cx="15.2" cy="18.2" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
      <circle cx="32.8" cy="18.2" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
      <circle cx="24" cy="24" r="2.8" fill="url(#documind-logo-fill)" />
      <circle cx="15.2" cy="29.8" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
      <circle cx="32.8" cy="29.8" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
      <circle cx="24" cy="33.2" r="2.6" fill="#ffffff" stroke="url(#documind-logo-fill)" strokeWidth="2" />
    </svg>
  );
}