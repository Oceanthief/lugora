"""
Lugora | Diagnóstico da base de lugares do Overture para Juiz de Fora.

Etapa 1 (download): baixa o limite oficial do município e os lugares dentro
dele, direto do Overture (S3 público), e salva uma cópia local em Parquet.
Etapa 2 (relatório): mede a base e gera um relatório HTML + CSV para Power BI.

Uso:
    python relatorio_jf.py                     # baixa (se preciso) e gera o relatório
    python relatorio_jf.py --atualizar         # força baixar de novo
    python relatorio_jf.py --release 2026-10-21.0

Requisitos: Python 3.10+ e `pip install duckdb`.
"""

from __future__ import annotations

import argparse
import html
import json
from datetime import datetime
from pathlib import Path

import duckdb

# ─── Configuração ────────────────────────────────────────────────────────────
RELEASE_PADRAO = "2026-10-21.0"   # confira a mais recente em docs.overturemaps.org
CIDADE = "Juiz de Fora"
PAIS = "BR"
ESTADO = "BR-MG"
S3 = "s3://overturemaps-us-west-2/release/{release}/theme={tema}/type={tipo}/*"

PASTA = Path(__file__).resolve().parent
DADOS = PASTA / "dados"
SAIDA = PASTA / "relatorio"
ARQ_LUGARES = DADOS / "jf_lugares.parquet"
ARQ_META = DADOS / "jf_metadados.json"
ARQ_AMOSTRA = PASTA / "amostra.csv"

LIMIAR_ENCONTRADO = 0.90      # similaridade de nome para considerar "achou"
LIMIAR_VERIFICAR = 0.80
DISTANCIA_DUPLICATA_M = 50


# ─── Etapa 1: download ──────────────────────────────────────────────────────
def conectar_remoto() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs;")
    con.execute("SET s3_region = 'us-west-2';")
    return con


def colunas(con, tabela: str) -> dict[str, str]:
    return {r[0]: r[1] for r in con.execute(f"DESCRIBE {tabela}").fetchall()}


def baixar(release: str) -> None:
    DADOS.mkdir(exist_ok=True)
    con = conectar_remoto()

    print(f"[1/3] Buscando o limite de {CIDADE} (release {release})...")
    con.execute(f"""
        CREATE TABLE candidatos AS
        SELECT id, names.primary AS nome, subtype, geometry
        FROM read_parquet('{S3.format(release=release, tema="divisions", tipo="division_area")}',
                          hive_partitioning = 1)
        WHERE country = '{PAIS}' AND region = '{ESTADO}'
          AND names.primary = '{CIDADE}'
          AND subtype IN ('county', 'locality')
    """)
    cand = con.execute(
        "SELECT subtype, ST_Area(geometry) AS area FROM candidatos ORDER BY area DESC"
    ).fetchall()
    if not cand:
        raise SystemExit("Nenhum limite encontrado. Confira CIDADE, ESTADO e a release.")
    for sub, area in cand:
        print(f"      candidato: subtype={sub}  área={area:.5f} graus²")
    # O maior polígono é o município inteiro (zona urbana + rural).
    con.execute("CREATE TABLE limite AS SELECT * FROM candidatos ORDER BY ST_Area(geometry) DESC LIMIT 1")
    xmin, ymin, xmax, ymax = con.execute("""
        SELECT ST_XMin(geometry), ST_YMin(geometry), ST_XMax(geometry), ST_YMax(geometry) FROM limite
    """).fetchone()

    print("[2/3] Baixando lugares dentro do retângulo do município (pode levar alguns minutos)...")
    con.execute(f"""
        CREATE TABLE bruto AS
        SELECT * FROM read_parquet('{S3.format(release=release, tema="places", tipo="place")}',
                                   hive_partitioning = 1)
        WHERE bbox.xmin BETWEEN {xmin} AND {xmax}
          AND bbox.ymin BETWEEN {ymin} AND {ymax}
    """)

    # O esquema do Overture muda entre releases: montamos o SELECT conforme as colunas existentes.
    cols = colunas(con, "bruto")
    # Coluna qualificada (b.) porque a tabela `limite` também tem `geometry`.
    geom = "b.geometry" if "GEOMETRY" in cols.get("geometry", "").upper() else "ST_GeomFromWKB(b.geometry)"

    if "basic_category" in cols:
        categoria = "b.basic_category"
    elif "categories" in cols:
        categoria = "b.categories.primary"
    else:
        categoria = "NULL"
    detalhe = "b.taxonomy.primary" if "taxonomy" in cols else "NULL"
    hierarquia = "array_to_string(b.taxonomy.hierarchy, ' > ')" if "taxonomy" in cols else "NULL"
    status = "b.operating_status" if "operating_status" in cols else "NULL"

    print("[3/3] Recortando pelo limite oficial e salvando cópia local...")
    # Minimização (LGPD): e-mails e telefones não são copiados; guardamos só se existem.
    con.execute(f"""
        COPY (
            SELECT
                b.id,
                b.names.primary                                   AS nome,
                {categoria}                                       AS categoria,
                {detalhe}                                         AS categoria_detalhe,
                {hierarquia}                                      AS hierarquia,
                b.confidence                                      AS confianca,
                CAST({status} AS VARCHAR)                         AS status_funcionamento,
                ST_Y({geom})                                      AS lat,
                ST_X({geom})                                      AS lng,
                b.addresses[1].freeform                           AS endereco,
                b.addresses[1].postcode                           AS cep,
                coalesce(len(b.phones), 0) > 0                    AS tem_telefone,
                coalesce(len(b.websites), 0) > 0                  AS tem_site,
                coalesce(len(b.socials), 0) > 0                   AS tem_rede_social,
                b.brand.names.primary                             AS marca,
                array_to_string(list_sort(list_distinct(
                    list_transform(b.sources, lambda s: s.dataset))), ' + ')          AS fontes,
                -- Ignora o registro do próprio Overture: ele recebe a data de cada release
                -- e faria todos os lugares parecerem atualizados agora.
                CAST(list_max(list_transform(list_filter(b.sources, lambda s: s.dataset <> 'Overture'),
                                             lambda s: s.update_time)) AS VARCHAR)
                                                                  AS ultima_atualizacao
            FROM bruto b, limite l
            WHERE ST_Within({geom}, l.geometry)
        ) TO '{ARQ_LUGARES.as_posix()}' (FORMAT PARQUET)
    """)

    meta = {
        "release": release,
        "cidade": CIDADE,
        "limite_subtype": cand[0][0],
        "baixado_em": datetime.now().isoformat(timespec="seconds"),
        "colunas_origem": sorted(cols),
    }
    ARQ_META.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    n = con.execute(f"SELECT count(*) FROM '{ARQ_LUGARES.as_posix()}'").fetchone()[0]
    print(f"      {n:,} lugares salvos em {ARQ_LUGARES}".replace(",", "."))


# ─── Etapa 2: relatório (só DuckDB básico, sem extensões) ───────────────────
NORMALIZA = "trim(regexp_replace(lower(strip_accents(coalesce({c}, ''))), '[^a-z0-9 ]', '', 'g'))"
HAVERSINE = """2 * 6371000 * asin(sqrt(
    pow(sin(radians(b.lat - a.lat) / 2), 2) +
    cos(radians(a.lat)) * cos(radians(b.lat)) * pow(sin(radians(b.lng - a.lng) / 2), 2)))"""


def pct(parte, total) -> str:
    return "—" if not total else f"{100 * parte / total:.1f}%".replace(".", ",")


def num(x) -> str:
    if x is None:
        return "—"
    if isinstance(x, float):
        return f"{x:.2f}".replace(".", ",")
    return f"{x:,}".replace(",", ".")


def tabela_html(cab: list[str], linhas: list[list], barra_col: int | None = None, barra_max=None) -> str:
    th = "".join(f"<th>{html.escape(c)}</th>" for c in cab)
    corpo = []
    for lin in linhas:
        tds = []
        for i, v in enumerate(lin):
            txt = html.escape(num(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else str(v if v is not None else "—"))
            if barra_col is not None and i == barra_col and barra_max:
                w = max(1, round(100 * (v or 0) / barra_max))
                txt = f'<div class="bar"><span style="width:{w}%"></span></div><em>{txt}</em>'
            tds.append(f"<td>{txt}</td>")
        corpo.append("<tr>" + "".join(tds) + "</tr>")
    return f"<table><thead><tr>{th}</tr></thead><tbody>{''.join(corpo)}</tbody></table>"


def gerar_relatorio() -> Path:
    SAIDA.mkdir(exist_ok=True)
    meta = json.loads(ARQ_META.read_text(encoding="utf-8")) if ARQ_META.exists() else {}
    con = duckdb.connect()
    con.execute(f"""
        CREATE TABLE l AS
        SELECT *, {NORMALIZA.format(c='nome')} AS nn,
               try_cast(left(ultima_atualizacao, 10) AS DATE) AS dt_atualizacao
        FROM read_parquet('{ARQ_LUGARES.as_posix()}')
    """)
    q = lambda sql: con.execute(sql).fetchall()  # noqa: E731

    total = q("SELECT count(*) FROM l")[0][0]
    r = q("""
        SELECT count(categoria), count(confianca), median(confianca),
               count(*) FILTER (WHERE endereco IS NOT NULL),
               count(*) FILTER (WHERE tem_telefone), count(*) FILTER (WHERE tem_site OR tem_rede_social),
               count(status_funcionamento)
        FROM l""")[0]
    com_cat, com_conf, mediana_conf, com_end, com_tel, com_web, com_status = r

    resumo = [
        ["Lugares no município", total, "100%"],
        ["Com categoria", com_cat, pct(com_cat, total)],
        ["Com endereço", com_end, pct(com_end, total)],
        ["Com telefone", com_tel, pct(com_tel, total)],
        ["Com site ou rede social", com_web, pct(com_web, total)],
        ["Com confiança informada", com_conf, pct(com_conf, total)],
        ["Com status de funcionamento", com_status, pct(com_status, total)],
    ]

    faixas = q("""
        SELECT CASE WHEN confianca IS NULL THEN 'sem valor'
                    ELSE printf('%.1f a %.1f', floor(confianca * 5) / 5, floor(confianca * 5) / 5 + 0.2) END AS faixa,
               count(*) AS n
        FROM l GROUP BY 1 ORDER BY 1""")
    faixas = [[f.replace("1.0 a 1.2", "1.0").replace(".", ","), n, pct(n, total)] for f, n in faixas]

    cortes = []
    for corte in (0.2, 0.3, 0.5, 0.7, 0.9):
        perde = q(f"SELECT count(*) FROM l WHERE confianca < {corte}")[0][0]
        cortes.append([f"confiança ≥ {corte}".replace(".", ","), total - perde, perde, pct(perde, total)])

    status = q("SELECT coalesce(status_funcionamento, 'não informado'), count(*) FROM l GROUP BY 1 ORDER BY 2 DESC")
    status = [[s, n, pct(n, total)] for s, n in status]

    cats = q("""SELECT coalesce(categoria, '(sem categoria)'), count(*) AS n, median(confianca)
                FROM l GROUP BY 1 ORDER BY n DESC LIMIT 25""")
    cats = [[c, n, pct(n, total), m] for c, n, m in cats]

    fontes = q("""SELECT coalesce(nullif(fontes, ''), '(sem fonte)'), count(*) AS n, median(confianca)
                  FROM l GROUP BY 1 ORDER BY n DESC""")
    fontes = [[f, n, pct(n, total), m] for f, n, m in fontes]

    recencia = q("""SELECT coalesce(CAST(year(dt_atualizacao) AS VARCHAR), 'sem data'), count(*)
                    FROM l GROUP BY 1 ORDER BY 1 DESC""")
    recencia = [[a, n, pct(n, total)] for a, n in recencia]

    dups = q(f"""
        WITH pares AS (
            SELECT a.nome AS nome_a, b.nome AS nome_b,
                   coalesce(a.categoria, '—') AS cat_a, coalesce(b.categoria, '—') AS cat_b,
                   round({HAVERSINE}) AS dist,
                   round(jaro_winkler_similarity(a.nn, b.nn), 2) AS sim
            FROM l a JOIN l b
              ON a.id < b.id
             AND b.lat BETWEEN a.lat - 0.0005 AND a.lat + 0.0005
             AND b.lng BETWEEN a.lng - 0.0005 AND a.lng + 0.0005
            WHERE a.nn <> '' AND jaro_winkler_similarity(a.nn, b.nn) >= 0.9
        )
        SELECT * FROM pares WHERE dist <= {DISTANCIA_DUPLICATA_M} ORDER BY sim DESC, dist
    """)
    n_dups = len(dups)

    # Amostra opcional: o seu teste manual, agora reproduzível.
    amostra_html = ('<p class="muted">Crie o arquivo <code>amostra.csv</code> (modelo incluído) com os lugares que '
                    'você conhece para medir a cobertura automaticamente.</p>')
    resumo_amostra = None
    if ARQ_AMOSTRA.exists():
        con.execute(f"""
            CREATE TABLE a AS
            SELECT *, {NORMALIZA.format(c='nome')} AS nn
            FROM read_csv('{ARQ_AMOSTRA.as_posix()}', header = true, all_varchar = true)
            WHERE nome IS NOT NULL AND trim(nome) <> ''
        """)
        acols = colunas(con, "a")
        grupo = "a.grupo" if "grupo" in acols else "''"
        real = "a.situacao_real" if "situacao_real" in acols else "''"
        linhas = q(f"""
            WITH m AS (
                SELECT a.nome AS buscado, {grupo} AS grupo, {real} AS situacao_real,
                       l.nome AS achado, l.categoria, l.confianca, l.status_funcionamento,
                       greatest(jaro_winkler_similarity(a.nn, l.nn),
                                CASE WHEN length(a.nn) >= 4 AND contains(l.nn, a.nn) THEN 0.95 ELSE 0 END) AS sim
                FROM a CROSS JOIN l
                QUALIFY row_number() OVER (PARTITION BY a.nome ORDER BY sim DESC) = 1
            )
            SELECT buscado, grupo,
                   CASE WHEN sim >= {LIMIAR_ENCONTRADO} THEN 'encontrado'
                        WHEN sim >= {LIMIAR_VERIFICAR} THEN 'verificar'
                        ELSE 'não encontrado' END AS resultado,
                   achado, categoria, round(confianca, 2), coalesce(status_funcionamento, '—'),
                   situacao_real, round(sim, 2)
            FROM m ORDER BY resultado, grupo, buscado
        """)
        achou = sum(1 for x in linhas if x[2] == "encontrado")
        resumo_amostra = (achou, len(linhas))
        amostra_html = (
            f"<p><strong>{achou} de {len(linhas)}</strong> encontrados com similaridade ≥ "
            f"{str(LIMIAR_ENCONTRADO).replace('.', ',')}. Itens “verificar” precisam de olho humano.</p>"
            + tabela_html(["Buscado", "Grupo", "Resultado", "Achado no Overture", "Categoria",
                           "Confiança", "Status", "Situação real", "Similaridade"], linhas)
        )

    # Exporta para Power BI / QGIS (sem dados de contato).
    csv_path = SAIDA / "jf_lugares.csv"
    con.execute(f"COPY (SELECT * EXCLUDE (nn, dt_atualizacao) FROM l) TO '{csv_path.as_posix()}' (HEADER, DELIMITER ';')")

    # ── HTML
    kpis = [
        ("Lugares", num(total)),
        ("Com categoria", pct(com_cat, total)),
        ("Confiança mediana", num(mediana_conf)),
        ("Possíveis duplicatas", num(n_dups)),
    ]
    if resumo_amostra:
        kpis.append(("Sua amostra", f"{resumo_amostra[0]}/{resumo_amostra[1]}"))
    kpi_html = "".join(f'<div class="kpi"><span>{html.escape(k)}</span><b>{v}</b></div>' for k, v in kpis)
    max_cat = cats[0][1] if cats else 0
    max_faixa = max((f[1] for f in faixas), default=0)

    corpo = f"""
<header>
  <p class="eyebrow">Lugora · diagnóstico da base de lugares</p>
  <h1>{html.escape(CIDADE)} no Overture Maps</h1>
  <p class="muted">Release {html.escape(meta.get('release', '?'))} · limite: {html.escape(meta.get('limite_subtype', '?'))}
     · baixado em {html.escape(meta.get('baixado_em', '?'))} · relatório gerado em {datetime.now():%d/%m/%Y %H:%M}</p>
</header>
<section class="kpis">{kpi_html}</section>

<h2>1. Completude dos campos</h2>
{tabela_html(["Campo", "Lugares", "%"], resumo)}

<h2>2. Confiança</h2>
<p class="muted">A confiança mede a chance de o lugar <em>existir</em> (0 a 1), não se está aberto. Não é calibrada
entre fontes: use como filtro relativo. Veja quanto cada corte descartaria antes de escolher um.</p>
<div class="grid">
<div>{tabela_html(["Faixa", "Lugares", "%"], faixas, barra_col=1, barra_max=max_faixa)}</div>
<div>{tabela_html(["Corte", "Ficam", "Saem", "% que sai"], cortes)}</div>
</div>

<h2>3. Status de funcionamento</h2>
{tabela_html(["Status", "Lugares", "%"], status)}

<h2>4. Categorias mais comuns</h2>
{tabela_html(["Categoria", "Lugares", "%", "Confiança mediana"], cats, barra_col=1, barra_max=max_cat)}

<h2>5. Fontes dos dados</h2>
<p class="muted">De onde vem cada registro (meta = páginas no Facebook/Instagram). Mostra o quanto a base depende
de cada fonte e se a confiança muda entre elas.</p>
{tabela_html(["Fonte(s)", "Lugares", "%", "Confiança mediana"], fontes)}

<h2>6. Recência (ano da última atualização da fonte original, sem contar o Overture)</h2>
{tabela_html(["Ano", "Lugares", "%"], recencia)}

<h2>7. Possíveis duplicatas</h2>
<p class="muted">Pares com nomes parecidos (similaridade ≥ 0,9) a até {DISTANCIA_DUPLICATA_M} m. Inclui falsos
positivos, como lojas de uma mesma rede lado a lado. Mostrando até 40.</p>
<p><strong>{num(n_dups)}</strong> pares ({pct(n_dups, total)} da base).</p>
{tabela_html(["Lugar A", "Lugar B", "Categoria A", "Categoria B", "Distância (m)", "Similaridade"],
             [[x[0], x[1], x[2], x[3], int(x[4]), x[5]] for x in dups[:40]])}

<h2>8. Sua amostra</h2>
{amostra_html}

<footer class="muted">Dados © Overture Maps Foundation e contribuidores (OpenStreetMap, Meta, Microsoft, Foursquare e
outros). Contatos (e-mail, telefone) não foram copiados, por minimização de dados. CSV para Power BI:
<code>relatorio/jf_lugares.csv</code>.</footer>
"""
    pagina = f"""<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lugora · {html.escape(CIDADE)}</title>
<style>
:root{{--bg:#fbfaf8;--fg:#24323a;--muted:#6b7b83;--line:#d9e2e6;--teal:#1f4e5f;--acc:#b85a2b;--zebra:#f2f5f6}}
@media (prefers-color-scheme:dark){{:root{{--bg:#151b1e;--fg:#e6ecee;--muted:#9aabb3;--line:#2f3b41;--teal:#8cc3d4;--acc:#e08a5c;--zebra:#1b2327}}}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}}
main{{max-width:980px;margin:0 auto;padding:32px 16px 64px}}
h1{{margin:4px 0;color:var(--teal);font-size:28px}} h2{{margin:36px 0 8px;color:var(--teal);font-size:19px;
border-bottom:1px solid var(--line);padding-bottom:4px}}
.eyebrow{{margin:0;color:var(--acc);font-weight:600;font-size:13px;letter-spacing:.04em;text-transform:uppercase}}
.muted{{color:var(--muted);font-size:13.5px}} code{{font-size:13px}}
.kpis{{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-top:20px}}
.kpi{{border:1px solid var(--line);border-radius:8px;padding:10px 12px}} .kpi span{{display:block;color:var(--muted);font-size:12.5px}}
.kpi b{{font-size:22px;color:var(--teal);font-variant-numeric:tabular-nums}}
.grid{{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:16px}}
table{{width:100%;border-collapse:collapse;font-size:13.5px;margin:6px 0;display:block;overflow-x:auto}}
th,td{{text-align:left;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}}
th{{color:var(--teal);font-weight:600}} tbody tr:nth-child(even){{background:var(--zebra)}}
td{{font-variant-numeric:tabular-nums}}
.bar{{display:inline-block;width:110px;height:8px;background:var(--line);border-radius:4px;margin-right:8px;vertical-align:middle}}
.bar span{{display:block;height:100%;background:var(--acc);border-radius:4px}} td em{{font-style:normal}}
footer{{margin-top:40px;border-top:1px solid var(--line);padding-top:12px}}
</style></head><body><main>{corpo}</main></body></html>"""
    destino = SAIDA / "relatorio_jf.html"
    destino.write_text(pagina, encoding="utf-8")
    return destino


def main() -> None:
    p = argparse.ArgumentParser(description="Diagnóstico do Overture para Juiz de Fora")
    p.add_argument("--release", default=RELEASE_PADRAO)
    p.add_argument("--atualizar", action="store_true", help="baixar de novo mesmo com cópia local")
    a = p.parse_args()

    if a.atualizar or not ARQ_LUGARES.exists():
        baixar(a.release)
    else:
        print(f"Usando cópia local: {ARQ_LUGARES} (use --atualizar para baixar de novo)")
    destino = gerar_relatorio()
    print(f"Relatório: {destino}")


if __name__ == "__main__":
    main()
