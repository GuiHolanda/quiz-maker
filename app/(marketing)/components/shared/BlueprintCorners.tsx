interface BlueprintCornersProps {
  // Corners on a dark surface need a lighter ink than the text-derived default.
  readonly dark?: boolean;
}

const POSITIONS = ['tl', 'tr', 'bl', 'br'] as const;

// Purely decorative. Requires a positioned ancestor — prefer <BlueprintFrame>,
// which pairs the frame and the corners so the two cannot drift apart.
export function BlueprintCorners({ dark }: BlueprintCornersProps) {
  const tone = dark ? 'corner corner-dark' : 'corner';

  return (
    <>
      {POSITIONS.map((position) => (
        <span key={position} className={`${tone} ${position}`} aria-hidden="true" />
      ))}
    </>
  );
}
