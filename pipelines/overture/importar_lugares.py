"""Carrega os lugares de Juiz de Fora no Postgres (Fatia 3).

Lê o snapshot do relatorio_jf.py, aplica a limpeza (D3) e a deduplicação (D4) da seção 7.2 e
grava no banco indicado em LUGORA_DB_URL (arquivo .env local). Importa tudo, sem corte de
confiança (D1), e nunca copia e-mails nem telefones. Rodar de novo o mesmo snapshot não duplica
nem apaga nada.

    python importar_lugares.py               # usa o snapshot local, se houver
    python importar_lugares.py --atualizar   # baixa o snapshot de novo

Dados de lugares: Overture Maps Foundation.
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import os
import re
import sys
import time
from collections import defaultdict
from dataclasses import dataclass, replace
from pathlib import Path

import duckdb
from dotenv import load_dotenv

from comum import STAGING_SCHEMA, attach_database, normalize_name, query_remote, redact_credentials, run_remote
from relatorio_jf import ARQ_LUGARES, ARQ_META, RELEASE_PADRAO, SAIDA, baixar

JUIZ_DE_FORA_GERS_ID = "8b275bf4-2525-4616-b815-f6c777ab419a"  # o mesmo do seed e do importar_divisoes.py
REVIEW_FILE = SAIDA / "fila_revisao_lugares.csv"
REVIEW_COLUMN = "REVISÃO"

# As decisões da revisão manual. Fica no git, só com identificadores: a base tem nomes de
# profissionais autônomos e não é publicada, mas as decisões precisam sobreviver a um db reset.
DECISIONS_FILE = Path(__file__).resolve().parent / "decisoes_revisao.csv"
SAME_PLACE = "mesma_coisa"
DIFFERENT_PLACES = "diferentes"
NOT_IN_CITY = "nao_existe"
EXISTS_IN_CITY = "existe"

MERGE_DISTANCE_M = 50
# A D4 cita a faixa de 0,90 a 0,97, mas o exemplo dela ("Nave Estúdio" × "NAVE Studio") dá 0,983, e
# só a igualdade exata mescla sozinha. Por isso, qualquer nome diferente a partir de 0,90 vai para revisão.
REVIEW_MIN_SIMILARITY = 0.90

# D3: estes nomes são moradia, mesmo quando a base diz que é "local histórico" ou "parque".
RESIDENTIAL_NAME = re.compile(r"\b(condominio|edificio|residencial)\b")
RESIDENTIAL_CATEGORY = "residential"

# D3: Juiz de Fora não tem litoral. Vai para a revisão, em vez de ser corrigido sozinho.
IMPOSSIBLE_CATEGORIES = {"beach": "praia em cidade sem litoral"}

# Minimização (LGPD): o Overture às vezes traz contatos no meio do texto do endereço.
EMAIL_OR_LINK = re.compile(r"[^\s@]+@[^\s@]+\.[^\s@]+|https?://|www\.", re.IGNORECASE)
PHONE = re.compile(
    r"\+\s*\d{2}\b"  # +55
    r"|\(\s*\d{2}\s*\)\s*\d"  # (32) 3212-3456, (32)98888-7777
    r"|\b[1-9]\d\s+[2-9]\d{7}\b"  # 32 32123456
    r"|\b9\d{4}[\s.,-]*\d{4}\b"  # 98888-7777, 98888.7777, 98888,7777
)
# 3212-3456 é telefone; 2998-3000 e "sala 1801-1803" são faixas de números. Na dúvida, conta como telefone.
LANDLINE = re.compile(r"\b([2-5]\d{3})[\s.-](\d{4})\b")
NUMBER_RANGE_MAX_SPAN = 200
# Com hífen, o CEP não se confunde com telefone. Só com oito dígitos, pode ser um fixo: em Juiz de Fora, começa com 36.
POSTAL_CODE = re.compile(r"\d{5}-\d{3}|36\d{6}")

REQUIRED_COLUMNS = {"id", "nome", "categoria", "confianca", "lat", "lng", "endereco", "cep", "fontes"}


@dataclass(frozen=True)
class RawPlace:
    """Um registro do snapshot. Não existe campo para telefone nem e-mail, de propósito."""

    gers_id: str
    name: str
    overture_category: str | None
    confidence: float | None
    latitude: float
    longitude: float
    address: str | None = None
    postal_code: str | None = None
    sources: tuple[str, ...] = ()


@dataclass(frozen=True)
class CategoryRule:
    category: str
    category_group: str
    is_visitable: bool
    is_sensitive: bool


@dataclass(frozen=True)
class Place:
    raw: RawPlace
    category: str | None
    category_group: str | None
    is_visitable: bool
    is_sensitive: bool
    merged_gers_ids: tuple[str, ...] = ()
    other_names: tuple[str, ...] = ()


@dataclass(frozen=True)
class ReviewItem:
    reason: str
    gers_id_a: str
    name_a: str
    gers_id_b: str = ""
    name_b: str = ""
    distance_m: float | None = None
    similarity: float | None = None


@dataclass(frozen=True)
class Decision:
    gers_id_a: str
    gers_id_b: str
    decision: str

    @property
    def key(self) -> tuple[str, str]:
        return pair_key(self.gers_id_a, self.gers_id_b)


def pair_key(gers_id_a: str, gers_id_b: str) -> tuple[str, str]:
    """A ordem do par não importa. Um lugar sozinho, como uma praia, tem o segundo campo vazio."""
    return (gers_id_a, gers_id_b) if not gers_id_b or gers_id_a <= gers_id_b else (gers_id_b, gers_id_a)


# ─── Revisão manual ──────────────────────────────────────────────────────────
def decision_from_text(text: str) -> str | None:
    """Traduz o que a pessoa escreveu na coluna de revisão. Texto em branco é decisão pendente."""
    normalized = normalize_name(text)
    if not normalized:
        return None
    if "mesma coisa" in normalized or "mesmo lugar" in normalized:
        return SAME_PLACE
    if "diferente" in normalized:
        return DIFFERENT_PLACES
    if "nao tem" in normalized or "nao existe" in normalized:
        return NOT_IN_CITY
    if "existe" in normalized:
        return EXISTS_IN_CITY
    raise ValueError(text)


def parse_queue_decisions(text: str) -> list[Decision]:
    """Lê as decisões escritas na fila de revisão. Uma resposta que não entendo para tudo."""
    decisions = []
    for line, row in enumerate(csv.DictReader(io.StringIO(text), delimiter=";"), start=2):
        try:
            decision = decision_from_text(row.get(REVIEW_COLUMN) or "")
        except ValueError as error:
            raise SystemExit(
                f"Linha {line} da fila de revisão: não entendi {error}. "
                'Use "São a mesma coisa", "São lojas diferentes", "Existe" ou "Não existe".'
            ) from None
        if decision:
            decisions.append(Decision(row["gers_a"], row["gers_b"] or "", decision))
    return decisions


def read_spreadsheet_text(path: Path) -> str:
    """O Excel pode salvar em outra codificação, e o arquivo precisa continuar legível."""
    if not path.exists():
        return ""
    content = path.read_bytes()
    try:
        return content.decode("utf-8-sig")
    except UnicodeDecodeError:
        return content.decode("cp1252")


def read_decisions(path: Path) -> list[Decision]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as file:
        return [Decision(row["gers_a"], row["gers_b"], row["decisao"]) for row in csv.DictReader(file, delimiter=";")]


def write_decisions(path: Path, decisions: list[Decision]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file, delimiter=";", lineterminator="\n")
        writer.writerow(["gers_a", "gers_b", "decisao"])
        for decision in sorted(decisions, key=lambda item: item.key):
            writer.writerow([*decision.key, decision.decision])


def merge_decisions(saved: list[Decision], new: list[Decision]) -> list[Decision]:
    """A decisão mais nova sobre o mesmo par vale."""
    return list({decision.key: decision for decision in [*saved, *new]}.values())


# ─── Limpeza (D3 e D5) ───────────────────────────────────────────────────────
def classify(raw: RawPlace, rules: dict[str, CategoryRule]) -> Place:
    rule = rules.get(raw.overture_category or "")
    # Uma categoria sensível continua sensível em qualquer caso: é a proteção de privacidade.
    is_sensitive = rule.is_sensitive if rule else False

    if RESIDENTIAL_NAME.search(normalize_name(raw.name)):
        return Place(raw, RESIDENTIAL_CATEGORY, None, False, is_sensitive)
    if raw.overture_category is None:
        # Sem categoria (D3): o primeiro usuário a registrar a visita escolhe.
        return Place(raw, None, None, True, False)
    if rule is None:
        return Place(raw, None, None, False, False)
    return Place(raw, rule.category, rule.category_group, rule.is_visitable, is_sensitive)


# ─── Deduplicação (D4) ───────────────────────────────────────────────────────
def distance_m(a: RawPlace, b: RawPlace) -> float:
    """Distância em metros sobre a esfera (haversine)."""
    lat_a, lat_b = math.radians(a.latitude), math.radians(b.latitude)
    d_lat = lat_b - lat_a
    d_lng = math.radians(b.longitude - a.longitude)
    h = math.sin(d_lat / 2) ** 2 + math.cos(lat_a) * math.cos(lat_b) * math.sin(d_lng / 2) ** 2
    return 2 * 6_371_000 * math.asin(math.sqrt(h))


def nearby_pairs(places: list[Place], max_distance_m: float) -> list[tuple[int, int, float]]:
    """Pares a até max_distance_m. A grade evita comparar cada lugar com os outros 19 mil."""
    cell = 0.0005  # cerca de 55 m de latitude: quem está perto cai na mesma célula ou numa vizinha
    grid: dict[tuple[int, int], list[int]] = defaultdict(list)
    for index, place in enumerate(places):
        grid[(math.floor(place.raw.latitude / cell), math.floor(place.raw.longitude / cell))].append(index)

    pairs = []
    for (row, col), members in grid.items():
        for d_row in (-1, 0, 1):
            for d_col in (-1, 0, 1):
                for i in members:
                    for j in grid.get((row + d_row, col + d_col), ()):
                        if i < j:
                            distance = distance_m(places[i].raw, places[j].raw)
                            if distance <= max_distance_m:
                                pairs.append((i, j, distance))
    return pairs


def choose_main(cluster: list[Place]) -> Place:
    """O principal tem mais fontes; em empate, maior confiança. O GERS desempata sempre igual."""
    return min(cluster, key=lambda p: (-len(p.raw.sources), -(p.raw.confidence or -1), p.raw.gers_id))


def merge_cluster(cluster: list[Place]) -> Place:
    main = choose_main(cluster)
    others = sorted(p.raw.gers_id for p in cluster if p is not main)
    # O nome que não ficou continua valendo para a busca: quem digita o nome certo sempre encontra (D1).
    main_name = normalize_name(main.raw.name)
    other_names = {
        normalize_name(p.raw.name): p.raw.name
        for p in sorted(cluster, key=lambda p: p.raw.gers_id)
        if normalize_name(p.raw.name) != main_name
    }
    return replace(
        main,
        raw=replace(
            main.raw,
            address=main.raw.address or next((p.raw.address for p in cluster if p.raw.address), None),
            postal_code=main.raw.postal_code or next((p.raw.postal_code for p in cluster if p.raw.postal_code), None),
        ),
        is_sensitive=any(p.is_sensitive for p in cluster),
        merged_gers_ids=tuple(others),
        other_names=tuple(sorted(other_names.values())),
    )


def deduplicate(places: list[Place], decisions: tuple[Decision, ...] | list[Decision] = ()) -> list[Place]:
    """Só nome normalizado idêntico a até 50 m mescla sozinho. Filial a mais de 50 m fica separada.

    Fora isso, só mescla o par que uma pessoa revisou e disse ser a mesma coisa.
    """
    parent = list(range(len(places)))

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    names = [normalize_name(p.raw.name) for p in places]
    for i, j, _ in nearby_pairs(places, MERGE_DISTANCE_M):
        if names[i] and names[i] == names[j]:
            parent[find(i)] = find(j)

    index_by_gers = {p.raw.gers_id: index for index, p in enumerate(places)}
    for decision in decisions:
        if decision.decision == SAME_PLACE and decision.gers_id_a in index_by_gers and decision.gers_id_b in index_by_gers:
            parent[find(index_by_gers[decision.gers_id_a])] = find(index_by_gers[decision.gers_id_b])

    clusters: dict[int, list[Place]] = defaultdict(list)
    for index, place in enumerate(places):
        clusters[find(index)].append(place)

    merged = [merge_cluster(cluster) if len(cluster) > 1 else cluster[0] for cluster in clusters.values()]
    return sorted(merged, key=lambda p: p.raw.gers_id)


def group_key(place: Place) -> str:
    """Sem grupo do Lugora, compara o tipo do Overture: "Nave Estúdio" × "NAVE Studio" são media_service."""
    return place.category_group or place.raw.overture_category or ""


def review_pairs(
    con: duckdb.DuckDBPyConnection, places: list[Place], decisions: tuple[Decision, ...] | list[Decision] = ()
) -> list[ReviewItem]:
    """Nomes parecidos, perto e do mesmo grupo: uma pessoa decide (D4). Nunca mescla sozinho."""
    decided = {decision.key for decision in decisions}
    candidates = []
    for i, j, distance in nearby_pairs(places, MERGE_DISTANCE_M):
        a, b = places[i], places[j]
        if (
            normalize_name(a.raw.name) != normalize_name(b.raw.name)
            and group_key(a) == group_key(b)
            and pair_key(a.raw.gers_id, b.raw.gers_id) not in decided
        ):
            candidates.append((a, b, distance))
    if not candidates:
        return []

    similarities = con.execute(
        """
        SELECT jaro_winkler_similarity(a, b)
        FROM (SELECT unnest(?::VARCHAR[]) AS a, unnest(?::VARCHAR[]) AS b, unnest(?::INTEGER[]) AS position)
        ORDER BY position
        """,
        [
            [normalize_name(a.raw.name) for a, _, _ in candidates],
            [normalize_name(b.raw.name) for _, b, _ in candidates],
            list(range(len(candidates))),
        ],
    ).fetchall()

    items = [
        ReviewItem("nome parecido a até 50 m", a.raw.gers_id, a.raw.name, b.raw.gers_id, b.raw.name, round(distance, 1), round(similarity, 3))
        for (a, b, distance), (similarity,) in zip(candidates, similarities)
        if similarity >= REVIEW_MIN_SIMILARITY
    ]
    return sorted(items, key=lambda item: (item.gers_id_a, item.gers_id_b))


def impossible_category_items(places: list[Place], decisions: tuple[Decision, ...] | list[Decision] = ()) -> list[ReviewItem]:
    decided = {decision.key for decision in decisions}
    return [
        ReviewItem(IMPOSSIBLE_CATEGORIES[p.raw.overture_category], p.raw.gers_id, p.raw.name)
        for p in places
        if p.raw.overture_category in IMPOSSIBLE_CATEGORIES and pair_key(p.raw.gers_id, "") not in decided
    ]


def not_in_city_ids(decisions: tuple[Decision, ...] | list[Decision]) -> set[str]:
    """Lugares que a revisão disse não existirem na cidade: saem da busca, sem apagar o registro."""
    return {decision.gers_id_a for decision in decisions if decision.decision == NOT_IN_CITY}


# ─── Contatos ────────────────────────────────────────────────────────────────
def has_contact(text: str) -> bool:
    if EMAIL_OR_LINK.search(text) or PHONE.search(text):
        return True
    return any(abs(int(first) - int(second)) >= NUMBER_RANGE_MAX_SPAN for first, second in LANDLINE.findall(text))


def clean_address(address: str | None) -> str | None:
    """Com um contato, o endereço inteiro fica de fora: o lugar continua na base, e nenhum pedaço do número sobra."""
    return None if not address or has_contact(address) else address


def clean_postal_code(postal_code: str | None) -> str | None:
    """Esse campo do Overture traz de tudo, até telefone. Só fica o que tem formato de CEP."""
    value = (postal_code or "").strip()
    return value if POSTAL_CODE.fullmatch(value) else None


# ─── Leitura e escrita ───────────────────────────────────────────────────────
def connect() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    con.execute("INSTALL postgres; LOAD postgres; SET memory_limit = '1GB'; SET threads = 4;")
    return con


def read_snapshot(con: duckdb.DuckDBPyConnection) -> list[RawPlace]:
    path = ARQ_LUGARES.as_posix()
    columns = {row[0] for row in con.execute(f"DESCRIBE SELECT * FROM read_parquet('{path}')").fetchall()}
    absent = REQUIRED_COLUMNS - columns
    if absent:
        raise SystemExit(f"O snapshot mudou. Colunas ausentes: {sorted(absent)}")

    rows = con.execute(
        f"SELECT id, nome, categoria, confianca, lat, lng, endereco, cep, fontes FROM read_parquet('{path}')"
    ).fetchall()
    places = [
        RawPlace(gers_id, name, category, confidence, lat, lng, clean_address(address), clean_postal_code(postal_code), tuple((sources or "").split(" + ")) if sources else ())
        for gers_id, name, category, confidence, lat, lng, address, postal_code, sources in rows
    ]

    without_address = sum(1 for row, place in zip(rows, places) if row[6] and not place.address)
    print(f"Endereços deixados de fora por trazerem contato: {without_address}")
    # O nome não pode ficar vazio, então isto só avisa: uma pessoa decide o que fazer.
    names_with_contact = sum(1 for place in places if has_contact(place.name))
    if names_with_contact:
        print(f"ATENÇÃO: {names_with_contact} nomes parecem trazer um contato. Confira antes de publicar.")
    return places


def read_category_rules(con: duckdb.DuckDBPyConnection) -> dict[str, CategoryRule]:
    rows = query_remote(con, "select overture_category, category, category_group, is_visitable, is_sensitive from public.category_map")
    return {row[0]: CategoryRule(row[1], row[2], row[3], row[4]) for row in rows}


CHANGES = f"""
    select
      count(*) filter (where p.id is null) as new,
      count(*) filter (
        where p.id is not null
          and (p.name, p.location::text, p.address, p.postal_code, p.overture_category, p.category,
               p.is_visitable, p.is_sensitive, p.confidence, p.sources, p.merged_gers_ids, p.other_names)
          is distinct from
              (s.name, s.location::text, s.address, s.postal_code, s.overture_category, s.category,
               s.is_visitable, s.is_sensitive, s.confidence, string_to_array(s.sources, ' + '), string_to_array(s.merged_gers_ids, ','), s.other_names)
      ) as changed,
      count(*) as total
    from {STAGING_SCHEMA}.places as s
    left join public.places as p on p.gers_id = s.gers_id
"""

# Não toca em category_override nem em status: correções e sinalizações de usuários vêm antes da base.
# O "where" evita regravar o que não mudou, para o updated_at continuar verdadeiro.
UPSERT = f"""
    insert into public.places (
      gers_id, name, location, address, postal_code, city_id, overture_category, category,
      is_visitable, is_sensitive, confidence, sources, merged_gers_ids, other_names
    )
    select
      s.gers_id, s.name, s.location, s.address, s.postal_code, city.id, s.overture_category, s.category,
      s.is_visitable, s.is_sensitive, s.confidence, string_to_array(s.sources, ' + '), string_to_array(s.merged_gers_ids, ','), s.other_names
    from {STAGING_SCHEMA}.places as s
    cross join (select id from public.cities where gers_id = '{JUIZ_DE_FORA_GERS_ID}') as city
    on conflict (gers_id) do update
      set name = excluded.name, location = excluded.location, address = excluded.address,
          postal_code = excluded.postal_code, overture_category = excluded.overture_category,
          category = excluded.category, is_visitable = excluded.is_visitable,
          is_sensitive = excluded.is_sensitive, confidence = excluded.confidence,
          sources = excluded.sources, merged_gers_ids = excluded.merged_gers_ids, other_names = excluded.other_names
      where (public.places.name, public.places.location::text, public.places.address, public.places.postal_code,
             public.places.overture_category, public.places.category, public.places.is_visitable,
             public.places.is_sensitive, public.places.confidence, public.places.sources, public.places.merged_gers_ids,
             public.places.other_names)
        is distinct from
            (excluded.name, excluded.location::text, excluded.address, excluded.postal_code,
             excluded.overture_category, excluded.category, excluded.is_visitable,
             excluded.is_sensitive, excluded.confidence, excluded.sources, excluded.merged_gers_ids,
             excluded.other_names)
"""


# Registros que uma mesclagem absorveu depois de já estarem no banco: viram "merged" e apontam para
# o principal (D4). Sem visitas ainda, não há nada para migrar; a Fatia 4 precisa levar isso em conta.
MARK_MERGED = """
    update public.places as absorbed
    set status = 'merged', merged_into_id = main.id
    from public.places as main
    where absorbed.gers_id = any (main.merged_gers_ids)
      and absorbed.id <> main.id
      and absorbed.status <> 'merged'
"""


def write_places(con: duckdb.DuckDBPyConnection, places: list[Place], not_in_city: set[str]) -> tuple:
    if not query_remote(con, f"select 1 from public.cities where gers_id = '{JUIZ_DE_FORA_GERS_ID}'"):
        raise SystemExit("Juiz de Fora não está em cities. Rode `npx supabase db reset` ou `python importar_divisoes.py`.")

    try:
        # As tabelas de passagem ficam fora do public e somem no final, mesmo se der erro.
        run_remote(con, f"drop schema if exists {STAGING_SCHEMA} cascade")
        run_remote(con, f"create schema {STAGING_SCHEMA}")
        con.execute("CALL postgres_clear_cache()")

        con.execute("""
            CREATE TEMP TABLE outgoing (
              gers_id VARCHAR, name VARCHAR, latitude DOUBLE, longitude DOUBLE, address VARCHAR, postal_code VARCHAR,
              overture_category VARCHAR, category VARCHAR, is_visitable BOOLEAN, is_sensitive BOOLEAN,
              confidence DOUBLE, sources VARCHAR, merged_gers_ids VARCHAR, other_names VARCHAR
            )
        """)
        con.executemany(
            "INSERT INTO outgoing VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                (
                    p.raw.gers_id, p.raw.name, p.raw.latitude, p.raw.longitude, p.raw.address, p.raw.postal_code,
                    p.raw.overture_category, p.category, p.is_visitable, p.is_sensitive, p.raw.confidence,
                    " + ".join(p.raw.sources), ",".join(p.merged_gers_ids), " | ".join(p.other_names) or None,
                )
                for p in places
            ],
        )

        print("Enviando os dados para o banco...")
        con.execute(f"CREATE TABLE pg.{STAGING_SCHEMA}.places AS SELECT * FROM outgoing")
        run_remote(con, f"alter table {STAGING_SCHEMA}.places add column location extensions.geography(Point, 4326)")
        run_remote(
            con,
            f"""
            update {STAGING_SCHEMA}.places
            set location = extensions.ST_SetSRID(extensions.ST_MakePoint(longitude, latitude), 4326)::extensions.geography
            """,
        )

        changes = query_remote(con, CHANGES)[0]
        print("Atualizando a tabela...")
        run_remote(con, UPSERT)
        run_remote(con, MARK_MERGED)
        if not_in_city:
            ids = ", ".join(f"'{gers_id.replace(chr(39), chr(39) * 2)}'" for gers_id in sorted(not_in_city))
            run_remote(con, f"update public.places set status = 'closed' where gers_id in ({ids}) and status <> 'closed'")
        return changes
    finally:
        run_remote(con, f"drop schema if exists {STAGING_SCHEMA} cascade")


def record_import(con: duckdb.DuckDBPyConnection, release: str, added: int, changed: int, merged: int, in_review: int, not_visitable: int) -> None:
    run_remote(
        con,
        f"""
        insert into public.overture_imports (release, added, changed, merged, in_review, not_visitable)
        values ('{release.replace(chr(39), chr(39) * 2)}', {added}, {changed}, {merged}, {in_review}, {not_visitable})
        """,
    )


def write_review_file(items: list[ReviewItem]) -> None:
    """Só o que ainda falta decidir. As decisões já foram para DECISIONS_FILE antes desta gravação."""
    SAIDA.mkdir(exist_ok=True)
    with REVIEW_FILE.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.writer(file, delimiter=";")
        writer.writerow(["motivo", "gers_a", "nome_a", "gers_b", "nome_b", "distancia_m", "similaridade", REVIEW_COLUMN])
        for item in items:
            writer.writerow([item.reason, item.gers_id_a, item.name_a, item.gers_id_b, item.name_b, item.distance_m, item.similarity, ""])


def print_report(
    con: duckdb.DuckDBPyConnection,
    raw_count: int,
    places: list[Place],
    changes: tuple,
    review_count: int,
    decision_count: int,
    started: float,
) -> None:
    new, changed, total = changes
    merged = sum(len(p.merged_gers_ids) for p in places)

    print("\n── Esta execução ──")
    print(f"Registros no snapshot: {raw_count}")
    print(f"Mesclados (D4): {merged} registros incorporados a {sum(1 for p in places if p.merged_gers_ids)} lugares")
    print(f"Lugares a gravar: {total}")
    print(f"No banco: {new} novos, {changed} alterados, {total - new - changed} iguais")
    print(f"Decisões de revisão guardadas: {decision_count} · ainda pendentes: {review_count} (em {REVIEW_FILE.relative_to(Path(__file__).resolve().parent)})")

    print("\n── O que está no banco ──")
    active, closed, merged_rows, visitable, not_visitable, sensitive, residential, no_category, repeated = query_remote(
        con,
        """
        select
          count(*) filter (where status = 'active'),
          count(*) filter (where status = 'closed'),
          count(*) filter (where status = 'merged'),
          count(*) filter (where status = 'active' and is_visitable),
          count(*) filter (where status = 'active' and not is_visitable),
          count(*) filter (where status = 'active' and is_sensitive),
          count(*) filter (where status = 'active' and category = 'residential'),
          count(*) filter (where status = 'active' and overture_category is null),
          (select count(*) from (select gers_id from public.places group by 1 having count(*) > 1) as d)
        from public.places
        """,
    )[0]
    print(f"Lugares ativos: {active} (visitáveis: {visitable}, não visitáveis: {not_visitable})")
    print(f"Fora da busca: {closed} fechados pela revisão, {merged_rows} mesclados depois de carregados")
    print(f"Sensíveis: {sensitive} · residenciais: {residential} · sem categoria: {no_category}")
    print(f"Identificadores repetidos: {repeated}")
    print(f"\nTempo: {time.time() - started:.0f} s")
    print("Dados de lugares: Overture Maps Foundation.")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", default=RELEASE_PADRAO)
    parser.add_argument("--atualizar", action="store_true", help="baixa o snapshot de novo")
    args = parser.parse_args()

    load_dotenv(Path(__file__).resolve().parent / ".env")
    db_url = os.environ.get("LUGORA_DB_URL")
    if not db_url:
        raise SystemExit("Defina LUGORA_DB_URL em pipelines/overture/.env (veja o .env.example).")

    started = time.time()
    if args.atualizar or not ARQ_LUGARES.exists():
        baixar(args.release)
    release = json.loads(ARQ_META.read_text(encoding="utf-8"))["release"]
    print(f"Usando o snapshot da release {release}.")

    # Antes de tudo: o que a pessoa escreveu na fila vai para o arquivo versionado. Só depois disso
    # a fila é regravada, para nenhuma revisão se perder.
    decisions = merge_decisions(read_decisions(DECISIONS_FILE), parse_queue_decisions(read_spreadsheet_text(REVIEW_FILE)))
    write_decisions(DECISIONS_FILE, decisions)

    con = connect()
    raw = read_snapshot(con)
    attach_database(con, db_url)
    try:
        rules = read_category_rules(con)
        places = deduplicate([classify(item, rules) for item in raw], decisions)
        review = review_pairs(con, places, decisions) + impossible_category_items(places, decisions)
        write_review_file(review)

        changes = write_places(con, places, not_in_city_ids(decisions))
        record_import(
            con,
            release,
            added=changes[0],
            changed=changes[1],
            merged=sum(len(p.merged_gers_ids) for p in places),
            in_review=len(review),
            not_visitable=sum(1 for p in places if not p.is_visitable),
        )
        print_report(con, len(raw), places, changes, len(review), len(decisions), started)
    except duckdb.Error as error:
        # Se a conexão cair no meio da carga, a mensagem original traz a URL com a senha.
        raise SystemExit(f"A gravação no banco falhou: {redact_credentials(str(error), db_url)}") from None


if __name__ == "__main__":
    main()
