---
paths:
  - "pipelines/**"
---

# Regras dos pipelines (pipelines/)

- **Python 3.10+ com DuckDB 2.0+.** Lambdas no SQL do DuckDB usam a sintaxe nova: `list_transform(lista, lambda x: x.campo)`. A forma `x -> x.campo` foi descontinuada e quebra a execução. Funções sensíveis à ordem dos eixos, como `ST_Area_Spheroid`, exigem `SET geometry_always_xy = true`.
- **O esquema do Overture muda entre versões.** Antes de montar consultas, confira as colunas com `DESCRIBE`. Em 2026, `categories` foi substituído por `basic_category` e `taxonomy`.
- **Minimização (LGPD):** nunca copie e-mails nem telefones da base. Guarde só se existem (`has_phone`). Eles também aparecem no meio de textos livres, como endereço e CEP: confira esses campos a cada fonte nova.
- **Repositório público:** nomes de pessoas da base não entram no git, nem em teste, documento ou mensagem de commit. Use nomes fictícios. Nomes de empresas podem servir de caso real.
- **Execuções idempotentes:** rodar duas vezes a mesma versão dá o mesmo resultado, sem duplicar nem apagar nada.
- **Snapshots e saídas** ficam em `pipelines/overture/dados/` e `pipelines/overture/relatorio/`, ignorados pelo git. Nunca commite Parquet nem CSV da base.
- **Escrita no banco** usa a string de conexão do Postgres (ou a chave `service_role`), lida de variável de ambiente: arquivo `.env` local, fora do git. Só scripts deste diretório, rodando na máquina local, usam essas credenciais.
- **Regras de importação** (seção 7.2 do documento): importar tudo, sem corte de confiança (D1); aplicar `category_map` e limpeza (D3); deduplicar pela D4; registrar cada execução em `overture_imports`.
- **Atribuição:** relatórios e páginas que mostram os dados creditam "Overture Maps Foundation" e o OpenStreetMap (seção 10).
- **Testes:** funções de limpeza e deduplicação têm testes com `pytest`, em `pipelines/overture/tests/`.
