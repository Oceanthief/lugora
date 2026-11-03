/**
 * Configuração do mapa base.
 *
 * O endereço do estilo fica só aqui: trocar de provedor de mapas é mudar
 * esta linha (ADR 0001).
 */
export const MAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

/** Copiado para public/ por scripts/copy-maplibre-worker.mjs. */
export const MAP_WORKER_URL = "/maplibre-gl-worker.mjs";

export type MapCamera = {
  /** O MapLibre usa [longitude, latitude], nessa ordem (como o GeoJSON). */
  center: [lng: number, lat: number];
  zoom: number;
};

export const JUIZ_DE_FORA: MapCamera = {
  center: [-43.35, -21.76],
  zoom: 13,
};

/**
 * Menor retângulo que contém todos os pontos, como [[oeste, sul], [leste, norte]]
 * (o formato que o MapLibre usa para enquadrar). Sem pontos, devolve null.
 */
export function boundsOf(
  locations: readonly (readonly [lng: number, lat: number])[],
): [[number, number], [number, number]] | null {
  if (locations.length === 0) return null;
  const lngs = locations.map(([lng]) => lng);
  const lats = locations.map(([, lat]) => lat);
  return [
    [Math.min(...lngs), Math.min(...lats)],
    [Math.max(...lngs), Math.max(...lats)],
  ];
}
