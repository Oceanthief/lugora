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
    pizzeria: "Pizzaria",
    burger: "Hamburgueria",
    brewery: "Cervejaria",
    dessert_shop: "Doceria",
    museum: "Museu",
    park: "Parque",
    cultural_center: "Centro cultural",
    cinema: "Cinema",
  },
  occasions: {
    romantic: "Romântico",
    with_friends: "Com amigos",
    with_family: "Em família",
    solo: "Sozinho(a)",
    work_study: "Trabalhar/estudar",
  },
  rating: (rating: string) => `Nota ${rating}`,
  /** Lido antes da nota em pílula, só por leitores de tela. */
  ratingLabel: "Nota",
  /** "Cervejaria em Juiz de Fora": categoria e cidade sem separadores. */
  placeIn: (category: string, city: string) => `${category} em ${city}`,
  map: {
    title: "Mapa",
    placesList: "Lugares no mapa",
    emptyTitle: "Seu mapa ainda está vazio",
    emptyText: "Cada lugar que você registrar aparece aqui.",
    emptyAction: "Registrar a primeira visita",
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
    empty: "Ainda não há visitas de quem você segue.",
  },
  wantToGo: {
    title: "Quero ir",
    subtitle: "Sua lista é privada: só você vê.",
    empty: "Sua lista está vazia. Guarde aqui os lugares que você quer conhecer.",
    seenOn: (site: string) => `Onde eu vi: ${site}`,
    addedOn: (date: string) => `Adicionado em ${date}`,
  },
  login: {
    title: "Entrar",
    loading: "Carregando…",
    subtitle: (digits: number) =>
      `Digite seu e-mail e enviamos um código de ${digits} dígitos. Não precisa de senha.`,
    email: "E-mail",
    emailPlaceholder: "voce@exemplo.com",
    sendCode: "Enviar código",
    sending: "Enviando…",
    codeSentTo: (email: string, minutes: number) =>
      `Enviamos um código para ${email}. Ele vale por ${minutes} minutos.`,
    code: (digits: number) => `Código de ${digits} dígitos`,
    verify: "Entrar",
    verifying: "Entrando…",
    resend: "Enviar outro código",
    changeEmail: "Usar outro e-mail",
    resent: "Enviamos um novo código.",
    spamHint: "Não chegou? Confira a caixa de spam.",
    errors: {
      invalidEmail: "Digite um e-mail válido, como voce@exemplo.com.",
      invalidCode: "O código tem 6 dígitos, só com números.",
      wrongCode: "Código errado ou vencido. Confira o e-mail ou peça outro.",
      rateLimited: "Muitos pedidos seguidos. Espere um minuto e tente de novo.",
      sendFailed: "Não conseguimos enviar o código. Tente de novo em instantes.",
      verifyFailed: "Não conseguimos conferir o código. Tente de novo em instantes.",
    },
  },
  signup: {
    title: "Crie o seu perfil",
    loading: "Carregando…",
    subtitle: "Falta pouco. Estes dados são usados só para o seu perfil no Lugora.",
    name: "Nome",
    username: "Seu @",
    usernameHint: (min: number, max: number) =>
      `De ${min} a ${max} caracteres: letras minúsculas, números e _.`,
    usernamePlaceholder: "@seunome",
    city: "Cidade onde você mora",
    cityHint: "Só você vê. Ela não aparece para outras pessoas.",
    cityPlaceholder: "Digite o nome da cidade",
    cityOption: (name: string, state: string) => `${name}, ${state}`,
    citySearching: "Buscando…",
    citySearchFailed: "Não conseguimos buscar agora. Tente de novo em instantes.",
    cityNotFound: "Nenhuma cidade encontrada. Por enquanto, só temos cidades do Brasil.",
    cityFound: (found: number) => (found === 1 ? "1 cidade encontrada." : `${found} cidades encontradas.`),
    cityChange: "Trocar",
    ageConfirmed: "Tenho 18 anos ou mais.",
    policyBefore: "Li e aceito a ",
    policyLink: "Política de Privacidade",
    policyAfter: ".",
    optionalTitle: "Opcional",
    optionalHint: "Você escolhe. Dá para usar o Lugora sem nenhum destes.",
    purposes: {
      precise_location: {
        label: "Localização precisa do celular",
        description: "Para sugerir lugares perto de você e confirmar que você esteve lá.",
      },
      emails: {
        label: "E-mails",
        description: "Novidades do Lugora. O código de acesso não depende disso.",
      },
      analytics: {
        label: "Análises",
        description: "Uso dos seus dados para entender e melhorar o app.",
      },
    },
    submit: "Concluir cadastro",
    submitting: "Concluindo…",
    failed: "Não conseguimos concluir o cadastro. Tente de novo em instantes.",
    errors: {
      nameRequired: "Digite o seu nome.",
      nameTooLong: "O nome pode ter até 80 caracteres.",
      usernameInvalid: "Use de 3 a 30 caracteres: letras minúsculas, números e _.",
      usernameTaken: "Este @ já tem dono. Tente outro.",
      cityRequired: "Busque e escolha a cidade onde você mora.",
      ageRequired: "O Lugora é só para maiores de 18 anos.",
      policyRequired: "Para continuar, aceite a Política de Privacidade.",
    },
  },
  privacy: {
    title: "Política de Privacidade",
    draftNotice: (version: string | null) =>
      `Rascunho${version ? `, versão ${version}` : ""}. O Lugora ainda está em construção, e este texto será revisado antes de o app abrir ao público.`,
    sections: [
      {
        title: "O que guardamos",
        text: "",
        items: [
          "Seu e-mail, para você entrar. Outras pessoas não veem.",
          "Seu nome e seu @, que outras pessoas logadas podem ver.",
          "A cidade onde você mora, que só você vê.",
          "A data em que você confirmou ter 18 anos ou mais.",
          "Sua resposta a cada consentimento, com a versão desta política.",
          "As visitas que você registrar, com a visibilidade que você escolher.",
        ],
      },
      {
        title: "Para que usamos",
        text: "Para o app funcionar: entrar na sua conta, mostrar o seu perfil e guardar o seu mapa.",
        items: [],
      },
      {
        title: "O que é opcional",
        text: "Você escolhe no cadastro e pode retirar cada um quando quiser:",
        items: [
          "Localização precisa do celular: para sugerir lugares perto de você e confirmar que você esteve lá.",
          "E-mails: novidades do Lugora. O código de acesso não depende disso.",
          "Análises: uso dos seus dados para entender e melhorar o app.",
        ],
      },
      {
        title: "O que não guardamos",
        text: "O trajeto do seu GPS e os metadados das suas fotos. Da sua visita, guardamos só a ligação com o lugar.",
        items: [],
      },
      {
        title: "Seus direitos",
        text: "Você pode ver, corrigir, exportar e excluir os seus dados, inclusive as fotos. As telas para isso, e para retirar um consentimento, chegam antes de o app abrir ao público.",
        items: [],
      },
      {
        title: "Idade",
        text: "O Lugora é só para maiores de 18 anos.",
        items: [],
      },
      {
        title: "Dúvidas",
        text: "O contato para dúvidas entra aqui antes de o app abrir ao público.",
        items: [],
      },
    ],
  },
  profile: {
    title: "Perfil",
    loading: "Carregando seu perfil…",
    signedOutTitle: "Entre para ver o seu perfil",
    signedOutText: "Seu mapa, suas viagens e seus números ficam aqui.",
    signIn: "Entrar",
    signedInAs: (email: string) => `Você entrou como ${email}`,
    privacyLink: "Política de Privacidade",
    signOut: "Sair",
    homeCity: (city: string) => `Mora em ${city} (só você vê)`,
    statsLabel: "Seus números",
    countries: "Países",
    cities: "Cidades",
    places: "Lugares",
    visits: "Visitas",
    travelerTitle: "Seu jeito de viajar",
    travelShare: (percent: number) =>
      `${percent}% das suas visitas foram em viagem.`,
    travelShareUnderOne: "Menos de 1% das suas visitas foram em viagem.",
    travelShareNone: (city: string) =>
      `Todas as suas visitas foram em ${city}. Registre um lugar fora da cidade para ver seu jeito de viajar.`,
    travelShareLocked: (missing: number) =>
      `Seu jeito de viajar aparece a partir de 10 visitas. Faltam ${missing}.`,
  },
} as const;
