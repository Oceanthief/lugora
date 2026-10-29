/**
 * Textos da interface em português do Brasil.
 *
 * Ficam todos aqui, fora dos componentes, para o app poder ser traduzido
 * depois (seção 13 do documento).
 */
export const strings = {
  app: {
    name: "Lugora",
    description:
      "Registre os lugares que você visita e veja o seu mapa se preencher.",
  },
  nav: {
    label: "Navegação principal",
    map: "Mapa",
    feed: "Feed",
    register: "Registrar",
    wantToGo: "Quero ir",
    profile: "Perfil",
  },
  categories: {
    cafe: "Café",
    bar: "Bar",
    restaurant: "Restaurante",
    bakery: "Padaria",
    bookstore: "Livraria",
    ice_cream: "Sorveteria",
  },
  map: {
    title: "Mapa",
    placesList: "Lugares no mapa",
    markerLabel: (name: string, rating: string) => `${name}, nota ${rating}`,
    rating: (rating: string) => `Nota ${rating}`,
    visitedOn: (date: string) => `Visitado em ${date}`,
    // Textos dos botões do próprio MapLibre (zoom, fechar o balão etc.).
    controls: {
      "AttributionControl.ToggleAttribution": "Mostrar ou ocultar a atribuição",
      "Map.Title": "Mapa",
      "Marker.Title": "Lugar no mapa",
      "NavigationControl.ResetBearing": "Apontar para o norte",
      "NavigationControl.ZoomIn": "Aproximar",
      "NavigationControl.ZoomOut": "Afastar",
      "Popup.Close": "Fechar",
    },
  },
  pages: {
    feed: {
      title: "Feed",
      placeholder: "As visitas de quem você segue aparecem aqui.",
    },
    register: {
      title: "Registrar visita",
      placeholder: "O registro rápido de uma visita aparece aqui.",
    },
    wantToGo: {
      title: "Quero ir",
      placeholder: "Os lugares que você quer conhecer aparecem aqui.",
    },
    profile: {
      title: "Perfil",
      placeholder: "As suas estatísticas aparecem aqui.",
    },
  },
} as const;
