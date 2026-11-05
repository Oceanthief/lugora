"""Limpeza (D3) e deduplicação (D4), com os casos reais do diagnóstico de Juiz de Fora."""

import duckdb
import pytest

import importar_lugares
from importar_lugares import (
    DIFFERENT_PLACES,
    EXISTS_IN_CITY,
    NOT_IN_CITY,
    SAME_PLACE,
    CategoryRule,
    Decision,
    Place,
    RawPlace,
    classify,
    clean_address,
    clean_postal_code,
    decision_from_text,
    deduplicate,
    distance_m,
    has_contact,
    impossible_category_items,
    merge_decisions,
    nearby_pairs,
    not_in_city_ids,
    pair_key,
    parse_queue_decisions,
    read_decisions,
    read_snapshot,
    read_spreadsheet_text,
    review_pairs,
    write_decisions,
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


# ─── Revisão manual: as decisões do Victor valem e não se perdem ─────────────
QUEUE = (
    "motivo;gers_a;nome_a;gers_b;nome_b;distancia_m;similaridade;REVISÃO\n"
    "nome parecido;a;Nave Estúdio;b;NAVE Studio;0.0;0.983;São a mesma coisa\n"
    "nome parecido;c;Livraria Flamingo;d;Livraria Camões;19.1;0.901;São lojas diferentes\n"
    "praia;e;Buzios - Rio De Janeiro;;;;;Não tem praia em Juiz de Fora\n"
    "nome parecido;f;Pendente;g;Pendente 2;1.0;0.95;\n"
)


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("São a mesma coisa", SAME_PLACE),
        ("sao a MESMA COISA", SAME_PLACE),
        ("São lojas diferentes", DIFFERENT_PLACES),
        ("Não tem praia em Juiz de Fora", NOT_IN_CITY),
        ("Não existe", NOT_IN_CITY),
        ("Existe", EXISTS_IN_CITY),
        ("", None),
        ("   ", None),
    ],
)
def test_review_text_is_understood(text, expected):
    assert decision_from_text(text) == expected


def test_queue_decisions_are_read_and_blank_rows_stay_pending():
    assert parse_queue_decisions(QUEUE) == [
        Decision("a", "b", SAME_PLACE),
        Decision("c", "d", DIFFERENT_PLACES),
        Decision("e", "", NOT_IN_CITY),
    ]


def test_queue_without_the_review_column_has_no_decisions():
    assert parse_queue_decisions("motivo;gers_a;nome_a;gers_b\nx;a;A;b\n") == []


def test_answer_that_cannot_be_understood_stops_before_anything_is_lost():
    queue = "motivo;gers_a;nome_a;gers_b;REVISÃO\nx;a;A;b;Talvez\n"

    with pytest.raises(SystemExit, match="Linha 2.*Talvez"):
        parse_queue_decisions(queue)


def test_spreadsheet_is_readable_in_either_encoding(tmp_path):
    utf8 = tmp_path / "utf8.csv"
    utf8.write_bytes("REVISÃO".encode("utf-8-sig"))
    excel = tmp_path / "excel.csv"
    excel.write_bytes("REVISÃO".encode("cp1252"))

    assert read_spreadsheet_text(utf8) == "REVISÃO"
    assert read_spreadsheet_text(excel) == "REVISÃO"
    assert read_spreadsheet_text(tmp_path / "nao-existe.csv") == ""


def test_decisions_survive_a_round_trip_through_the_versioned_file(tmp_path):
    path = tmp_path / "decisoes.csv"
    decisions = [Decision("b", "a", SAME_PLACE), Decision("e", "", NOT_IN_CITY)]

    write_decisions(path, decisions)

    assert read_decisions(path) == [Decision("a", "b", SAME_PLACE), Decision("e", "", NOT_IN_CITY)]
    assert read_decisions(tmp_path / "nao-existe.csv") == []


def test_versioned_file_holds_only_identifiers_and_decisions(tmp_path):
    # A base tem nomes de profissionais autônomos e não pode entrar no repositório.
    path = tmp_path / "decisoes.csv"

    write_decisions(path, parse_queue_decisions(QUEUE))

    content = path.read_text(encoding="utf-8")
    assert content.splitlines()[0] == "gers_a;gers_b;decisao"
    assert "Nave" not in content and "Livraria" not in content and "Buzios" not in content


def test_newer_decision_about_the_same_pair_wins_in_any_order():
    merged = merge_decisions([Decision("a", "b", DIFFERENT_PLACES)], [Decision("b", "a", SAME_PLACE)])

    assert merged == [Decision("b", "a", SAME_PLACE)]
    assert pair_key("b", "a") == pair_key("a", "b")


def test_pair_marked_as_the_same_place_merges(con):
    # Caso real: "Nave Estúdio" × "NAVE Studio". O principal é o de maior confiança.
    places = clean(
        raw("a", "Nave Estúdio", category="media_service", confidence=0.36, lat=-21.80073, lng=-43.39934),
        raw("b", "NAVE Studio", category="media_service", confidence=0.68, lat=-21.80073, lng=-43.39934),
    )
    decisions = [Decision("a", "b", SAME_PLACE)]

    result = deduplicate(places, decisions)

    assert [p.raw.name for p in result] == ["NAVE Studio"]
    assert result[0].merged_gers_ids == ("a",)
    assert review_pairs(con, result, decisions) == []


def test_pair_marked_as_different_stays_separate_and_leaves_the_queue(con):
    # Caso real, com nomes fictícios: dois consultórios a 12 m, com nomes parecidos.
    places = clean(
        raw("a", "Consultorio Odontologico Dra. Fulana", category="media_service"),
        raw("b", "Consultorio Odontologico Dra. Fulano", category="media_service"),
    )
    decisions = [Decision("b", "a", DIFFERENT_PLACES)]

    assert review_pairs(con, places) != []
    assert review_pairs(con, places, decisions) == []
    assert len(deduplicate(places, decisions)) == 2


def test_absorbed_name_stays_available_for_the_search():
    # Caso real: quem digita "Posto Rumo Certo" precisa achar o "POSTO TOP CENTRO" (D1).
    places = clean(
        raw("a", "Posto Rumo Certo", confidence=0.3),
        raw("b", "POSTO TOP CENTRO", confidence=0.9),
    )

    result = deduplicate(places, [Decision("a", "b", SAME_PLACE)])

    assert result[0].raw.name == "POSTO TOP CENTRO"
    assert result[0].other_names == ("Posto Rumo Certo",)


def test_identical_name_does_not_become_another_name():
    result = deduplicate(clean(raw("a", "Viva Gula", confidence=0.4), raw("b", "VIVA GULA!", confidence=0.3)))

    assert result[0].other_names == ()


def test_place_confirmed_as_real_stays_in_the_search_and_leaves_the_queue():
    # Caso real: "Praia do Norte JF" são quadras de areia em Benfica, com a categoria errada no Overture.
    places = clean(raw("n", "Praia do Norte JF - Quadras de Areia em Benfica", category="beach"))
    decisions = [Decision("n", "", EXISTS_IN_CITY)]

    assert impossible_category_items(places, decisions) == []
    assert not_in_city_ids(decisions) == set()


def test_decision_about_a_record_that_left_the_base_is_ignored():
    places = clean(raw("a", "Bar"))

    assert deduplicate(places, [Decision("a", "sumiu", SAME_PLACE)]) == places


def test_place_marked_as_not_in_the_city_leaves_the_queue_and_is_listed():
    places = clean(raw("e", "Buzios - Rio De Janeiro", category="beach"), raw("f", "Praia Grande", category="beach"))
    decisions = [Decision("e", "", NOT_IN_CITY)]

    assert [item.gers_id_a for item in impossible_category_items(places, decisions)] == ["f"]
    assert not_in_city_ids(decisions) == {"e"}


def test_place_never_carries_contact_fields():
    # Minimização (LGPD): os registros não têm onde guardar telefone nem e-mail.
    fields = set(RawPlace.__dataclass_fields__) | set(Place.__dataclass_fields__)

    assert not {"phone", "phones", "email", "emails", "telefone"} & fields


# ─── Contatos no texto livre: os formatos são os da base, com dados fictícios ──
@pytest.mark.parametrize(
    "address",
    [
        "Bar (32)98888-7777 - R. Fictícia, 45",
        "Bar ( 32 - 98888.7777",
        "Bar ( 31 - 98888-7777, R. Fictícia, 72",
        "+55 32 - R. A. Fictícia, 10 - 98888-7777",
        "R. Fictícia, 15, Centro, 32 - 98888,7777",
        "R. Fictícia, 55, Tel:, 98888-7777",
        "R. Fictícia, 84 - 3212-3456",
        "Tel 3212-3456 - Rua Fictícia, 2",
        "Rua Fictícia, 28 - (32) 3012 - 4567",
        "Fone:(83) 98888 - 7777_R. Fictícia, 83",
        "Rua Fictícia 32 30123456",
        "contato.ficticio@example.com",
        "https://maps.app.goo.gl/ficticio - R. Fictícia, 23",
        "www.ficticio.com.br",
        "A&B (55)3100, 0300™R. Fictícia, 19",
        "R. Fictícia, 10 - 3212-3300",
        "R. Fictícia, 10 - 3232-3232",
        "R. Fictícia, 10 3232.3232",
        "R. Fictícia, 10 - 3212 - 3456",
        "R. Fictícia, 10 - 3212/3456",
        "R. Fictícia, 10 - 32123456",
        "R. Fictícia, 10 - 32 3212-3300",
        "R. Fictícia, 10 - 8888-7777",
        "R. Fictícia, 10 - 9988-7766",
        "R. Fictícia, 10 - 9 8888-7777",
        "R. Fictícia, 10 - 32 9 8888 7777",
        "R. Fictícia, 10 - 32988887777",
        "R. Fictícia, 10 - 0800 123 4567",
        "R. Fictícia, 10 - tel 32123",
        "R. Fictícia, 10 - whats 8888",
        "R. Fictícia, 10 - fulano(at)gmail.com",
        "R. Fictícia, 10 - fulano [at] gmail.com",
        "R. Fictícia, 10 - fulano arroba gmail.com",
        "R. Fictícia, 10 - fulano@gmail",
        "R. Fictícia, 10 - gmail.com",
        "R. Fictícia, 10 - instagram.com/fulano",
        "R. Fictícia, 10 - wa.me/553298888",
    ],
)
def test_address_with_a_contact_is_left_out(address):
    assert clean_address(address) is None


@pytest.mark.parametrize(
    "address",
    [
        "R. Fictícia, 1820-1825",
        "R. Fictícia, 2998-3000",
        "R. Fictícia, 5701-5699",
        "R. Fictícia, 1100 - Sala 1801-1803",
        "R. Fictícia, 1100 - 2301-2305",
        "Rua Fictícia, 12 - Centro, Juiz de Fora - MG, 36010000",
        "Rua Fictícia, 12 - Centro, Juiz de Fora - MG, 36010-000",
        "Rua Fictícia (2600) Bloco 1200 A",
        "R. Fictícia, 2300 - Sala 1000 (10° andar)",
        "R. Cel. Vidal, 120",
        "Rua 15 de Novembro, 1200 - Loja 3",
        "Galeria Pio X, Loja 12 - Centro",
    ],
)
def test_address_with_numbers_that_are_not_a_contact_stays(address):
    assert clean_address(address) == address


def test_address_may_be_missing():
    assert clean_address(None) is None
    assert clean_address("") is None


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("36010-000", "36010-000"),
        ("36010000", "36010000"),
        (" 36010-000 ", "36010-000"),
        ("30130-000", "30130-000"),
        ("(32) 3212-3456", None),
        ("3212-3456", None),
        ("32123456", None),
        ("36907000", None),
        ("988887777", None),
        ("Brasil", None),
        ("<<not-applicable>>", None),
        ("", None),
        (None, None),
    ],
)
def test_postal_code_only_keeps_what_looks_like_one(value, expected):
    assert clean_postal_code(value) == expected


@pytest.mark.parametrize("name", ["@bar.ficticio", "Arroba Bar", "Arroba.Carnes", "Celular 24 Horas"])
def test_words_in_a_name_are_not_a_contact(name):
    # Nomes assim existem na base, e um aviso falso a cada importação acabaria ignorado.
    assert has_contact(name) is False


def test_snapshot_reader_leaves_contacts_out(con, tmp_path, monkeypatch, capsys):
    path = tmp_path / "lugares.parquet"
    con.execute(
        f"""
        COPY (
          SELECT * FROM (VALUES
            ('a', 'Bar', 'R. Fictícia, 1 - 98888-7777', '(32) 3212-3456'),
            ('b', 'Café', 'R. Fictícia, 2', '36010-000'),
            ('c', 'Pizzaria 3212-3456', NULL, NULL)
          ) AS t (id, nome, endereco, cep)
          CROSS JOIN (SELECT NULL::VARCHAR AS categoria, 0.5 AS confianca, -21.7 AS lat, -43.3 AS lng, 'meta' AS fontes)
        ) TO '{path.as_posix()}' (FORMAT parquet)
        """
    )
    monkeypatch.setattr(importar_lugares, "ARQ_LUGARES", path)

    places = {place.gers_id: place for place in read_snapshot(con)}
    printed = capsys.readouterr().out

    assert (places["a"].address, places["a"].postal_code) == (None, None)
    assert (places["b"].address, places["b"].postal_code) == ("R. Fictícia, 2", "36010-000")
    assert "deixados de fora por trazerem contato: 1" in printed
    assert "1 nomes parecem trazer um contato" in printed
