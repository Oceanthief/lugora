"""Limpeza (D3) e deduplicação (D4), com os casos reais do diagnóstico de Juiz de Fora."""

import duckdb
import pytest

from importar_lugares import (
    CategoryRule,
    Place,
    RawPlace,
    classify,
    deduplicate,
    distance_m,
    impossible_category_items,
    nearby_pairs,
    review_pairs,
)

RULES = {
    "restaurant": CategoryRule("restaurant", "food_and_drink", True, False),
    "historic_site": CategoryRule("historic_site", "culture", True, False),
    "park": CategoryRule("park", "outdoors", True, False),
    "hospital": CategoryRule("hospital", "health", False, True),
    "dental_clinic": CategoryRule("dental_clinic", "health", False, True),
}


def raw(gers_id, name, category="restaurant", confidence=0.5, lat=-21.76, lng=-43.35, sources=("meta",), address="Rua A, 1"):
    return RawPlace(gers_id, name, category, confidence, lat, lng, address, None, sources)


def clean(*items):
    return [classify(item, RULES) for item in items]


@pytest.fixture
def con():
    connection = duckdb.connect()
    yield connection
    connection.close()


# ─── D1: nada é descartado pela confiança ────────────────────────────────────
def test_santiago_lanches_enters_without_category_and_with_low_confidence():
    # Caso real: aberto, sem categoria e com confiança 0,29.
    place = classify(raw("a", "Santiago Lanches", category=None, confidence=0.29), RULES)

    assert place.category is None
    assert place.is_visitable is True
    assert deduplicate([place]) == [place]


def test_very_low_confidence_stays_in_the_base():
    assert len(deduplicate(clean(raw("a", "Boteco de Bairro", confidence=0.05)))) == 1


# ─── D3: limpeza ─────────────────────────────────────────────────────────────
@pytest.mark.parametrize(
    "name",
    ["Condomínio", "Condomínio do Edifício São Lucas", "CONDOMINIO VILA RICA", "Edifício Brumado", "Residencial Solar", "Conjunto Residencial Bandeirantes"],
)
def test_residential_names_are_not_visitable(name):
    # Caso real: 248 "locais históricos" são quase todos condomínios, e um "Condomínio" aparece como parque.
    place = classify(raw("a", name, category="historic_site"), RULES)

    assert place.category == "residential"
    assert place.is_visitable is False


def test_word_inside_another_word_is_not_residential():
    assert classify(raw("a", "Bar do Residenciano"), RULES).category == "restaurant"


def test_sensitive_place_stays_sensitive_even_with_a_residential_name():
    # A proteção de privacidade vale mais que a limpeza do nome.
    place = classify(raw("a", "Edifício das Clínicas", category="dental_clinic"), RULES)

    assert place.category == "residential"
    assert place.is_sensitive is True


def test_type_outside_the_map_stays_findable_but_not_visitable():
    place = classify(raw("a", "Auto escola Brasília", category="specialty_school"), RULES)

    assert place.category is None
    assert place.is_visitable is False


def test_sensitive_category_is_marked_and_not_visitable():
    place = classify(raw("a", "Hospital Monte Sinai", category="hospital"), RULES)

    assert (place.category, place.is_visitable, place.is_sensitive) == ("hospital", False, True)


def test_visitable_category_is_mapped():
    place = classify(raw("a", "Poleiro do Galo"), RULES)

    assert (place.category, place.is_visitable, place.is_sensitive) == ("restaurant", True, False)


def test_beach_in_a_city_without_coast_goes_to_review():
    # Caso real: páginas sobre praias de outras cidades aparecem localizadas em Juiz de Fora.
    places = clean(raw("a", "Praia de Búzios", category="beach"), raw("b", "Poleiro do Galo"))

    items = impossible_category_items(places)

    assert [item.gers_id_a for item in items] == ["a"]
    assert places[0].is_visitable is False


# ─── D4: deduplicação ────────────────────────────────────────────────────────
def test_two_viva_gula_at_the_same_point_become_one():
    # Caso real: mesmo ponto, mesmo endereço, confianças 0,41 e 0,39.
    result = deduplicate(clean(
        raw("menor", "Viva Gula", confidence=0.39, lat=-21.75802, lng=-43.35133),
        raw("maior", "Viva Gula", confidence=0.41, lat=-21.75802, lng=-43.35133),
    ))

    assert [p.raw.gers_id for p in result] == ["maior"]
    assert result[0].merged_gers_ids == ("menor",)


def test_two_poleiro_do_galo_stay_separate():
    # Caso real: duas unidades, a cerca de 2,5 km uma da outra.
    first = raw("a", "Poleiro do Galo", lat=-21.75152, lng=-43.36143)
    second = raw("b", "Poleiro do Galo", lat=-21.77204, lng=-43.3523)

    assert 2400 < distance_m(first, second) < 2600
    assert [p.raw.gers_id for p in deduplicate(clean(first, second))] == ["a", "b"]


def test_similar_names_nearby_do_not_merge_on_their_own():
    # Caso real: 35 m um do outro, nomes parecidos, e são escolas diferentes.
    result = deduplicate(clean(
        raw("a", "Auto escola Brasília", category="specialty_school", lat=-21.76316, lng=-43.34471),
        raw("b", "Auto Escola Transitar", category="specialty_school", lat=-21.763, lng=-43.34441),
    ))

    assert [p.raw.gers_id for p in result] == ["a", "b"]


def test_name_comparison_ignores_accents_case_and_punctuation():
    result = deduplicate(clean(
        raw("a", "Café do Zé", lat=-21.76, lng=-43.35),
        raw("b", "CAFE DO ZE!", lat=-21.76, lng=-43.35),
    ))

    assert len(result) == 1


def test_identical_name_just_over_the_limit_stays_separate():
    first = raw("a", "Farmácia Central", lat=-21.76, lng=-43.35)
    second = raw("b", "Farmácia Central", lat=-21.76046, lng=-43.35)  # cerca de 51 m

    assert distance_m(first, second) > 50
    assert len(deduplicate(clean(first, second))) == 2


def test_identical_name_just_under_the_limit_merges():
    first = raw("a", "Farmácia Central", lat=-21.76, lng=-43.35)
    second = raw("b", "Farmácia Central", lat=-21.76044, lng=-43.35)  # cerca de 49 m

    assert distance_m(first, second) < 50
    assert len(deduplicate(clean(first, second))) == 1


def test_main_record_has_more_sources_then_higher_confidence():
    many_sources = raw("fontes", "Bar", confidence=0.2, sources=("meta", "foursquare"))
    high_confidence = raw("confianca", "Bar", confidence=0.9, sources=("meta",))
    assert deduplicate(clean(many_sources, high_confidence))[0].raw.gers_id == "fontes"

    tie_a = raw("confianca", "Bar", confidence=0.9)
    tie_b = raw("menor", "Bar", confidence=0.2)
    assert deduplicate(clean(tie_b, tie_a))[0].raw.gers_id == "confianca"


def test_merge_keeps_every_gers_for_the_next_monthly_import():
    result = deduplicate(clean(
        raw("c", "Bar", confidence=0.9),
        raw("a", "Bar", confidence=0.1),
        raw("b", "Bar", confidence=0.2),
    ))

    assert result[0].raw.gers_id == "c"
    assert result[0].merged_gers_ids == ("a", "b")


def test_merge_never_loses_the_sensitive_mark():
    result = deduplicate(clean(
        raw("a", "Clínica Vida", category=None, confidence=0.9),
        raw("b", "Clínica Vida", category="hospital", confidence=0.1),
    ))

    assert len(result) == 1
    assert result[0].is_sensitive is True


def test_merge_fills_a_missing_address_from_the_other_record():
    result = deduplicate(clean(
        raw("a", "Bar", confidence=0.9, address=None),
        raw("b", "Bar", confidence=0.1, address="Rua B, 2"),
    ))

    assert result[0].raw.address == "Rua B, 2"


def test_chain_of_nearby_records_becomes_one_place():
    # A está a menos de 50 m de B, e B a menos de 50 m de C, embora A e C fiquem mais longe.
    result = deduplicate(clean(
        raw("a", "Bar", lat=-21.7600, lng=-43.35),
        raw("b", "Bar", lat=-21.7604, lng=-43.35),
        raw("c", "Bar", lat=-21.7608, lng=-43.35),
    ))

    assert len(result) == 1


def test_result_does_not_depend_on_the_input_order():
    items = [
        raw("c", "Viva Gula", confidence=0.4),
        raw("a", "Viva Gula", confidence=0.4),
        raw("b", "Poleiro do Galo", lat=-21.75),
    ]

    assert deduplicate(clean(*items)) == deduplicate(clean(*reversed(items)))


def test_nearby_pairs_finds_neighbors_across_grid_cells():
    # Pontos a poucos metros, um de cada lado da fronteira de uma célula da grade.
    places = clean(raw("a", "A", lat=-21.75000, lng=-43.35), raw("b", "B", lat=-21.75001, lng=-43.35))

    assert [(i, j) for i, j, _ in nearby_pairs(places, 50)] == [(0, 1)]


# ─── D4: fila de revisão ─────────────────────────────────────────────────────
def test_nave_estudio_and_nave_studio_go_to_review_without_merging(con):
    # Caso real: mesmo endereço, nomes quase iguais. Só uma pessoa decide.
    places = clean(
        raw("a", "Nave Estúdio", category="media_service", lat=-21.80073, lng=-43.39934),
        raw("b", "NAVE Studio", category="media_service", lat=-21.80073, lng=-43.39934),
    )

    assert len(deduplicate(places)) == 2
    items = review_pairs(con, places)
    assert [(item.gers_id_a, item.gers_id_b) for item in items] == [("a", "b")]
    # Dá 0,983: acima da faixa citada na D4, mas é o exemplo dela, e só a igualdade exata mescla.
    assert items[0].similarity > 0.97


def test_auto_escola_pair_goes_to_review_but_stays_separate(con):
    # Caso real: dá 0,93 a 35 m. A pessoa que revisar decide, e até lá são dois lugares.
    places = clean(
        raw("a", "Auto escola Brasília", category="specialty_school", lat=-21.76316, lng=-43.34471),
        raw("b", "Auto Escola Transitar", category="specialty_school", lat=-21.763, lng=-43.34441),
    )

    assert len(deduplicate(places)) == 2
    assert [item.similarity for item in review_pairs(con, places)] == [pytest.approx(0.932, abs=0.001)]


def test_similar_names_in_different_groups_do_not_go_to_review(con):
    places = clean(
        raw("a", "Nave Estúdio", category="restaurant"),
        raw("b", "NAVE Studio", category="hospital"),
    )

    assert review_pairs(con, places) == []


def test_similar_names_far_apart_do_not_go_to_review(con):
    places = clean(
        raw("a", "Nave Estúdio", category="media_service", lat=-21.76),
        raw("b", "NAVE Studio", category="media_service", lat=-21.77),
    )

    assert review_pairs(con, places) == []


def test_review_without_candidates_does_not_query(con):
    assert review_pairs(con, []) == []


def test_place_never_carries_contact_fields():
    # Minimização (LGPD): os registros não têm onde guardar telefone nem e-mail.
    fields = set(RawPlace.__dataclass_fields__) | set(Place.__dataclass_fields__)

    assert not {"phone", "phones", "email", "emails", "telefone"} & fields
