"use client";

// Client Component: o MapLibre desenha o mapa no navegador (WebGL), então
// ele só pode rodar depois que a página chega ao aparelho.

import "maplibre-gl/dist/maplibre-gl.css";

import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef, useState, type CSSProperties } from "react";

import { strings } from "@/content/pt-BR";
import { isPlaceCategory } from "@/lib/categories";
import { categoryIconPaths, otherCategoryIconPaths } from "@/lib/category-icons";
import { categoryLabel } from "@/lib/category-label";
import { mapColors } from "@/lib/design-tokens";
import { formatRating, formatVisitDate } from "@/lib/format";
import { boundsOf, JUIZ_DE_FORA, MAP_STYLE_URL, MAP_WORKER_URL, type MapCamera } from "@/lib/map-config";
import type { CitySummary, MapTab } from "@/lib/map-levels";
import type { MyVisitedPlace } from "@/lib/visited-places";

const text = strings.map;

const PLACES_SOURCE = "visited-places";
const CITIES_SOURCE = "visited-cities";
/** De longe, o mapa mostra as cidades pela faixa; a partir deste zoom, os lugares. */
const PLACES_ZOOM = 9;
/** Tamanho do ícone da categoria na tela, em px. */
const ICON_SIZE = 14;
/** Desenha o ícone com o dobro de pixels, para ficar nítido no celular. */
const ICON_PIXEL_RATIO = 2;
const OTHER_ICON = "category-other";

type MapLibre = typeof import("maplibre-gl");

export function VisitMap({
  places,
  cities,
  tab,
}: {
  places: readonly MyVisitedPlace[];
  cities: readonly CitySummary[];
  tab: MapTab;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ao trocar de tela, o Next esconde esta e o efeito abaixo desmonta o mapa.
  // A câmera fica guardada aqui para o mapa voltar onde estava.
  const cameraRef = useRef<MapCamera | null>(null);
  // A aba que o mapa já enquadrou: trocar de aba enquadra de novo; voltar de outra tela, não.
  const framedTabRef = useRef<MapTab | null>(null);
  const [loaded, setLoaded] = useState<{ map: MapLibreMap; lib: MapLibre } | null>(null);

  // 1. Cria o mapa, uma vez por montagem.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap | undefined;
    let cancelled = false;

    // A biblioteca (cerca de 1 MB) só é baixada quando o mapa aparece.
    import("maplibre-gl").then((lib) => {
      if (cancelled) return;

      lib.setWorkerUrl(MAP_WORKER_URL);
      const camera = cameraRef.current ?? JUIZ_DE_FORA;
      const instance = new lib.Map({
        container,
        style: MAP_STYLE_URL,
        center: camera.center,
        zoom: camera.zoom,
        // Atribuição sempre aberta: em telas estreitas, o padrão a recolhe
        // num botão "i", e ela precisa continuar visível (seção 10).
        attributionControl: { compact: false },
        locale: text.controls,
      });
      map = instance;
      instance.addControl(new lib.NavigationControl({ showCompass: false }), "top-left");
      instance.on("load", () => {
        addLayers(instance);
        setLoaded({ map: instance, lib });
      });
    });

    return () => {
      cancelled = true;
      setLoaded(null);
      if (map) {
        const { lng, lat } = map.getCenter();
        cameraRef.current = { center: [lng, lat], zoom: map.getZoom() };
        map.remove();
      }
    };
  }, []);

  // 2. Põe os lugares e as cidades da aba no mapa.
  useEffect(() => {
    if (!loaded) return;
    const { map, lib } = loaded;

    (map.getSource(PLACES_SOURCE) as GeoJSONSource | undefined)?.setData(placesGeoJson(places));
    (map.getSource(CITIES_SOURCE) as GeoJSONSource | undefined)?.setData(citiesGeoJson(cities));

    // Por cima de cada ponto e de cada cidade fica um botão invisível de 44 px:
    // é ele que recebe o toque e o foco do teclado e abre o balão. A ordem
    // importa: addTo() desliga o teclado de um balão ligado antes.
    const markers: { marker: Marker; kind: "place" | "city" }[] = [
      ...places.map((place) => ({
        kind: "place" as const,
        marker: new lib.Marker({ element: markerElement(placeLabel(place)) })
          .setLngLat(place.location)
          .addTo(map)
          .setPopup(new lib.Popup({ offset: 16 }).setDOMContent(placePopup(place))),
      })),
      ...cities.map((city) => ({
        kind: "city" as const,
        marker: new lib.Marker({ element: markerElement(cityLabel(city)) })
          .setLngLat(city.location)
          .addTo(map)
          .setPopup(new lib.Popup({ offset: 20 }).setDOMContent(cityPopup(city))),
      })),
    ];

    // Só os botões do que está desenhado ficam na tela e na ordem do teclado.
    const showByZoom = () => {
      const showPlaces = map.getZoom() >= PLACES_ZOOM;
      for (const { marker, kind } of markers) {
        marker.getElement().style.display = (kind === "place") === showPlaces ? "" : "none";
      }
    };
    showByZoom();
    map.on("zoom", showByZoom);

    if (framedTabRef.current !== tab) {
      framedTabRef.current = tab;
      const bounds = boundsOf(places.map((place) => place.location));
      if (bounds) {
        map.fitBounds(bounds, {
          // Em cima, a margem cobre as abas; embaixo, os cartões (viagem e legenda) e a barra que flutua.
          padding: { top: 96, right: 48, bottom: Math.round(Math.min(340, map.getContainer().clientHeight * 0.45)), left: 48 },
          maxZoom: 15,
          duration: 0,
        });
      }
    }

    return () => {
      map.off("zoom", showByZoom);
      for (const { marker } of markers) marker.remove();
    };
  }, [loaded, places, cities, tab]);

  // O texto do próprio mapa (atribuição) usa a cor fixa do mapa, que é sempre
  // claro: no tema escuro, o texto claro do app sumiria sobre ele.
  // Os botões de zoom descem para baixo das abas; a atribuição sobe para cima
  // da barra flutuante. O balão segue o tema do app (cartão, texto e contorno
  // dos tokens), sem a ponta, e o botão de fechar ganha 44 px de toque. O "!" é
  // necessário no balão: o CSS do MapLibre fica fora das camadas do Tailwind.
  return (
    <div
      ref={containerRef}
      style={{ "--map-ink": mapColors.labelText } as CSSProperties}
      className="h-full w-full text-[var(--map-ink)] [&_.maplibregl-ctrl-bottom-right]:mb-[calc(5.5rem+env(safe-area-inset-bottom))] [&_.maplibregl-ctrl-top-left]:mt-[4.5rem] [&_.maplibregl-popup-close-button]:size-11 [&_.maplibregl-popup-close-button]:text-2xl [&_.maplibregl-popup-close-button]:text-ink [&_.maplibregl-popup-content]:rounded-card! [&_.maplibregl-popup-content]:border! [&_.maplibregl-popup-content]:border-line! [&_.maplibregl-popup-content]:bg-surface! [&_.maplibregl-popup-content]:p-4! [&_.maplibregl-popup-content]:text-ink! [&_.maplibregl-popup-content]:shadow-none! [&_.maplibregl-popup-tip]:hidden"
    />
  );
}

function placesGeoJson(places: readonly MyVisitedPlace[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: places.map((place) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: place.location },
      properties: {
        icon: isPlaceCategory(place.category) ? `category-${place.category}` : OTHER_ICON,
        rating: formatRating(place.rating),
      },
    })),
  };
}

function citiesGeoJson(cities: readonly CitySummary[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cities.map((city) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: city.location },
      properties: { level: city.level, places: String(city.places) },
    })),
  };
}

/** Cor de cada faixa, para as expressões do MapLibre: ["match", nível, 1, cor1, 2, cor2, 3, cor3, cor4]. */
function byLevel(colors: readonly string[]): ExpressionSpecification {
  return ["match", ["get", "level"], 1, colors[0], 2, colors[1], 3, colors[2], colors[3]];
}

/**
 * As camadas, desenhadas dentro do mapa, abaixo dos nomes de ruas e bairros:
 * de longe, um círculo por cidade, na cor da faixa (seção 7.4); de perto, os
 * lugares, com o ícone da categoria e a nota.
 */
function addLayers(map: MapLibreMap) {
  for (const [category, paths] of Object.entries(categoryIconPaths)) {
    map.addImage(`category-${category}`, drawIcon(paths), { pixelRatio: ICON_PIXEL_RATIO });
  }
  map.addImage(OTHER_ICON, drawIcon(otherCategoryIconPaths), { pixelRatio: ICON_PIXEL_RATIO });

  const empty: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
  map.addSource(PLACES_SOURCE, { type: "geojson", data: empty });
  map.addSource(CITIES_SOURCE, { type: "geojson", data: empty });

  // Primeira camada de texto do estilo: dela para cima ficam os nomes de
  // ruas, bairros e cidades, que assim aparecem por cima dos pontos.
  const firstLabelLayer = map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;

  map.addLayer(
    {
      id: "city-dots",
      type: "circle",
      source: CITIES_SOURCE,
      maxzoom: PLACES_ZOOM,
      paint: {
        "circle-radius": 16,
        "circle-color": byLevel(mapColors.levels),
        "circle-stroke-width": 1.5,
        "circle-stroke-color": mapColors.levelStroke,
      },
    },
    firstLabelLayer,
  );
  map.addLayer(
    {
      id: "city-counts",
      type: "symbol",
      source: CITIES_SOURCE,
      maxzoom: PLACES_ZOOM,
      layout: {
        "text-field": ["get", "places"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 13,
        "text-allow-overlap": true,
        "text-ignore-placement": true,
      },
      paint: { "text-color": byLevel(mapColors.levelText) },
    },
    firstLabelLayer,
  );
  map.addLayer(
    {
      id: "place-dots",
      type: "circle",
      source: PLACES_SOURCE,
      minzoom: PLACES_ZOOM,
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
      source: PLACES_SOURCE,
      minzoom: PLACES_ZOOM,
      layout: {
        "icon-image": ["get", "icon"],
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
      source: PLACES_SOURCE,
      minzoom: PLACES_ZOOM,
      layout: {
        "text-field": ["get", "rating"],
        "text-font": ["Noto Sans Bold"],
        "text-size": 12,
        "text-anchor": "top",
        "text-offset": [0, 1.1],
        // A nota é da própria pessoa: aparece mesmo perto de um nome do mapa. O contorno branco garante a leitura.
        "text-allow-overlap": true,
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

function cityName(city: Pick<CitySummary, "name" | "state">): string {
  return city.state ? `${city.name}, ${city.state}` : city.name;
}

function placeLabel(place: MyVisitedPlace): string {
  return text.markerLabel(place.name, categoryLabel(place.category), formatRating(place.rating));
}

function cityLabel(city: CitySummary): string {
  return text.cityLabel(cityName(city), text.places(city.places), city.level);
}

/** Botão invisível de 44 px sobre o ponto; o contorno aparece no foco. */
function markerElement(label: string): HTMLElement {
  const element = document.createElement("div");
  // O mapa base é sempre claro, então o contorno usa a cor fixa do mapa.
  element.style.setProperty("--map-focus", mapColors.focus);
  element.className =
    "size-11 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--map-focus)]";
  // O MapLibre só põe este papel no marcador padrão; aqui é por nossa conta.
  element.setAttribute("role", "button");
  element.setAttribute("aria-label", label);
  return element;
}

/**
 * Conteúdo dos balões. Usa textContent, nunca HTML: um nome vindo das
 * pessoas nunca vira código na página. Cada informação na sua linha, sem
 * separadores (identidade.md).
 */
function lines(...items: { text: string; className: string }[]): HTMLElement {
  const root = document.createElement("div");
  // pr-10 deixa espaço para o botão de fechar, que ocupa 44 px no canto.
  root.className = "pr-10 font-sans text-sm";
  for (const item of items) {
    const line = document.createElement("p");
    line.className = item.className;
    line.textContent = item.text;
    root.append(line);
  }
  return root;
}

function placePopup(place: MyVisitedPlace): HTMLElement {
  return lines(
    { text: place.name, className: "text-base font-semibold leading-tight" },
    { text: categoryLabel(place.category), className: "text-ink-muted" },
    { text: strings.rating(formatRating(place.rating)), className: "mt-2 font-semibold text-accent" },
    { text: text.visitedOn(formatVisitDate(place.lastVisitedOn)), className: "text-ink-muted" },
    ...(place.visitCount > 1 ? [{ text: text.visits(place.visitCount), className: "text-ink-muted" }] : []),
  );
}

function cityPopup(city: CitySummary): HTMLElement {
  return lines(
    { text: cityName(city), className: "text-base font-semibold leading-tight" },
    { text: text.places(city.places), className: "mt-2 font-semibold text-accent" },
  );
}
