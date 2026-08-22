// Flat, token-palette illustration of the brief's hero art: a phone on a desk
// beside a closed laptop, lock screen showing one clean price-drop notification.
export default function HeroVisual() {
  return (
    <svg viewBox="0 0 420 440" role="img" aria-label="A phone on a desk showing a single DropWatch price-drop notification">
      {/* desk */}
      <rect x="0" y="330" width="420" height="110" rx="8" fill="var(--surface)" />
      <line x1="0" y1="330" x2="420" y2="330" stroke="var(--border)" strokeWidth="1" />
      {/* closed laptop beside the phone */}
      <rect x="270" y="303" width="140" height="18" rx="6" fill="var(--background)" stroke="var(--border)" />
      <rect x="262" y="321" width="156" height="10" rx="5" fill="var(--surface)" stroke="var(--border)" />
      {/* phone body */}
      <rect x="90" y="24" width="180" height="356" rx="8" fill="var(--text-primary)" />
      {/* phone screen */}
      <rect x="98" y="32" width="164" height="340" rx="8" fill="var(--background)" />
      {/* lock-screen clock */}
      <text
        x="180"
        y="98"
        textAnchor="middle"
        fontFamily="var(--font-heading)"
        fontWeight="700"
        fontSize="40"
        fill="var(--text-primary)"
      >
        9:41
      </text>
      <text
        x="180"
        y="120"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="12"
        fill="var(--text-muted)"
      >
        Tuesday, March 3
      </text>
      {/* the one notification */}
      <rect x="110" y="150" width="140" height="96" rx="8" fill="var(--surface)" stroke="var(--border)" />
      <rect x="122" y="164" width="58" height="16" rx="8" fill="var(--accent)" />
      <text
        x="151"
        y="175.5"
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontWeight="600"
        fontSize="9"
        fill="var(--text-on-accent)"
      >
        PRICE DROP
      </text>
      <text x="122" y="200" fontFamily="var(--font-body)" fontWeight="600" fontSize="11" fill="var(--text-primary)">
        Sony WH-1000XM5
      </text>
      <text x="122" y="218" fontFamily="var(--font-body)" fontSize="11" fill="var(--text-primary)">
        $248.00 at Best Buy
      </text>
      <text x="122" y="234" fontFamily="var(--font-body)" fontSize="10" fill="var(--text-muted)">
        Your target was $250
      </text>
    </svg>
  );
}
