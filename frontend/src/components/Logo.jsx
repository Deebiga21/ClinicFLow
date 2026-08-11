export default function Logo({ size = 32, title = 'ClinicFlow' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" role="img" aria-label={title}>
      <rect x="0" y="0" width="40" height="40" rx="8" fill="var(--color-primary)" />
      <path
        d="M7 22 L13 22 L16 14 L20 28 L24 18 L27 22 L33 22"
        fill="none" stroke="white" strokeWidth="2.8"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}
