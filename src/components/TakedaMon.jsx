export default function TakedaMon({ size = 40, color = '#c8a84a', style = {} }) {
  // W=полуширина, H=полувысота, g=зазор
  // Компоновка 1-2-1: верхний, левый, правый, нижний
  const W = 19.1, H = 11.8, g = 3.2;
  const r = (cx, cy) =>
    `${cx},${cy-H} ${cx+W},${cy} ${cx},${cy+H} ${cx-W},${cy}`;
  const c = 50, d = H + g/2, s = W + g/2;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, ...style }}
      aria-label="Takeda mon">
      <polygon points={r(c, c-d)}   fill={color} />
      <polygon points={r(c-s, c)}   fill={color} />
      <polygon points={r(c+s, c)}   fill={color} />
      <polygon points={r(c, c+d)}   fill={color} />
    </svg>
  );
}
