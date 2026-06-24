// Renders a top-down spool of filament: dark cardboard hub, the
// filament wound around it in its actual hex color, with a faint
// "winding" pattern of concentric strokes that thins out as the
// spool depletes. Used in the stock grid and any future spool UI.

const HUB_R = 22;
const MAX_R = 56;
const FLANGE_R = 60;

export function SpoolVisual({
  color,
  fillPct,
  size = 120,
}: {
  color: string;
  fillPct: number; // 0..1
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(1, fillPct));
  const filamentR = HUB_R + (MAX_R - HUB_R) * Math.max(clamped, 0.05);
  const ringCount = Math.max(
    0,
    Math.floor((filamentR - HUB_R - 2) / 3),
  );

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <radialGradient id={`flange-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#f3f4f6" />
          <stop offset="100%" stopColor="#d1d5db" />
        </radialGradient>
        <radialGradient id={`filament-${color}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="80%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.85" />
        </radialGradient>
      </defs>

      {/* Spool side / flange */}
      <circle
        cx="60"
        cy="60"
        r={FLANGE_R}
        fill={`url(#flange-${color})`}
        stroke="#9ca3af"
        strokeOpacity="0.4"
        strokeWidth="1"
      />

      {/* Wound filament */}
      {clamped > 0.02 && (
        <>
          <circle
            cx="60"
            cy="60"
            r={filamentR}
            fill={`url(#filament-${color})`}
          />
          <g fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5">
            {Array.from({ length: ringCount }).map((_, i) => (
              <circle
                key={i}
                cx="60"
                cy="60"
                r={HUB_R + 2 + i * 3}
              />
            ))}
          </g>
        </>
      )}

      {/* Hub / cardboard core */}
      <circle
        cx="60"
        cy="60"
        r={HUB_R}
        fill="#3f3f46"
        stroke="#27272a"
        strokeWidth="1"
      />
      <circle
        cx="60"
        cy="60"
        r={HUB_R - 4}
        fill="#27272a"
      />

      {/* Center hole */}
      <circle cx="60" cy="60" r="6" fill="#0a0a0a" />
    </svg>
  );
}
