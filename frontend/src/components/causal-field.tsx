type CausalFieldProps = {
  active?: number;
  critical?: number;
  evidence?: number;
  compact?: boolean;
  className?: string;
};

const nodes = [
  { x: 12, y: 29, label: "INGEST", detail: "telemetry", tone: "neutral" },
  { x: 35, y: 18, label: "EVENT", detail: "kafka / 07", tone: "neutral" },
  { x: 51, y: 47, label: "CAUSE", detail: "ranked", tone: "accent" },
  { x: 77, y: 25, label: "STATE", detail: "postgres", tone: "neutral" },
  { x: 86, y: 65, label: "GATE", detail: "approval", tone: "safe" },
  { x: 28, y: 72, label: "TRACE", detail: "evidence", tone: "neutral" },
];

export default function CausalField({ active = 0, critical = 0, evidence = 0, compact = false, className = "" }: CausalFieldProps) {
  return (
    <figure className={`causal-field ${compact ? "causal-field--compact" : ""} ${className}`} aria-label="Live causal signal path">
      <div className="causal-field__header">
        <div><span className="eyebrow eyebrow--inverse">Causal field</span><p>Live correlation map / 07-A</p></div>
        <span className="field-status"><i />online</span>
      </div>

      <svg viewBox="0 0 100 86" role="img" aria-label="Telemetry flowing through evidence ranking and approval controls">
        <defs>
          <marker id="field-arrow" markerWidth="5" markerHeight="5" refX="4" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5" fill="none" stroke="currentColor" strokeWidth=".8" />
          </marker>
        </defs>
        <g className="field-grid">
          {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((value) => <path key={`x-${value}`} d={`M${value} 0V86`} />)}
          {[10, 20, 30, 40, 50, 60, 70, 80].map((value) => <path key={`y-${value}`} d={`M0 ${value}H100`} />)}
        </g>
        <g className="field-links" markerEnd="url(#field-arrow)">
          <path d="M13 29 C21 20, 26 20, 34 18" />
          <path d="M36 19 C43 24, 46 36, 50 46" />
          <path d="M29 71 C38 64, 45 55, 50 48" />
          <path d="M52 47 C62 40, 67 31, 76 26" />
          <path d="M52 48 C66 55, 73 62, 85 65" />
          <path className="field-links__ghost" d="M13 30 C19 47, 22 59, 28 71" />
        </g>
        <g className="field-pulses" aria-hidden="true">
          <circle r=".65"><animateMotion dur="3.6s" repeatCount="indefinite" path="M13 29 C21 20, 26 20, 34 18 C43 24, 46 36, 50 46" /></circle>
          <circle r=".65"><animateMotion dur="4.2s" begin="-1.6s" repeatCount="indefinite" path="M29 71 C38 64, 45 55, 50 48 C66 55, 73 62, 85 65" /></circle>
        </g>
        {nodes.map((node, index) => (
          <g key={node.label} className={`field-node field-node--${node.tone}`} transform={`translate(${node.x} ${node.y})`}>
            <circle r={node.tone === "accent" ? 2.4 : 1.65} />
            <circle className="field-node__ring" r={node.tone === "accent" ? 5.2 : 3.5} />
            <text x="0" y={node.y > 60 ? -7 : 8.5} textAnchor="middle">{String(index + 1).padStart(2, "0")} / {node.label}</text>
            <text className="field-node__detail" x="0" y={node.y > 60 ? -4.5 : 11} textAnchor="middle">{node.detail}</text>
          </g>
        ))}
      </svg>

      <figcaption>
        <span><b>{String(active).padStart(2, "0")}</b> active</span>
        <span><b>{String(critical).padStart(2, "0")}</b> critical</span>
        <span><b>{String(evidence).padStart(3, "0")}</b> evidence</span>
      </figcaption>
    </figure>
  );
}
