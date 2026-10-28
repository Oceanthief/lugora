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
  pages: {
    map: {
      title: "Mapa",
      placeholder: "O mapa de Juiz de Fora aparece aqui.",
    },
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
