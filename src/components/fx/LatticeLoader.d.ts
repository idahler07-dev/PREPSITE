interface Props {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: "working" | "done" | "error";
  pattern?: string;
  grid?: number;
  shape?: "round" | "square";
  color?: string;
  doneColor?: string;
  errorColor?: string;
  cellSize?: number;
  gap?: number;
  fontSize?: number;
  step?: number;
  idleOpacity?: number;
  glow?: boolean;
  glowColor?: string;
  showTimer?: boolean;
  elapsed?: number;
  className?: string;
  style?: React.CSSProperties;
}
export default function LatticeLoader(props: Props): React.JSX.Element;
