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
        rx="17"
        ry="9"
        transform="rotate(-24 24 24)"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="24" cy="24" r="4.6" fill="currentColor" />
      <circle cx="39.1" cy="17.1" r="2.7" fill="currentColor" />
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
      <span className="text-[15px] font-semibold tracking-[0.3em]">ORBIT</span>
    </div>
  );
}