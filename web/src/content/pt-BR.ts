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
  occasions: {
    romantic: "Romântico",
    with_friends: "Com amigos",
    with_family: "Em família",
    solo: "Sozinho(a)",
    work_study: "Trabalhar/estudar",
  },
  rating: (rating: string) => `Nota ${rating}`,
  map: {
    title: "Mapa",
    placesList: "Lugares no mapa",
    markerLabel: (name: string, category: string, rating: string) =>
      `${name}, ${category}, nota ${rating}`,
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
  register: {
    title: "Registrar visita",
    subtitle: "Lugar, data e nota. O resto é opcional.",
    loading: "Carregando o formulário…",
    place: "Lugar",
    placePlaceholder: "Escolha o lugar",
    date: "Data da visita",
    rating: "Nota",
    occasions: "Ocasião",
    occasionsHint: (max: number) => `opcional, até ${max}`,
    submit: "Salvar visita",
    success:
      "Tudo certo! Nesta versão de demonstração, a visita ainda não é salva.",
    errors: {
      placeRequired: "Escolha o lugar.",
      dateRequired: "Informe a data da visita.",
      dateInFuture: "A data não pode ser no futuro.",
      ratingRequired: "Dê uma nota de 0,5 a 5.",
      ratingInvalid: "A nota vai de 0,5 a 5, em passos de 0,5.",
      tooManyOccasions: "Escolha no máximo 3 ocasiões.",
    },
  },
  feed: {
    title: "Feed",
    subtitle: "Visitas de quem você segue, da mais recente para a mais antiga.",
    visited: "visitou",
  },
  wantToGo: {
    title: "Quero ir",
    subtitle: "Sua lista é privada: só você vê.",
    seenOn: (site: string) => `Onde eu vi: ${site}`,
    addedOn: (date: string) => `Adicionado em ${date}`,
  },
  profile: {
    title: "Perfil",
    homeCity: (city: string) => `Mora em ${city}`,
    onlyYou: "só você vê",
    statsLabel: "Seus números",
    countries: "Países",
    cities: "Cidades",
    places: "Lugares",
    visits: "Visitas",
    travelerTitle: "Seu jeito de viajar",
    travelShare: (percent: number) =>
      `${percent}% das suas visitas foram em viagem.`,
    travelShareLocked: (missing: number) =>
      `Seu jeito de viajar aparece a partir de 10 visitas. Faltam ${missing}.`,
  },
} as const;
