from pathlib import Path
import csv

CSV_PATH = Path(__file__).with_name("cities_streets.csv")

CITY_COLUMNS = ("city", "city_name_he", "city_name_en", "שם_ישוב", "שם ישוב")
STREET_COLUMNS = ("street", "street_name_he", "street_name_en", "שם_רחוב", "שם רחוב")
CSV_ENCODINGS = ("utf-8-sig", "cp1255")

def load_locations():
    for encoding in CSV_ENCODINGS:
        try:
            with CSV_PATH.open("r", encoding=encoding, newline="") as file:
                reader = csv.DictReader(file)
                return list(reader)
        except UnicodeDecodeError:
            continue

    with CSV_PATH.open("r", encoding=CSV_ENCODINGS[-1], errors="replace", newline="") as file:
        reader = csv.DictReader(file)
        return list(reader)


def _first_value(row: dict, columns: tuple[str, ...]) -> str:
    for column in columns:
        value = row.get(column)
        if value and value.strip():
            return value.strip()

    return ""


def list_cities() -> list[str]:
    return sorted({
        city
        for row in load_locations()
        if (city := _first_value(row, CITY_COLUMNS))
    })


def list_streets(city: str) -> list[str]:
    normalized_city = city.strip()
    return sorted({
        street
        for row in load_locations()
        if _first_value(row, CITY_COLUMNS) == normalized_city
        if (street := _first_value(row, STREET_COLUMNS))
    })
