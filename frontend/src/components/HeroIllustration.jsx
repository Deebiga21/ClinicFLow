// A hand-built SVG illustration for the landing page hero — a stylized
// "digital queue" scene (ticket counter + people in line) using the app's
// own CSS variables, so it automatically matches light/dark theme.
export default function HeroIllustration({ style }) {
  return (
    <svg viewBox="0 0 480 420" width="100%" height="auto" style={style} role="img" aria-label="Illustration of a digital clinic queue display with patients waiting">
      {/* Backdrop blob */}
      <circle cx="240" cy="210" r="190" fill="var(--color-primary-soft)" opacity="0.6" />

      {/* Floating queue ticket card */}
      <g transform="translate(120,40)">
        <rect x="0" y="0" width="220" height="130" rx="18" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5" />
        <circle cx="26" cy="28" r="7" fill="var(--color-accent)" />
        <rect x="44" y="22" width="90" height="8" rx="4" fill="var(--color-ink-soft)" opacity="0.5" />
        <text x="20" y="80" fontFamily="Fraunces, serif" fontSize="40" fontWeight="700" fill="var(--color-primary)">#08</text>
        <rect x="20" y="98" width="120" height="7" rx="3.5" fill="var(--color-border)" />
        <rect x="20" y="98" width="70" height="7" rx="3.5" fill="var(--color-primary)" />
        <rect x="160" y="92" width="42" height="22" rx="8" fill="var(--color-primary-soft)" />
        <text x="181" y="107" fontSize="11" fontWeight="700" fill="var(--color-primary-dark)" textAnchor="middle">live</text>
      </g>

      {/* Reception desk */}
      <g transform="translate(60,250)">
        <rect x="0" y="40" width="150" height="70" rx="10" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5" />
        <rect x="0" y="40" width="150" height="14" rx="7" fill="var(--color-accent)" opacity="0.85" />
        <circle cx="40" cy="90" r="14" fill="var(--color-primary)" />
        <rect x="62" y="80" width="70" height="8" rx="4" fill="var(--color-ink-soft)" opacity="0.4" />
        <rect x="62" y="94" width="50" height="8" rx="4" fill="var(--color-ink-soft)" opacity="0.25" />
      </g>

      {/* Waiting patients (simple rounded figures) */}
      {[
        { x: 260, y: 280, c: 'var(--color-primary)' },
        { x: 320, y: 300, c: 'var(--color-accent)' },
        { x: 380, y: 285, c: 'var(--color-primary-dark)' },
      ].map((p, i) => (
        <g key={i} transform={`translate(${p.x},${p.y})`}>
          <circle cx="0" cy="0" r="16" fill={p.c} opacity="0.18" />
          <circle cx="0" cy="-4" r="9" fill={p.c} />
          <path d="M -14 22 Q 0 2 14 22 L 14 30 Q 0 14 -14 30 Z" fill={p.c} />
        </g>
      ))}

      {/* Connecting dashed path (queue flow) */}
      <path d="M 230 170 Q 200 220 230 280" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray="5 6" fill="none" opacity="0.5" />

      {/* Small notification bubble */}
      <g transform="translate(330,150)">
        <rect x="0" y="0" width="100" height="46" rx="14" fill="var(--color-surface)" stroke="var(--color-border)" strokeWidth="1.5" />
        <circle cx="20" cy="23" r="6" fill="var(--color-accent)" />
        <rect x="34" y="14" width="52" height="7" rx="3.5" fill="var(--color-ink-soft)" opacity="0.5" />
        <rect x="34" y="26" width="36" height="7" rx="3.5" fill="var(--color-ink-soft)" opacity="0.3" />
      </g>
    </svg>
  );
}
