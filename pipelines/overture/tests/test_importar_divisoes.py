"""Regras de seleção de cidades. Os nomes e as áreas vêm de casos reais do Overture e do IBGE."""

import gzip
import json

import pytest

from importar_divisoes import (
    Locality,
    decode_response,
    normalize_name,
    parse_ibge,
    select_municipalities,
    state_from_region,
)


def locality(name: str, state: str, area_km2: float = 100.0, division_id: str = "") -> Locality:
    return Locality(division_id or f"{name}-{state}-{area_km2}", name, state, area_km2)


def test_normalize_ignores_accents_case_and_punctuation():
    assert normalize_name("São João del-Rei") == normalize_name("SAO JOAO DEL REI")
    assert normalize_name("Alta Floresta D'Oeste") == "alta floresta d oeste"
    assert normalize_name("  Juiz  de Fora ") == "juiz de fora"


def test_state_from_region_drops_the_country_prefix():
    assert state_from_region("BR-MG") == "MG"


def test_only_official_municipalities_stay():
    selection = select_municipalities(
        [locality("Juiz de Fora", "MG"), locality("Povoado Lago Novo", "AM"), locality("Plano Piloto", "DF")],
        [("Juiz de Fora", "MG")],
    )

    assert [city.name for city in selection.cities] == ["Juiz de Fora"]
    assert selection.discarded == 2


def test_district_with_the_municipality_name_loses_to_the_largest_polygon():
    selection = select_municipalities(
        [
            locality("Pedra Branca", "CE", 0.1, "distrito"),
            locality("Pedra Branca", "CE", 1328.8, "municipio"),
        ],
        [("Pedra Branca", "CE")],
    )

    assert [city.division_id for city in selection.cities] == ["municipio"]
    assert selection.discarded == 1


def test_same_name_in_another_state_is_another_city():
    selection = select_municipalities(
        [locality("Santana", "BA", 1907.9, "ba"), locality("Santana", "AP", 1579.0, "ap")],
        [("Santana", "BA"), ("Santana", "AP")],
    )

    assert {(city.state, city.division_id) for city in selection.cities} == {("BA", "ba"), ("AP", "ap")}


def test_city_keeps_the_official_ibge_spelling():
    selection = select_municipalities([locality("SAO PAULO", "SP")], [("São Paulo", "SP")])

    assert selection.cities[0].name == "São Paulo"


@pytest.mark.parametrize(
    ("ibge_name", "state", "overture_name"),
    [
        ("Brasília", "DF", "Plano Piloto"),
        ("Major Isidoro", "AL", "Major Izidoro"),
        ("São Caitano", "PE", "São Caetano"),
    ],
)
def test_alias_finds_a_name_spelled_differently(ibge_name, state, overture_name):
    selection = select_municipalities([locality(overture_name, state)], [(ibge_name, state)])

    assert selection.cities[0].name == ibge_name
    assert selection.missing == []


def test_aliases_of_one_state_do_not_apply_to_another():
    # O IBGE escreve Santa Teresinha na PB e Santa Terezinha na BA; o Overture, o contrário.
    selection = select_municipalities(
        [locality("Santa Terezinha", "PB", division_id="pb"), locality("Santa Teresinha", "BA", division_id="ba")],
        [("Santa Teresinha", "PB"), ("Santa Terezinha", "BA")],
    )

    assert {(city.name, city.state, city.division_id) for city in selection.cities} == {
        ("Santa Teresinha", "PB", "pb"),
        ("Santa Terezinha", "BA", "ba"),
    }


def test_municipality_without_polygon_is_reported():
    selection = select_municipalities([], [("Cidade Nova", "MG")])

    assert selection.cities == []
    assert selection.missing == [("Cidade Nova", "MG")]


def test_decode_response_handles_plain_and_compressed_text():
    text = '[{"municipio-nome": "São Paulo"}]'

    assert decode_response(text.encode("utf-8")) == text
    assert decode_response(gzip.compress(text.encode("utf-8"))) == text


def test_parse_ibge_reads_name_and_state():
    municipalities = [{"municipio-nome": f"Cidade {i}", "UF-sigla": "MG"} for i in range(5000)]

    assert parse_ibge(json.dumps(municipalities))[0] == ("Cidade 0", "MG")


def test_parse_ibge_rejects_a_truncated_list():
    with pytest.raises(ValueError, match="só 1 municípios"):
        parse_ibge(json.dumps([{"municipio-nome": "Cidade", "UF-sigla": "MG"}]))
