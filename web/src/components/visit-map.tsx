"use client";

// Client Component: o MapLibre desenha o mapa no navegador (WebGL), então
// ele só pode rodar depois que a página chega ao aparelho.

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef, type CSSProperties } from "react";

import { strings } from "@/content/pt-BR";
import { categoryIconPaths } from "@/lib/category-icons";
import { formatRating, formatVisitDate } from "@/lib/format";
import { mapColors } from "@/lib/design-tokens";
import {
  boundsOf,
  JUIZ_DE_FORA,
  MAP_STYLE_URL,
  MAP_WORKER_URL,
  type MapCamera,
} from "@/lib/map-config";
import type { VisitedPlace } from "@/lib/mock-data";

const SOURCE_ID = "visited-places";
/** Tamanho do ícone da categoria na tela, em px. */
const ICON_SIZE = 14;
/** Desenha o ícone com o dobro de pixels, para ficar nítido no celular. */
const ICON_PIXEL_RATIO = 2;

export function VisitMap({ places }: { places: readonly VisitedPlace[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ao trocar de aba, o Next esconde esta tela e o efeito abaixo desmonta o
  // mapa. A câmera fica guardada aqui para o mapa voltar onde estava; vazia,
  // o mapa ainda não foi aberto.
  const cameraRef = useRef<MapCamera | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap | undefined;
    let cancelled = false;

    // A biblioteca (cerca de 1 MB) só é baixada quando o mapa aparece.
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled) return;

      maplibregl.setWorkerUrl(MAP_WORKER_URL);
      // Na primeira vez, enquadra todos os lugares visitados (com margem para
      // os botões e as notas); depois, volta para onde a pessoa deixou.
      const saved = cameraRef.current;
      const bounds = saved ? null : boundsOf(places.map((place) => place.location));
      const camera = saved ?? JUIZ_DE_FORA;
      const instance = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: camera.center,
        zoom: camera.zoom,
        ...(bounds && {
          bounds,
          fitBoundsOptions: {
            // Embaixo, a margem também cobre a barra que flutua sobre o mapa.
            padding: { top: 64, right: 40, bottom: 128, left: 40 },
            maxZoom: 15,
          },
        }),
        // Atribuição sempre aberta: em telas estreitas, o padrão a recolhe
        // num botão "i", e ela precisa continuar visível (seção 10).
        attributionControl: { compact: false },
        locale: strings.map.controls,
      });
      map = instance;
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-left",
      );

      // Os pontos são desenhados dentro do mapa, abaixo dos nomes de ruas e
      // bairros, para não escondê-los.
      instance.on("load", () => addPlaceLayers(instance, places));

      // Por cima de cada ponto fica um botão invisível de 44 px: é ele que
      // recebe o toque e o foco do teclado e abre o balão. O MapLibre o
      // torna focável e o abre com Enter ou espaço. A ordem importa: addTo()
      // desliga o teclado de um balão ligado antes, então ele vem depois.
      for (const place of places) {
        new maplibregl.Marker({ element: markerElement(place) })
          .setLngLat(place.location)
          .addTo(instance)
          .setPopup(
            new maplibregl.Popup({ offset: 16 }).setDOMContent(
              popupContent(place),
            ),
          );
      }
    });

    return () => {
      cancelled = true;
      if (map) {
        const { lng, lat } = map.getCenter();
        cameraRef.current = { center: [lng, lat], zoom: map.getZoom() };
        map.remove();
      }
    };
  }, [places]);

  // O texto do próprio mapa (atribuição) usa a cor fixa do mapa, que é sempre
  // claro: no tema escuro, o texto claro do app sumiria sobre ele.
  // A margem embaixo tira a atribuição de trás da barra flutuante. O balão
  // segue o tema do app (cartão, texto e contorno dos tokens), sem a ponta, e
  // o botão de fechar ganha 44 px de toque. O "!" é necessário no balão: o CSS
  // do MapLibre fica fora das camadas do Tailwind e venceria as classes.
  return (
    <div
      ref={containerRef}
      style={{ "--map-ink": mapColors.labelText } as CSSProperties}
      className="h-full w-full text-[var(--map-ink)] [&_.maplibregl-ctrl-bottom-right]:mb-[calc(5.5rem+env(safe-area-inset-bottom))] [&_.maplibregl-popup-close-button]:size-11 [&_.maplibregl-popup-close-button]:text-2xl [&_.maplibregl-popup-close-button]:text-ink [&_.maplibregl-popup-content]:rounded-card! [&_.maplibregl-popup-content]:border! [&_.maplibregl-popup-content]:border-line! [&_.maplibregl-popup-content]:bg-surface! [&_.maplibregl-popup-content]:p-4! [&_.maplibregl-popup-content]:text-ink! [&_.maplibregl-popup-content]:shadow-none! [&_.maplibregl-popup-tip]:hidden"
    />
  );
}

/** Camadas dos pontos: bolinha, ícone da categoria e a nota embaixo. */
function addPlaceLayers(map: MapLibreMap, places: readonly VisitedPlace[]) {
  for (const [category, paths] of Object.entries(categoryIconPaths)) {
    map.addImage(`category-${category}`, drawIcon(paths), {
      pixelRatio: ICON_PIXEL_RATIO,
    });
  }

  map.addSource(SOURCE_ID, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: places.map((place) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: place.location },
        properties: {
          category: place.category,
          rating: formatRating(place.rating),
        },
      })),
    },
  });

  // Primeira camada de texto do estilo: dela para cima ficam os nomes de
  // ruas, bairros e cidades, que assim aparecem por cima dos pontos.
  const firstLabelLayer = map
    .getStyle()
    .layers.find((layer) => layer.type === "symbol")?.id;

  map.addLayer(
    {
      id: "place-dots",
      type: "circle",
      source: SOURCE_ID,
      paint: {
        "circle-radius": 11,
        "circle-color": mapColors.pointFill,
        "circle-stroke-width": 2,
        "circle-stroke-color": mapColors.pointStroke,
      },
    },
    firstLabelLayer,
  );
  map.addLayer(
    {
      id: "place-icons",
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "icon-image": ["concat", "category-", ["get", "category"]],
        // O ícone sempre aparece e não esconde nomes do mapa.
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
    },
    firstLabelLayer,
  );
  map.addLayer(
    {
      id: "place-ratings",
      type: "symbol",
      source: SOURCE_ID,
      layout: {
        "text-field": ["get", "rating"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 1.1],
      },
      paint: {
        "text-color": mapColors.labelText,
        "text-halo-color": mapColors.labelHalo,
        "text-halo-width": 1.5,
      },
    },
    firstLabelLayer,
  );
}

/** Pinta o ícone (traços SVG de 24 × 24) num canvas e devolve os pixels. */
function drawIcon(paths: readonly string[]): ImageData {
  const size = ICON_SIZE * ICON_PIXEL_RATIO;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return new ImageData(size, size);

  context.scale(size / 24, size / 24);
  context.strokeStyle = mapColors.pointIcon;
  context.lineWidth = 2.5;
  context.lineCap = "round";
  context.lineJoin = "round";
  for (const path of paths) context.stroke(new Path2D(path));

  return context.getImageData(0, 0, size, size);
}

/** Botão invisível de 44 px sobre o ponto; o contorno aparece no foco. */
function markerElement(place: VisitedPlace): HTMLElement {
  const element = document.createElement("div");
  // O mapa base é sempre claro, então o contorno usa a cor fixa do mapa.
  element.style.setProperty("--map-focus", mapColors.focus);
  element.className =
    "size-11 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--map-focus)]";
  // O MapLibre só põe este papel no marcador padrão; aqui é por nossa conta.
  element.setAttribute("role", "button");
  element.setAttribute(
    "aria-label",
    strings.map.markerLabel(
      place.name,
      strings.categories[place.category],
      formatRating(place.rating),
    ),
  );
  return element;
}

/**
 * Conteúdo do balão. Usa textContent, nunca HTML: quando os nomes vierem das
 * pessoas, um nome nunca vira código na página.
 */
function popupContent(place: VisitedPlace): HTMLElement {
  const root = document.createElement("div");
  // pr-10 deixa espaço para o botão de fechar, que ocupa 44 px no canto.
  root.className = "pr-10 font-sans text-sm";

  const name = document.createElement("p");
  name.className = "text-base font-semibold leading-tight";
  name.textContent = place.name;

  const category = document.createElement("p");
  category.className = "text-ink-muted";
  category.textContent = strings.categories[place.category];

  // Cada informação na sua linha, sem separadores (identidade.md).
  const rating = document.createElement("p");
  rating.className = "mt-2 font-semibold text-accent";
  rating.textContent = strings.rating(formatRating(place.rating));

  const date = document.createElement("p");
  date.className = "text-ink-muted";
  date.textContent = strings.map.visitedOn(formatVisitDate(place.visitedOn));

  root.append(name, category, rating, date);
  return root;
}
