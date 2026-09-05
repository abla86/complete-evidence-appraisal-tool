from fastapi.testclient import TestClient

from main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_random_effects():
    response = client.post(
        "/meta/random-effects",
        json={
            "studies": [
                {"study_id": "s1", "effect": 0.20, "standard_error": 0.10},
                {"study_id": "s2", "effect": 0.40, "standard_error": 0.15},
                {"study_id": "s3", "effect": 0.10, "standard_error": 0.12},
            ]
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["model"] == "DerSimonian-Laird random-effects"
    assert body["studies"] == 3
    assert len(body["ci95"]) == 2
