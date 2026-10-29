"use client";

// Client Component: o MapLibre desenha o mapa no navegador (WebGL), então
// ele só pode rodar depois que a página chega ao aparelho.

import "maplibre-gl/dist/maplibre-gl.css";

import type { Map as MapLibreMap } from "maplibre-gl";
import { useEffect, useRef } from "react";

import { strings } from "@/content/pt-BR";
import { formatRating, formatVisitDate } from "@/lib/format";
import {
  JUIZ_DE_FORA,
  MAP_STYLE_URL,
  MAP_WORKER_URL,
  type MapCamera,
} from "@/lib/map-config";
import type { VisitedPlace } from "@/lib/mock-data";

export function VisitMap({ places }: { places: readonly VisitedPlace[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Ao trocar de aba, o Next esconde esta tela e o efeito abaixo desmonta o
  // mapa. A câmera fica guardada aqui para o mapa voltar onde estava.
  const cameraRef = useRef<MapCamera>(JUIZ_DE_FORA);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let map: MapLibreMap | undefined;
    let cancelled = false;

    // A biblioteca (cerca de 1 MB) só é baixada quando o mapa aparece.
    import("maplibre-gl").then((maplibregl) => {
      if (cancelled) return;

      maplibregl.setWorkerUrl(MAP_WORKER_URL);
      map = new maplibregl.Map({
        container,
        style: MAP_STYLE_URL,
        center: cameraRef.current.center,
        zoom: cameraRef.current.zoom,
        // Atribuição sempre aberta: em telas estreitas, o padrão a recolhe
        // num botão "i", e ela precisa continuar visível (seção 10).
        attributionControl: { compact: false },
        locale: strings.map.controls,
      });
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-left",
      );

      for (const place of places) {
        // Com um balão ligado, o MapLibre torna o ponto focável e o abre
        // com Enter ou espaço, além do toque. A ordem importa: addTo()
        // desliga o teclado de um balão ligado antes, então ele vem depois.
        new maplibregl.Marker({ element: markerElement(place) })
          .setLngLat(place.location)
          .addTo(map)
          .setPopup(
            new maplibregl.Popup({ offset: 14 }).setDOMContent(
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

  // A margem embaixo afasta a atribuição do botão Registrar, que sobe 20 px
  // acima da barra inferior.
  return (
    <div
      ref={containerRef}
      className="h-full w-full [&_.maplibregl-ctrl-bottom-right]:mb-5"
    />
  );
}

/** Ponto do mapa: área de toque de 44 px com uma bolinha no meio. */
function markerElement(place: VisitedPlace): HTMLElement {
  const element = document.createElement("div");
  element.className =
    "flex size-11 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-zinc-950";
  // O MapLibre só põe este papel no marcador padrão; aqui é por nossa conta.
  element.setAttribute("role", "button");
  element.setAttribute(
    "aria-label",
    strings.map.markerLabel(place.name, formatRating(place.rating)),
  );

  const dot = document.createElement("span");
  dot.className =
    "size-5 rounded-full border-2 border-white bg-zinc-900 shadow-md";
  element.append(dot);

  return element;
}

/**
 * Conteúdo do balão. Usa textContent, nunca HTML: quando os nomes vierem das
 * pessoas, um nome nunca vira código na página.
 */
function popupContent(place: VisitedPlace): HTMLElement {
  const root = document.createElement("div");
  root.className = "pr-4 text-sm text-zinc-900";

  const name = document.createElement("p");
  name.className = "font-semibold";
  name.textContent = place.name;

  const details = document.createElement("p");
  details.textContent = `${strings.categories[place.category]} · ${strings.map.rating(formatRating(place.rating))}`;

  const date = document.createElement("p");
  date.className = "text-zinc-600";
  date.textContent = strings.map.visitedOn(formatVisitDate(place.visitedOn));

  root.append(name, details, date);
  return root;
}
