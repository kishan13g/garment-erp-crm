import type { Measurements, PatternPiece } from "../legacy-types";

interface PatternDiagramProps {
  piece: PatternPiece;
  measurements: Measurements;
  index: number;
}

function getPatternShape(pieceName: string, m: Measurements) {
  const name = pieceName.toLowerCase();

  const W = 280;
  const H = 320;
  const cx = 150;
  const cy = 170;

  const scaleW = Math.min(W, (m.bust / 4) * 3.2);
  const scaleH = Math.min(H, m.length * 1.8);
  const left = cx - scaleW / 2;
  const right = cx + scaleW / 2;
  const top = cy - scaleH / 2;
  const bottom = cy + scaleH / 2;

  if (name.includes("front") || name.includes("back")) {
    const neckDepth = name.includes("front") ? 18 : 10;
    const neckWidth = 22;
    const shoulderSlope = 12;
    const armholeDepth = scaleH * 0.28;
    const sideSeamFlare = (m.hip / m.bust - 1) * 20;

    const cuttingPath = [
      `M ${cx - neckWidth} ${top}`,
      `Q ${cx} ${top + neckDepth} ${cx + neckWidth} ${top}`,
      `L ${right - 10} ${top + shoulderSlope}`,
      `Q ${right} ${top + armholeDepth * 0.5} ${right - 5} ${top + armholeDepth}`,
      `L ${right + sideSeamFlare} ${bottom}`,
      `L ${left - sideSeamFlare} ${bottom}`,
      `L ${left + 5} ${top + armholeDepth}`,
      `Q ${left} ${top + armholeDepth * 0.5} ${left + 10} ${top + shoulderSlope}`,
      "Z",
    ].join(" ");

    const foldPath = `M ${left + 5} ${top + armholeDepth} L ${right - 5} ${top + armholeDepth}`;
    const waistPath = `M ${left + sideSeamFlare * 0.5} ${top + scaleH * 0.45} L ${right - sideSeamFlare * 0.5} ${top + scaleH * 0.45}`;

    return {
      cuttingPath,
      foldPaths: [foldPath],
      stitchPaths: [waistPath],
      grainLine: { x1: cx, y1: top + 40, x2: cx, y2: bottom - 20 },
      dimensions: [
        { id: "bust", x: cx, y: top - 12, text: `Bust: ${m.bust}cm` },
        {
          id: "length",
          x: right + 20,
          y: cy,
          text: `Length: ${m.length}cm`,
          rotate: true,
        },
        { id: "hip", x: cx, y: bottom + 16, text: `Hip: ${m.hip}cm` },
      ],
    };
  }

  if (name.includes("sleeve")) {
    const sleeveWidth = Math.min(W * 0.9, m.bust * 0.4);
    const sleeveHeight = Math.min(H * 0.85, m.length * 0.62);
    const sl = cx - sleeveWidth / 2;
    const sr = cx + sleeveWidth / 2;
    const st = cy - sleeveHeight / 2;
    const sb = cy + sleeveHeight / 2;
    const capHeight = sleeveHeight * 0.28;

    const cuttingPath = [
      `M ${cx} ${st}`,
      `Q ${sr + 10} ${st + capHeight * 0.4} ${sr} ${st + capHeight}`,
      `L ${sr - 8} ${sb}`,
      `L ${sl + 8} ${sb}`,
      `L ${sl} ${st + capHeight}`,
      `Q ${sl - 10} ${st + capHeight * 0.4} ${cx} ${st}`,
    ].join(" ");

    return {
      cuttingPath,
      foldPaths: [] as string[],
      stitchPaths: [`M ${sl + 8} ${sb} L ${sr - 8} ${sb}`],
      grainLine: { x1: cx, y1: st + capHeight + 10, x2: cx, y2: sb - 20 },
      dimensions: [
        { id: "cap", x: cx, y: st - 12, text: "Sleeve Cap" },
        {
          id: "len",
          x: sr + 20,
          y: cy,
          text: `${Math.round(m.length * 0.62)}cm`,
          rotate: true,
        },
        {
          id: "cuff",
          x: cx,
          y: sb + 16,
          text: `Cuff: ${Math.round(m.bust * 0.22)}cm`,
        },
      ],
    };
  }

  if (name.includes("waistband") || name.includes("band")) {
    const bandW = Math.min(W * 0.95, m.waist * 1.4);
    const bandH = 50;
    const bl = cx - bandW / 2;
    const br = cx + bandW / 2;
    const bt = cy - bandH / 2;
    const bb = cy + bandH / 2;

    return {
      cuttingPath: `M ${bl} ${bt} L ${br} ${bt} L ${br} ${bb} L ${bl} ${bb} Z`,
      foldPaths: [`M ${bl} ${cy} L ${br} ${cy}`],
      stitchPaths: [] as string[],
      grainLine: { x1: bl + 20, y1: cy, x2: br - 20, y2: cy },
      dimensions: [
        { id: "waist", x: cx, y: bt - 12, text: `Waist: ${m.waist}cm` },
        { id: "width", x: br + 20, y: cy, text: "Width: 5cm", rotate: true },
      ],
    };
  }

  if (name.includes("collar")) {
    const cW = Math.min(W * 0.85, m.bust * 0.35);
    const cH = 60;
    const cl2 = cx - cW / 2;
    const cr = cx + cW / 2;
    const ct = cy - cH / 2;
    const cb2 = cy + cH / 2;

    return {
      cuttingPath: [
        `M ${cl2} ${ct}`,
        `Q ${cx} ${ct - 15} ${cr} ${ct}`,
        `L ${cr} ${cb2}`,
        `Q ${cx} ${cb2 + 8} ${cl2} ${cb2}`,
        "Z",
      ].join(" "),
      foldPaths: [`M ${cl2} ${cy} L ${cr} ${cy}`],
      stitchPaths: [] as string[],
      grainLine: { x1: cl2 + 20, y1: cy, x2: cr - 20, y2: cy },
      dimensions: [
        {
          id: "neck",
          x: cx,
          y: ct - 20,
          text: `Neck: ${Math.round(m.bust * 0.32)}cm`,
        },
        { id: "h", x: cr + 20, y: cy, text: "H: 6cm", rotate: true },
      ],
    };
  }

  if (name.includes("facing") || name.includes("neckline")) {
    const fW = Math.min(W * 0.7, m.bust * 0.28);
    const fH = 70;
    const fl = cx - fW / 2;
    const fr = cx + fW / 2;
    const ft = cy - fH / 2;
    const fb = cy + fH / 2;

    return {
      cuttingPath: [
        `M ${fl} ${ft}`,
        `Q ${cx} ${ft + 20} ${fr} ${ft}`,
        `L ${fr} ${fb}`,
        `Q ${cx} ${fb - 10} ${fl} ${fb}`,
        "Z",
      ].join(" "),
      foldPaths: [] as string[],
      stitchPaths: [`M ${fl} ${ft} Q ${cx} ${ft + 20} ${fr} ${ft}`],
      grainLine: { x1: cx, y1: ft + 15, x2: cx, y2: fb - 15 },
      dimensions: [
        { id: "label", x: cx, y: ft - 12, text: "Neckline Facing" },
        {
          id: "w",
          x: cx,
          y: fb + 16,
          text: `W: ${Math.round(m.bust * 0.28)}cm`,
        },
      ],
    };
  }

  return {
    cuttingPath: `M ${left} ${top} L ${right} ${top} L ${right} ${bottom} L ${left} ${bottom} Z`,
    foldPaths: [] as string[],
    stitchPaths: [] as string[],
    grainLine: { x1: cx, y1: top + 20, x2: cx, y2: bottom - 20 },
    dimensions: [
      { id: "w", x: cx, y: top - 12, text: `W: ${Math.round(scaleW / 3)}cm` },
      {
        id: "h",
        x: right + 20,
        y: cy,
        text: `H: ${Math.round(scaleH / 1.8)}cm`,
        rotate: true,
      },
    ],
  };
}

const COLORS = [
  "oklch(0.95 0.04 20)",
  "oklch(0.96 0.03 60)",
  "oklch(0.95 0.03 140)",
  "oklch(0.95 0.04 280)",
  "oklch(0.96 0.04 320)",
];

export function PatternDiagram({
  piece,
  measurements,
  index,
}: PatternDiagramProps) {
  const shape = getPatternShape(piece.name, measurements);
  const fillColor = COLORS[index % COLORS.length];

  return (
    <div className="bg-card rounded-lg shadow-pattern overflow-hidden border border-border/60">
      <div className="px-4 pt-3 pb-1 border-b border-border/40 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-foreground">
          {piece.name}
        </h3>
        {piece.cutOnFold && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
            Cut on Fold
          </span>
        )}
      </div>

      <div className="p-3 pattern-grid">
        <svg
          viewBox="0 0 300 380"
          width="100%"
          height="auto"
          style={{ maxHeight: 280 }}
          role="img"
          aria-label={`Pattern piece: ${piece.name}`}
        >
          <title>{piece.name} pattern piece</title>
          <path
            d={shape.cuttingPath}
            className="seam-allowance"
            style={{ transform: "scale(1.03)", transformOrigin: "150px 170px" }}
          />
          <path d={shape.cuttingPath} fill={fillColor} fillOpacity={0.6} />
          <path d={shape.cuttingPath} className="cutting-line" />

          {shape.foldPaths.map((fp) => (
            <path key={fp} d={fp} className="fold-line" />
          ))}

          {shape.stitchPaths.map((sp) => (
            <path
              key={sp}
              d={sp}
              stroke="oklch(0.63 0.12 40)"
              strokeWidth="1"
              strokeDasharray="4 2"
              fill="none"
              opacity={0.7}
            />
          ))}

          <line
            x1={shape.grainLine.x1}
            y1={shape.grainLine.y1}
            x2={shape.grainLine.x2}
            y2={shape.grainLine.y2}
            className="grain-line"
          />
          <polygon
            points={`${shape.grainLine.x1},${shape.grainLine.y1 + 10} ${shape.grainLine.x1 - 4},${shape.grainLine.y1 + 18} ${shape.grainLine.x1 + 4},${shape.grainLine.y1 + 18}`}
            fill="oklch(0.63 0.12 40)"
          />
          <polygon
            points={`${shape.grainLine.x2},${shape.grainLine.y2 - 10} ${shape.grainLine.x2 - 4},${shape.grainLine.y2 - 18} ${shape.grainLine.x2 + 4},${shape.grainLine.y2 - 18}`}
            fill="oklch(0.63 0.12 40)"
          />

          {shape.dimensions.map((d) => (
            <text
              key={d.id}
              x={d.x}
              y={d.y}
              textAnchor="middle"
              fontSize="11"
              fill="oklch(0.35 0.04 265)"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              fontWeight="500"
              transform={d.rotate ? `rotate(-90, ${d.x}, ${d.y})` : undefined}
            >
              {d.text}
            </text>
          ))}

          <line
            x1={148}
            y1={340}
            x2={152}
            y2={348}
            stroke="oklch(0.18 0.02 265)"
            strokeWidth="2"
          />
        </svg>
      </div>

      <div className="px-4 py-2 border-t border-border/40 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <title>Cutting line</title>
            <line
              x1="0"
              y1="4"
              x2="20"
              y2="4"
              stroke="oklch(0.18 0.02 265)"
              strokeWidth="2"
            />
          </svg>
          Cutting line
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <title>Fold line</title>
            <line
              x1="0"
              y1="4"
              x2="20"
              y2="4"
              stroke="oklch(0.52 0.13 12)"
              strokeWidth="1.5"
              strokeDasharray="6 3"
            />
          </svg>
          Fold line
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="20" height="8" aria-hidden="true">
            <title>Grain line</title>
            <line
              x1="0"
              y1="4"
              x2="20"
              y2="4"
              stroke="oklch(0.63 0.12 40)"
              strokeWidth="1.5"
            />
          </svg>
          Grain line
        </span>
      </div>

      {piece.instructions && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground italic">
            {piece.instructions}
          </p>
        </div>
      )}
    </div>
  );
}
