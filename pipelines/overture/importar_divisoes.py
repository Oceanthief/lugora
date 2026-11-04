"""Carrega os países e as cidades do Brasil no Postgres (Fatia 2).

Lê o tema divisions do Overture com DuckDB, filtra as cidades pela lista oficial de
municípios do IBGE e grava no banco indicado em LUGORA_DB_URL (arquivo .env local).
Rodar duas vezes a mesma release dá o mesmo resultado: nada duplica e nada é apagado.

    python importar_divisoes.py                     # usa a cópia local, se houver
    python importar_divisoes.py --atualizar         # baixa de novo
    python importar_divisoes.py --release AAAA-MM-DD.0

Limites © OpenStreetMap contributors (ODbL), via Overture Maps Foundation.
Lista de municípios: IBGE.
"""

from __future__ import annotations

import argparse
import gzip
import json
import os
import re
import sys
import time
import unicodedata
import urllib.request
from dataclasses import dataclass
from pathlib import Path

import duckdb
from dotenv import load_dotenv

DEFAULT_RELEASE = "2026-10-21.0"  # confira a mais recente em docs.overturemaps.org
S3_URL = "s3://overturemaps-us-west-2/release/{release}/theme=divisions/type=division_area/*"
IBGE_URL = "https://servicodados.ibge.gov.br/api/v1/localidades/municipios?view=nivelado"
MIN_EXPECTED_MUNICIPALITIES = 5000

# O esquema do Overture muda entre releases: sem estas colunas, é melhor parar logo.
REQUIRED_COLUMNS = {"division_id", "country", "region", "subtype", "class", "names", "geometry"}

# Municípios que o IBGE e o Overture (vindo do OpenStreetMap) escrevem de jeitos diferentes.
# Cada um foi conferido na release 2026-10-21.0, pela UF e pela área do polígono.
ALIASES = {
    # O polígono "Plano Piloto" cobre o DF inteiro, como o município de Brasília no IBGE.
    ("Brasília", "DF"): "Plano Piloto",
    ("Januário Cicco", "RN"): "Boa Saúde",
    ("Lajedo do Tabocal", "BA"): "Lagedo do Tabocal",
    ("Luís Antônio", "SP"): "Luiz Antônio",
    ("Major Isidoro", "AL"): "Major Izidoro",
    ("Munhoz de Melo", "PR"): "Munhoz de Mello",
    ("Santa Teresinha", "PB"): "Santa Terezinha",
    ("Santa Terezinha", "BA"): "Santa Teresinha",
    ("São Caitano", "PE"): "São Caetano",
}

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "dados"
IBGE_FILE = DATA_DIR / "municipios_ibge.json"
STAGING_SCHEMA = "pipeline_staging"


# ─── Regras de seleção (sem rede nem banco, cobertas pelo pytest) ────────────
@dataclass(frozen=True)
class Locality:
    division_id: str
    name: str
    state: str
    area_km2: float


@dataclass(frozen=True)
class City:
    division_id: str
    name: str
    state: str
    area_km2: float


@dataclass(frozen=True)
class Selection:
    cities: list[City]
    missing: list[tuple[str, str]]
    discarded: int


def normalize_name(name: str) -> str:
    """Ignora acentos, maiúsculas e pontuação ao comparar nomes de cidades."""
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", ascii_name.lower()).strip()


def state_from_region(region: str) -> str:
    """Transforma o código do Overture (BR-MG) na UF (MG)."""
    return region.removeprefix("BR-")


def decode_response(body: bytes) -> str:
    """A API do IBGE responde compactada mesmo quando o cliente não pede."""
    if body[:2] == b"\x1f\x8b":
        body = gzip.decompress(body)
    return body.decode("utf-8")


def parse_ibge(text: str) -> list[tuple[str, str]]:
    """Devolve (nome, UF) de cada município da resposta do IBGE."""
    municipalities = [(item["municipio-nome"], item["UF-sigla"]) for item in json.loads(text)]
    if len(municipalities) < MIN_EXPECTED_MUNICIPALITIES:
        raise ValueError(f"O IBGE devolveu só {len(municipalities)} municípios.")
    return municipalities


def select_municipalities(
    localities: list[Locality], municipalities: list[tuple[str, str]]
) -> Selection:
    """Escolhe um polígono por município oficial.

    Cidade = município (seção 7.3), mas o tipo locality do Overture também traz distritos e
    povoados. Só fica o que está na lista do IBGE. Quando um distrito tem o mesmo nome do
    município, o maior polígono é o município inteiro.
    """
    candidates: dict[tuple[str, str], list[Locality]] = {}
    for locality in localities:
        key = (normalize_name(locality.name), locality.state)
        candidates.setdefault(key, []).append(locality)

    cities: list[City] = []
    missing: list[tuple[str, str]] = []
    for name, state in municipalities:
        overture_name = ALIASES.get((name, state), name)
        found = candidates.get((normalize_name(overture_name), state))
        if not found:
            missing.append((name, state))
            continue
        largest = max(found, key=lambda locality: locality.area_km2)
        # O nome vem do IBGE: é a grafia oficial que a pessoa vê no cadastro.
        cities.append(City(largest.division_id, name, state, largest.area_km2))

    return Selection(cities, missing, len(localities) - len(cities))


# ─── Download (Overture e IBGE) ──────────────────────────────────────────────
def connect() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial; INSTALL httpfs; LOAD httpfs; INSTALL postgres; LOAD postgres;")
    # O PC tem 7,7 GB de RAM: o limite faz o DuckDB usar o disco em vez de estourar a memória.
    # geometry_always_xy: exigido pelo DuckDB 2.0 para calcular áreas em (longitude, latitude).
    con.execute("SET s3_region = 'us-west-2'; SET memory_limit = '1GB'; SET threads = 4; SET geometry_always_xy = true;")
    DATA_DIR.mkdir(exist_ok=True)
    con.execute(f"SET temp_directory = '{(DATA_DIR / 'tmp').as_posix()}';")
    return con


def check_columns(con: duckdb.DuckDBPyConnection, source: str) -> None:
    columns = {row[0] for row in con.execute(f"DESCRIBE SELECT * FROM {source}").fetchall()}
    absent = REQUIRED_COLUMNS - columns
    if absent:
        raise SystemExit(f"O esquema do Overture mudou. Colunas ausentes: {sorted(absent)}")


def copy_to_parquet(con: duckdb.DuckDBPyConnection, query: str, target: Path) -> None:
    """Grava num arquivo temporário e renomeia, para um download interrompido não valer como cópia."""
    partial = target.with_suffix(".parcial")
    con.execute(f"COPY ({query}) TO '{partial.as_posix()}' (FORMAT parquet)")
    partial.replace(target)


def download_snapshot(con: duckdb.DuckDBPyConnection, release: str, snapshot_dir: Path) -> None:
    source = f"read_parquet('{S3_URL.format(release=release)}', hive_partitioning = 1)"
    check_columns(con, source)
    snapshot_dir.mkdir(parents=True, exist_ok=True)

    print("Baixando os limites dos países (leva alguns minutos)...")
    copy_to_parquet(
        con,
        f"""
        SELECT country AS iso_code,
               coalesce(names.common['pt'], names.primary) AS name,
               geometry
        FROM {source}
        WHERE subtype = 'country' AND class = 'land'
        """,
        snapshot_dir / "paises.parquet",
    )

    print("Baixando as localidades do Brasil...")
    copy_to_parquet(
        con,
        f"""
        SELECT division_id, names.primary AS name, region,
               ST_Area_Spheroid(geometry) / 1e6 AS area_km2,
               geometry
        FROM {source}
        WHERE country = 'BR' AND subtype = 'locality' AND class = 'land'
        """,
        snapshot_dir / "localidades_br.parquet",
    )


def load_ibge(refresh: bool) -> list[tuple[str, str]]:
    if refresh or not IBGE_FILE.exists():
        print("Baixando a lista de municípios do IBGE...")
        request = urllib.request.Request(IBGE_URL, headers={"User-Agent": "lugora-pipeline"})
        with urllib.request.urlopen(request, timeout=60) as response:
            text = decode_response(response.read())
        parse_ibge(text)  # só guarda a cópia local se a resposta estiver certa
        IBGE_FILE.write_text(text, encoding="utf-8")
    return parse_ibge(IBGE_FILE.read_text(encoding="utf-8"))


def read_localities(con: duckdb.DuckDBPyConnection, snapshot_dir: Path) -> list[Locality]:
    path = (snapshot_dir / "localidades_br.parquet").as_posix()
    rows = con.execute(f"SELECT division_id, name, region, area_km2 FROM read_parquet('{path}')").fetchall()
    return [
        Locality(division_id, name or "", state_from_region(region or ""), area_km2)
        for division_id, name, region, area_km2 in rows
    ]


# ─── Escrita no Postgres ─────────────────────────────────────────────────────
def run_remote(con: duckdb.DuckDBPyConnection, sql: str) -> None:
    con.execute(f"CALL postgres_execute('pg', '{sql.replace(chr(39), chr(39) * 2)}')")


def query_remote(con: duckdb.DuckDBPyConnection, sql: str) -> list[tuple]:
    return con.execute(f"SELECT * FROM postgres_query('pg', '{sql.replace(chr(39), chr(39) * 2)}')").fetchall()


COUNTRY_CHANGES = f"""
    select
      count(*) filter (where c.id is null) as new,
      count(*) filter (
        where c.id is not null
          and (c.name is distinct from s.name or c.boundary::text is distinct from s.boundary::text)
      ) as changed,
      count(*) as total
    from {STAGING_SCHEMA}.countries as s
    left join public.countries as c on c.iso_code = s.iso_code
"""

CITY_CHANGES = f"""
    select
      count(*) filter (where c.id is null) as new,
      count(*) filter (
        where c.id is not null
          and (
            c.name is distinct from s.name
            or c.state is distinct from s.state
            or c.boundary::text is distinct from s.boundary::text
          )
      ) as changed,
      count(*) as total
    from {STAGING_SCHEMA}.cities as s
    left join public.cities as c on c.gers_id = s.gers_id
"""

# O "where" do conflito evita regravar o que não mudou, para o updated_at continuar verdadeiro.
UPSERT_COUNTRIES = f"""
    insert into public.countries (iso_code, name, boundary)
    select iso_code, name, boundary from {STAGING_SCHEMA}.countries
    on conflict (iso_code) do update
      set name = excluded.name, boundary = excluded.boundary
      where public.countries.name is distinct from excluded.name
         or public.countries.boundary::text is distinct from excluded.boundary::text
"""

UPSERT_CITIES = f"""
    insert into public.cities (gers_id, name, state, country_id, boundary)
    select s.gers_id, s.name, s.state, brazil.id, s.boundary
    from {STAGING_SCHEMA}.cities as s
    cross join (select id from public.countries where iso_code = 'BR') as brazil
    on conflict (gers_id) do update
      set name = excluded.name, state = excluded.state, boundary = excluded.boundary
      where public.cities.name is distinct from excluded.name
         or public.cities.state is distinct from excluded.state
         or public.cities.boundary::text is distinct from excluded.boundary::text
"""


def add_boundary_column(con: duckdb.DuckDBPyConnection, table: str) -> None:
    run_remote(con, f"alter table {STAGING_SCHEMA}.{table} add column boundary extensions.geography(MultiPolygon, 4326)")
    run_remote(
        con,
        f"""
        update {STAGING_SCHEMA}.{table}
        set boundary = extensions.ST_Multi(extensions.ST_GeomFromWKB(wkb, 4326))::extensions.geography
        """,
    )


def redact_credentials(message: str) -> str:
    """Tira usuário e senha de qualquer URL de banco que apareça numa mensagem de erro."""
    return re.sub(r"://[^@\s\"']+@", "://***@", message)


def attach_database(con: duckdb.DuckDBPyConnection, db_url: str) -> None:
    try:
        con.execute(f"ATTACH '{db_url}' AS pg (TYPE postgres);")
    except duckdb.Error:
        # A mensagem original traz a URL inteira, com a senha. Ela não pode ir para o terminal.
        raise SystemExit("Não consegui conectar ao banco. Confira LUGORA_DB_URL e se o banco está no ar.") from None


def write_to_postgres(
    con: duckdb.DuckDBPyConnection, db_url: str, selection: Selection, snapshot_dir: Path
) -> dict[str, tuple]:
    attach_database(con, db_url)
    try:
        # As tabelas de passagem ficam fora do public e somem no final, mesmo se der erro.
        run_remote(con, f"drop schema if exists {STAGING_SCHEMA} cascade")
        run_remote(con, f"create schema {STAGING_SCHEMA}")
        con.execute("CALL postgres_clear_cache()")

        con.execute("CREATE TEMP TABLE selected (gers_id VARCHAR, name VARCHAR, state VARCHAR)")
        con.executemany(
            "INSERT INTO selected VALUES (?, ?, ?)",
            [(city.division_id, city.name, city.state) for city in selection.cities],
        )

        print("Enviando os dados para o banco...")
        countries_path = (snapshot_dir / "paises.parquet").as_posix()
        localities_path = (snapshot_dir / "localidades_br.parquet").as_posix()
        con.execute(f"""
            CREATE TABLE pg.{STAGING_SCHEMA}.countries AS
            SELECT iso_code, name, ST_AsWKB(geometry) AS wkb
            FROM read_parquet('{countries_path}')
        """)
        con.execute(f"""
            CREATE TABLE pg.{STAGING_SCHEMA}.cities AS
            SELECT s.gers_id, s.name, s.state, ST_AsWKB(l.geometry) AS wkb
            FROM selected AS s
            JOIN read_parquet('{localities_path}') AS l ON l.division_id = s.gers_id
        """)
        add_boundary_column(con, "countries")
        add_boundary_column(con, "cities")

        changes = {
            "países": query_remote(con, COUNTRY_CHANGES)[0],
            "cidades": query_remote(con, CITY_CHANGES)[0],
        }

        print("Atualizando as tabelas...")
        run_remote(con, UPSERT_COUNTRIES)
        run_remote(con, UPSERT_CITIES)
        return changes
    finally:
        run_remote(con, f"drop schema if exists {STAGING_SCHEMA} cascade")


REPORT = """
    with brazil as (select id, boundary from public.countries where iso_code = 'BR'),
    br_cities as (select c.* from public.cities as c join brazil on c.country_id = brazil.id)
    select
      (select count(*) from public.countries) as countries,
      (select count(*) from br_cities) as cities,
      (select count(*) from (select name, state from br_cities group by 1, 2 having count(*) > 1) as d) as repeated,
      (select round((extensions.ST_Area(boundary) / 1e6)::numeric, 1) from br_cities where name = 'Juiz de Fora' and state = 'MG') as jf_km2,
      (select round((sum(extensions.ST_Area(boundary)) / 1e6)::numeric) from br_cities) as cities_km2,
      (select round((extensions.ST_Area(boundary) / 1e6)::numeric) from brazil) as brazil_km2,
      pg_size_pretty(pg_total_relation_size('public.countries')) as countries_size,
      pg_size_pretty(pg_total_relation_size('public.cities')) as cities_size
"""


def print_report(con: duckdb.DuckDBPyConnection, selection: Selection, changes: dict[str, tuple], started: float) -> None:
    countries, cities, repeated, jf_km2, cities_km2, brazil_km2, countries_size, cities_size = query_remote(con, REPORT)[0]

    print("\n── Esta execução ──")
    for label, (new, changed, total) in changes.items():
        print(f"{label}: {new} novos, {changed} alterados, {total - new - changed} iguais")
    print(f"Localidades do Overture fora da lista do IBGE (distritos, povoados): {selection.discarded}")
    if selection.missing:
        print(f"ATENÇÃO: {len(selection.missing)} municípios do IBGE sem polígono: {selection.missing}")

    print("\n── O que está no banco ──")
    print(f"Países: {countries} ({countries_size})")
    print(f"Cidades do Brasil: {cities} ({cities_size})")
    print(f"Cidades com o mesmo nome e UF: {repeated}")
    print(f"Juiz de Fora: {jf_km2} km² (área oficial: cerca de 1.435 km²)")
    print(f"Soma das cidades: {cities_km2} km² · Brasil no Overture: {brazil_km2} km²")
    print(f"\nTempo: {time.time() - started:.0f} s")
    print("Limites © OpenStreetMap contributors (ODbL), via Overture Maps Foundation. Municípios: IBGE.")


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--release", default=DEFAULT_RELEASE)
    parser.add_argument("--atualizar", action="store_true", help="baixa de novo, mesmo com cópia local")
    args = parser.parse_args()

    load_dotenv(BASE_DIR / ".env")
    db_url = os.environ.get("LUGORA_DB_URL")
    if not db_url:
        raise SystemExit("Defina LUGORA_DB_URL em pipelines/overture/.env (veja o .env.example).")

    started = time.time()
    con = connect()
    snapshot_dir = DATA_DIR / f"divisoes-{args.release}"
    complete = (snapshot_dir / "paises.parquet").exists() and (snapshot_dir / "localidades_br.parquet").exists()
    if args.atualizar or not complete:
        download_snapshot(con, args.release, snapshot_dir)
    else:
        print(f"Usando a cópia local da release {args.release}.")

    municipalities = load_ibge(refresh=args.atualizar)
    selection = select_municipalities(read_localities(con, snapshot_dir), municipalities)
    print(f"Municípios do IBGE: {len(municipalities)} · com polígono: {len(selection.cities)}")

    try:
        changes = write_to_postgres(con, db_url, selection, snapshot_dir)
        print_report(con, selection, changes, started)
    except duckdb.Error as error:
        # Se a conexão cair no meio da carga, a mensagem original traz a URL com a senha.
        raise SystemExit(f"A gravação no banco falhou: {redact_credentials(str(error))}") from None


if __name__ == "__main__":
    main()
