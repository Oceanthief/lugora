"""O que os pipelines compartilham: comparar nomes e escrever no Postgres."""

from __future__ import annotations

import re
import unicodedata

import duckdb

STAGING_SCHEMA = "pipeline_staging"


def normalize_name(name: str) -> str:
    """Ignora acentos, maiúsculas e pontuação ao comparar nomes."""
    ascii_name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", " ", ascii_name.lower()).strip()


def redact_credentials(message: str, db_url: str) -> str:
    """Tira a conexão com o banco de uma mensagem de erro, porque ela traz a senha."""
    # Erro de conexão repete a conexão inteira, que pode vir em mais de um formato.
    if "Unable to connect" in message:
        return "a conexão com o banco caiu."
    return re.sub(r"://[^@\s\"']+@", "://***@", message.replace(db_url, "***"))


def attach_database(con: duckdb.DuckDBPyConnection, db_url: str) -> None:
    try:
        con.execute(f"ATTACH '{db_url}' AS pg (TYPE postgres);")
    except duckdb.Error:
        # A mensagem original traz a URL inteira, com a senha. Ela não pode ir para o terminal.
        raise SystemExit("Não consegui conectar ao banco. Confira LUGORA_DB_URL e se o banco está no ar.") from None


def run_remote(con: duckdb.DuckDBPyConnection, sql: str) -> None:
    con.execute(f"CALL postgres_execute('pg', '{sql.replace(chr(39), chr(39) * 2)}')")


def query_remote(con: duckdb.DuckDBPyConnection, sql: str) -> list[tuple]:
    return con.execute(f"SELECT * FROM postgres_query('pg', '{sql.replace(chr(39), chr(39) * 2)}')").fetchall()
