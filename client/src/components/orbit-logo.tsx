type OrbitLogoProps = {
  className?: string;
  markOnly?: boolean;
  testId?: string;
};

export function OrbitMark({
  className = "h-8 w-8",
  testId = "orbit-mark",
}: Omit<OrbitLogoProps, "markOnly">) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="Orbit mark"
      data-testid={testId}
    >
      <ellipse
        cx="24"
        cy="24"
        rx="17.5"
        ry="9.5"
        transform="rotate(-27 24 24)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <circle cx="24" cy="24" r="4.4" fill="currentColor" />
      <path
        d="M38.3 12.2c2.9.9 4.3 3.2 3.9 6.1-2.9.1-5.1-1.3-5.9-3.9-.2-.8-.2-1.5 0-2.3.7-.1 1.3-.1 2 0Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function OrbitLogo({
  className = "",
  markOnly = false,
  testId = "orbit-logo",
}: OrbitLogoProps) {
  if (markOnly) {
    return <OrbitMark className={className || "h-8 w-8"} testId={testId} />;
  }

  return (
    <div
      className={`inline-flex items-center gap-2.5 text-[#2F5E4E] ${className}`}
      data-testid={testId}
      aria-label="Orbit"
    >
      <OrbitMark className="h-8 w-8 shrink-0" testId={`${testId}-mark`} />
      <span className="text-[15px] font-semibold tracking-[0.34em]">ORBIT</span>
    </div>
  );
}