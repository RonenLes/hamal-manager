import json
import os
import re


def analyze_cargo_description(description: str) -> dict:
    openai_key = os.getenv("OPENAI_API_KEY", "")

    if openai_key and not openai_key.startswith("sk-your"):
        try:
            import httpx

            response = httpx.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-3.5-turbo",
                    "messages": [
                        {
                            "role": "system",
                            "content": (
                                "You are a logistics assistant. Extract cargo "
                                "specifications from the user's description and "
                                "return a JSON object with exactly these keys: "
                                "volume_liters (float), weight_kg (float), "
                                "requires_cooling (bool). If a value is not "
                                "mentioned, make a reasonable estimate. Return "
                                "ONLY valid JSON, no markdown."
                            ),
                        },
                        {"role": "user", "content": description},
                    ],
                    "temperature": 0.2,
                },
                timeout=15.0,
            )
            response.raise_for_status()
            data = response.json()
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
            return {
                "source": "openai",
                "cargo": {
                    "volume_liters": float(parsed.get("volume_liters", 0)),
                    "weight_kg": float(parsed.get("weight_kg", 0)),
                    "requires_cooling": bool(parsed.get("requires_cooling", False)),
                },
                "raw_response": content,
            }
        except Exception:
            pass

    return {
        "source": "mock_parser",
        "cargo": mock_parse_cargo(description),
        "note": "Parsed using regex fallback (no OpenAI key configured)",
    }


def mock_parse_cargo(description: str) -> dict:
    text = description.lower()

    weight_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:kg|kilo(?:gram)?s?|pounds?|lbs?)", text
    )
    weight = float(weight_match.group(1)) if weight_match else 10.0

    if weight_match and any(unit in weight_match.group(0) for unit in ("pound", "lb")):
        weight *= 0.4536

    volume_match = re.search(
        r"(\d+(?:\.\d+)?)\s*(?:l(?:iter|itre)?s?|gallon)", text
    )
    volume = float(volume_match.group(1)) if volume_match else 50.0

    cooling_keywords = {
        "cold",
        "frozen",
        "refrigerat",
        "chill",
        "cool",
        "perishable",
        "vaccine",
        "ice",
    }
    requires_cooling = any(keyword in text for keyword in cooling_keywords)

    return {
        "volume_liters": round(volume, 2),
        "weight_kg": round(weight, 2),
        "requires_cooling": requires_cooling,
    }
