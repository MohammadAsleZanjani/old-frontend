type ChartPolylineOptions = {
  bottom?: number;
  max?: number;
  min?: number;
  top?: number;
  width?: number;
};

export function createChartCoordinates(values: number[], options: ChartPolylineOptions = {}) {
  const finiteValues = values.filter(Number.isFinite);
  if (!finiteValues.length) return [];

  const width = options.width ?? 100;
  const top = options.top ?? 10;
  const bottom = options.bottom ?? 90;
  const min = options.min ?? Math.min(...finiteValues);
  const max = options.max ?? Math.max(...finiteValues);
  const range = max - min;
  const yFor = (value: number) => range > 0
    ? bottom - ((value - min) / range) * (bottom - top)
    : top + (bottom - top) / 2;

  return finiteValues.map((value, index) => ({
    x: finiteValues.length === 1 ? width / 2 : (index * width) / (finiteValues.length - 1),
    y: yFor(value),
  }));
}

export function createChartPolyline(values: number[], options: ChartPolylineOptions = {}) {
  const coordinates = createChartCoordinates(values, options);
  if (!coordinates.length) return "";
  if (coordinates.length === 1) {
    const width = options.width ?? 100;
    return `0,${coordinates[0].y} ${width},${coordinates[0].y}`;
  }

  return coordinates
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
}
