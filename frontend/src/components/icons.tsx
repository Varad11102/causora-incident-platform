import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const defaults = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function LogoMark(props: IconProps) {
  return <svg {...defaults} {...props} viewBox="0 0 32 32"><path d="M16 3.5 27 9.8v12.4L16 28.5 5 22.2V9.8L16 3.5Z" /><path d="m10.2 12.2 5.8-3.3 5.8 3.3v6.6L16 22.1l-5.8-3.3v-6.6Z" /><path d="M16 8.9v13.2M10.2 12.2l11.6 6.6M21.8 12.2l-11.6 6.6" /></svg>;
}

export function ActivityIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M3 12h4l2.4-7 5.2 14 2.3-7H21" /></svg>;
}

export function AlertIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M10.3 3.7 2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.7a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4M12 17h.01" /></svg>;
}

export function CheckIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M20 6 9 17l-5-5" /></svg>;
}

export function ClockIcon(props: IconProps) {
  return <svg {...defaults} {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
}

export function DatabaseIcon(props: IconProps) {
  return <svg {...defaults} {...props}><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6" /></svg>;
}

export function SearchIcon(props: IconProps) {
  return <svg {...defaults} {...props}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
}

export function ArrowIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

export function ArrowUpIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="m7 17 10-10M8 7h9v9" /></svg>;
}

export function ChevronLeftIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="m15 18-6-6 6-6" /></svg>;
}

export function CopyIcon(props: IconProps) {
  return <svg {...defaults} {...props}><rect x="8" y="8" width="11" height="11" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>;
}

export function GitBranchIcon(props: IconProps) {
  return <svg {...defaults} {...props}><circle cx="6" cy="5" r="2" /><circle cx="18" cy="7" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10M8 9c5 0 4-2 8-2" /></svg>;
}

export function LayersIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="m12 2 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 17l9 5 9-5" /></svg>;
}

export function RadioIcon(props: IconProps) {
  return <svg {...defaults} {...props}><circle cx="12" cy="12" r="2" /><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14" /></svg>;
}

export function RefreshIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 8.2A7 7 0 0 1 18.5 7L20 12M4 12l1.5 5a7 7 0 0 0 12.4-1.2" /></svg>;
}

export function ServerIcon(props: IconProps) {
  return <svg {...defaults} {...props}><rect x="3" y="4" width="18" height="6" rx="2" /><rect x="3" y="14" width="18" height="6" rx="2" /><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6" /></svg>;
}

export function ShieldIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="M12 3 4.5 6v5.5c0 4.5 3 7.8 7.5 9.5 4.5-1.7 7.5-5 7.5-9.5V6L12 3Z" /><path d="m9 12 2 2 4-4" /></svg>;
}

export function SparklesIcon(props: IconProps) {
  return <svg {...defaults} {...props}><path d="m12 3-1 3.1A4 4 0 0 1 8.1 9L5 10l3.1 1A4 4 0 0 1 11 13.9l1 3.1 1-3.1a4 4 0 0 1 2.9-2.9l3.1-1-3.1-1A4 4 0 0 1 13 6.1L12 3Z" /><path d="m5 17-.5 1.5L3 19l1.5.5L5 21l.5-1.5L7 19l-1.5-.5L5 17Z" /></svg>;
}
