# 15. Do documento ao código

- **Markdown no repositório:** salve este documento como `docs/visao-produto.md` e cite-o no `CLAUDE.md`, o arquivo de instruções que o Claude Code lê ao trabalhar no projeto.
- **Uma fatia por vez:** peça ao Claude Code uma funcionalidade completa de cada vez, nunca “o app inteiro”.
- **Decisões registradas (ADRs):** um arquivo curto por decisão técnica, com contexto, decisão e consequências. Mostra raciocínio no portfólio.
- **Testes nas regras de negócio e de privacidade:** sequência, atraso de publicação, deduplicação, média bayesiana e os testes de aceitação da seção 9.5, rodando a cada mudança.
- **Ideias novas não entram direto neste documento:** vão para `docs/ideias-para-depois.md`, com data e hipótese, e só são promovidas com evidência. Correções de risco são exceção.
- **Dados da Fase 0** como primeira carga do banco.

### Ordem sugerida das fatias

1. Estrutura do projeto, banco (seção 8) e autenticação.
2. Ingestão do recorte da Overture (Juiz de Fora) com categoria_mapa, limpeza e deduplicação (D1 a D4), e busca de lugares.
3. Registro rápido de visita e exibição no mapa.
4. Criação de lugar com verificação (D6) e sinalizações “este lugar fechou” e “categoria errada” (D2 e D3).
5. Marcação de cidades já visitadas e abas do mapa.
6. Fotos com remoção de EXIF e “completar depois”.
7. Perfil, estatísticas e privacidade (atraso, visibilidade, regras de agregados da seção 9.3, exportar e excluir).
8. Seguir e feed.
9. Atualização mensal incremental da base (seção 10), antes da segunda versão da Overture durante o beta.


---
Parte do documento de visão do Lugora (v0.5.1). Índice: [README](README.md).
