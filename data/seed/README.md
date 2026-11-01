# Dados de seed

| Arquivo | O que é |
| --- | --- |
| `lugares_jf_seed.csv` | 100 lugares reais de Juiz de Fora (Overture Maps), com nomes corrigidos à mão. Exportado em UTF-8, sem nenhuma mudança de valor, da aba "Lugares" da planilha `lugares_jf_nomes_corrigidos.xlsx`. |
| `mock-data_ficticio_backup.ts` | Cópia de `web/src/lib/mock-data.ts` antes da troca: lugares, visitas, feed e "Quero ir" fictícios. Só para consulta; não é usado pelo app. |

## Como os lugares chegam ao app

Em `web/`, `npm run seed:lugares` lê o CSV e grava `web/src/data/places.json`, que é o que o app usa enquanto não existe banco.

- A chave de cada lugar é o `id_overture` (ou nome + lat + lng, se faltar). Rodar de novo atualiza, não duplica.
- As coordenadas vêm das colunas `lat` e `lng`. Não há geocodificação por endereço ou CEP.
- `categoria_app` vira a categoria do app pela tabela `SEED_CATEGORIES` do script (veja o glossário).
- `confianca`, `fontes`, `categoria_detalhe` e `seed_id` ficam só no CSV: são metadados de curadoria.

Os dados do Overture exigem atribuição no app (seção 10 do documento), que entra na página Sobre (Fatia 10).
