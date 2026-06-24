// The ClinicFlow mark: a rounded square containing a pulse line that
// resolves into a checkmark — representing the live queue ("flow") and a
// completed visit ("check"). Built entirely with CSS variables so it
// adapts to light/dark theme automatically and scales cleanly at any size.
export default function Logo({ size = 32, title = 'ClinicFlow' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={title}>
      <defs>
        <linearGradient id="cf-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="40" height="40" rx="11" fill="url(#cf-grad)" />
      <path
        d="M7 22 L13 22 L16 14 L20 28 L24 18 L27 22 L33 22"
        fill="none" stroke="white" strokeWidth="2.6"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
