interface LogoProps {
  size?: number;
}

export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Travanora logo"
    >
      <rect width="32" height="32" rx="7" fill="#FFBF00" />
      <rect x="8" y="9" width="16" height="3" rx="1.5" fill="#392A00" />
      <rect x="13.5" y="12" width="5" height="11" rx="1.5" fill="#392A00" />
      <circle cx="25.5" cy="25.5" r="3.5" fill="#392A00" />
    </svg>
  );
}
