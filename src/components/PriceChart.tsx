// 6-month price line per the brief: flat around $329–$348 with one sharp dip
// to $248 at the right edge, marked with an accent dot and label.
export default function PriceChart() {
  return (
    <svg viewBox="0 0 460 170" role="img" aria-label="Six-month price history: flat between $329 and $348, dropping sharply to $248 at the right edge, where the alert was sent">
      <polyline
        points="8,30 60,34 110,26 160,38 210,30 260,36 310,28 360,34 405,31 432,29 444,122"
        fill="none"
        stroke="var(--text-primary)"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="444" cy="122" r="4.5" fill="var(--accent)" />
      <text
        x="436"
        y="112"
        textAnchor="end"
        fontFamily="var(--font-body)"
        fontWeight="600"
        fontSize="13"
        fill="var(--text-primary)"
      >
        $248 — alert sent
      </text>
      {["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((m, i) => (
        <text
          key={m}
          x={20 + i * 84}
          textAnchor="middle"
          y="160"
          fontFamily="var(--font-body)"
          fontSize="12"
          fill="var(--text-muted)"
        >
          {m}
        </text>
      ))}
    </svg>
  );
}
