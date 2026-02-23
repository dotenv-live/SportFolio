#!/usr/bin/env python3
"""
End-to-end tests for Sport Expansion Strategy APIs.
Run with: python test.py
Requires the server running on localhost:8000 with seeded data.
"""
import json
import sys
import urllib.request
import urllib.error

BASE = "http://localhost:8000"
API = f"{BASE}/api/v1"


def req(method: str, path: str, data=None, token=None):
    url = f"{API}{path}" if not path.startswith("/health") else f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode() if data else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        resp = urllib.request.urlopen(r)
        return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read())


passed = 0
failed = 0


def check(name, condition, detail=""):
    global passed, failed
    if condition:
        print(f"  ✅ {name}")
        passed += 1
    else:
        print(f"  ❌ {name} — {detail}")
        failed += 1


# ──────────────────────────────────────────────
# Auth helpers
# ──────────────────────────────────────────────
def get_tokens():
    _, r = req("POST", "/auth/login", {"email": "admin@sportfolio.io", "password": "admin12345"})
    admin_token = r.get("access_token", "")
    _, r = req("POST", "/auth/login", {"email": "john@example.com", "password": "investor123"})
    inv_token = r.get("access_token", "")
    return admin_token, inv_token


# ──────────────────────────────────────────────
# 1. Sport Config CRUD
# ──────────────────────────────────────────────
def test_sport_crud(admin_token, inv_token):
    print("\n🔹 Sport Config — List defaults")
    s, r = req("GET", "/sports/", token=inv_token)
    check("GET /sports (list)", s == 200 and isinstance(r, list), r)
    check("Default sports seeded (>=4)", len(r) >= 4, f"count={len(r)}")

    # Verify default Football config structure
    football = next((sp for sp in r if sp["name"] == "Football"), None)
    check("Football config exists", football is not None)
    if football:
        check("Football has metrics list", isinstance(football.get("metrics"), list) and len(football["metrics"]) > 0)
        check("Football has phi", "phi" in football)
        check("Football has ai_weights", "ai_weights" in football and "xgb" in football["ai_weights"])

    # Get single sport
    print("\n🔹 Sport Config — Get by ID")
    if football:
        sport_id = football["_id"]
        s, r = req("GET", f"/sports/{sport_id}", token=inv_token)
        check("GET /sports/{id}", s == 200 and r.get("name") == "Football", r)

    # Get non-existent
    s, r = req("GET", "/sports/000000000000000000000000", token=inv_token)
    check("GET /sports/{bad_id} → 404", s == 404, r)

    return football


def test_sport_create(admin_token, inv_token):
    print("\n🔹 Sport Config — Create")

    # Valid new sport
    s, r = req("POST", "/sports/", {
        "name": "Swimming",
        "metrics": [
            {"key": "lap_time", "weight": 0.4, "normalization": "minmax"},
            {"key": "stroke_rate", "weight": 0.3, "normalization": "zscore"},
            {"key": "endurance", "weight": 0.3, "normalization": "log"},
        ],
        "phi": 0.2,
        "ai_weights": {"xgb": 0.7, "lstm": 0.3}
    }, token=admin_token)
    check("POST /sports (valid)", s == 201 and r.get("name") == "Swimming", r)
    swimming_id = r.get("_id")

    # Verify it appears in list
    s, r = req("GET", "/sports/", token=inv_token)
    names = [sp["name"] for sp in r] if isinstance(r, list) else []
    check("Swimming in list", "Swimming" in names, names)

    # Duplicate name → 400
    s, r = req("POST", "/sports/", {
        "name": "Swimming",
        "metrics": [{"key": "x", "weight": 1.0, "normalization": "minmax"}],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=admin_token)
    check("POST /sports (duplicate name) → 400", s == 400, r)

    # Metric weights don't sum to 1 → 422
    s, r = req("POST", "/sports/", {
        "name": "BadSport",
        "metrics": [
            {"key": "a", "weight": 0.3, "normalization": "minmax"},
            {"key": "b", "weight": 0.3, "normalization": "minmax"},
        ],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=admin_token)
    check("POST /sports (weights != 1) → 422", s == 422, r)

    # AI weights don't sum to 1 → 422
    s, r = req("POST", "/sports/", {
        "name": "BadSport2",
        "metrics": [{"key": "a", "weight": 1.0, "normalization": "minmax"}],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.8, "lstm": 0.8}
    }, token=admin_token)
    check("POST /sports (ai_weights != 1) → 422", s == 422, r)

    # Empty metrics → 422
    s, r = req("POST", "/sports/", {
        "name": "EmptySport",
        "metrics": [],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=admin_token)
    check("POST /sports (empty metrics) → 422", s == 422, r)

    # Invalid normalization strategy → 422
    s, r = req("POST", "/sports/", {
        "name": "BadNorm",
        "metrics": [{"key": "x", "weight": 1.0, "normalization": "invalid"}],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=admin_token)
    check("POST /sports (bad normalization) → 422", s == 422, r)

    # RBAC: investor cannot create
    s, r = req("POST", "/sports/", {
        "name": "Hacking",
        "metrics": [{"key": "x", "weight": 1.0, "normalization": "minmax"}],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=inv_token)
    check("POST /sports (investor) → 403", s == 403, r)

    return swimming_id


def test_sport_update(admin_token, inv_token, swimming_id):
    print("\n🔹 Sport Config — Update")

    if not swimming_id:
        print("  ⚠️  Skipping update tests (no swimming_id)")
        return

    # Update phi
    s, r = req("PUT", f"/sports/{swimming_id}", {"phi": 0.5}, token=admin_token)
    check("PUT /sports (update phi)", s == 200 and r.get("phi") == 0.5, r)

    # Update ai_weights
    s, r = req("PUT", f"/sports/{swimming_id}", {
        "ai_weights": {"xgb": 0.4, "lstm": 0.6}
    }, token=admin_token)
    check("PUT /sports (update ai_weights)", s == 200, r)
    if s == 200:
        check("ai_weights updated correctly",
              r.get("ai_weights", {}).get("xgb") == 0.4
              and r.get("ai_weights", {}).get("lstm") == 0.6, r.get("ai_weights"))

    # Update metrics
    s, r = req("PUT", f"/sports/{swimming_id}", {
        "metrics": [
            {"key": "lap_time", "weight": 0.5, "normalization": "minmax"},
            {"key": "stroke_rate", "weight": 0.5, "normalization": "zscore"},
        ]
    }, token=admin_token)
    check("PUT /sports (update metrics)", s == 200, r)
    if s == 200:
        check("Metrics count updated", len(r.get("metrics", [])) == 2, r.get("metrics"))

    # Update with bad metric weights → 422
    s, r = req("PUT", f"/sports/{swimming_id}", {
        "metrics": [
            {"key": "a", "weight": 0.1, "normalization": "minmax"},
            {"key": "b", "weight": 0.2, "normalization": "minmax"},
        ]
    }, token=admin_token)
    check("PUT /sports (bad weights) → 422", s == 422, r)

    # Update non-existent
    s, r = req("PUT", "/sports/000000000000000000000000", {"phi": 0.1}, token=admin_token)
    check("PUT /sports (not found) → 404", s == 404, r)

    # Empty body → 400 or 422 (Pydantic may reject before route logic)
    s, r = req("PUT", f"/sports/{swimming_id}", {}, token=admin_token)
    check("PUT /sports (empty body) → 4xx", s in (400, 422), r)

    # RBAC: investor cannot update
    s, r = req("PUT", f"/sports/{swimming_id}", {"phi": 0.9}, token=inv_token)
    check("PUT /sports (investor) → 403", s == 403, r)


# ──────────────────────────────────────────────
# 2. Sport-Aware Match Stats
# ──────────────────────────────────────────────
def test_sport_aware_match_stats(admin_token, inv_token):
    print("\n🔹 Sport-Aware Match Stats")

    # Get a Football athlete
    s, r = req("GET", "/athletes/?sport=Football", token=inv_token)
    football_athlete = r[0] if isinstance(r, list) and r else None
    check("Found Football athlete", football_athlete is not None)

    if not football_athlete:
        return

    aid = football_athlete["_id"]

    # Create match stat with sport-defined metrics
    s, r = req("POST", "/match-stats/", {
        "athlete_id": aid,
        "match_date": "2026-02-22T00:00:00Z",
        "stats": {
            "goals": 2,
            "assists": 1,
            "minutes_played": 90,
            "win_rate": 0.75,
            "consistency_score": 0.8,
        }
    }, token=admin_token)
    check("POST /match-stats (sport metrics)", s == 201, r)

    # Create match stat with extra unknown metrics (should be accepted)
    s, r = req("POST", "/match-stats/", {
        "athlete_id": aid,
        "match_date": "2026-02-21T00:00:00Z",
        "stats": {
            "goals": 1,
            "assists": 3,
            "unknown_metric": 42,
            "another_extra": "hello"
        }
    }, token=admin_token)
    check("POST /match-stats (extra metrics accepted)", s == 201, r)

    # Create stat with missing sport metrics (should succeed – missing → 0)
    s, r = req("POST", "/match-stats/", {
        "athlete_id": aid,
        "match_date": "2026-02-20T00:00:00Z",
        "stats": {
            "goals": 5
        }
    }, token=admin_token)
    check("POST /match-stats (partial metrics)", s == 201, r)

    # Manual edit
    stat_id = r.get("_id")
    if stat_id:
        s, r = req("PUT", f"/match-stats/{stat_id}", {
            "stats": {"goals": 6, "assists": 2},
            "manually_updated": True
        }, token=admin_token)
        check("PUT /match-stats (manual edit)", s == 200, r)


# ──────────────────────────────────────────────
# 3. Sport-Dynamic Price Recalculation
# ──────────────────────────────────────────────
def test_sport_dynamic_pricing(admin_token, inv_token):
    print("\n🔹 Sport-Dynamic Price Recalculation")

    # Get athletes from different sports
    s, all_athletes = req("GET", "/athletes/", token=inv_token)
    if not isinstance(all_athletes, list) or not all_athletes:
        check("Athletes available", False, "No athletes found")
        return

    tested_sports = set()
    for athlete in all_athletes[:5]:
        aid = athlete["_id"]
        sport = athlete.get("sport", "unknown")

        # Trigger recalculation
        s, r = req("POST", f"/athletes/{aid}/recalculate-price", token=admin_token)
        if sport not in tested_sports:
            check(f"Recalc price ({sport})", s == 200 and "current_price" in r, r)
            check(f"PS present ({sport})", "performance_score" in r, r)
            tested_sports.add(sport)

    check("Tested multiple sports", len(tested_sports) >= 2, f"sports={tested_sports}")


# ──────────────────────────────────────────────
# 4. Sport-Isolated AI Retrain
# ──────────────────────────────────────────────
def test_sport_isolated_retrain(admin_token, inv_token):
    print("\n🔹 Sport-Isolated AI Retrain")

    # Full retrain (all sports)
    s, r = req("POST", "/admin/ai/retrain", token=admin_token)
    check("POST /admin/ai/retrain (all)", s == 200, r)
    if s == 200 and isinstance(r, dict):
        check("Retrain returns per-sport results", len(r) >= 1, r)
        for sport_name, result in r.items():
            check(f"  Retrain result for '{sport_name}'",
                  isinstance(result, dict) and "sport" in result, result)

    # Per-athlete retrain
    s, athletes = req("GET", "/athletes/", token=inv_token)
    if isinstance(athletes, list) and athletes:
        aid = athletes[0]["_id"]
        sport = athletes[0].get("sport", "")
        s, r = req("POST", f"/admin/ai/retrain/{aid}", token=admin_token)
        check(f"POST /admin/ai/retrain/{{id}} ({sport})",
              s == 200 and "ai_score" in r, r)
        if s == 200:
            check("Retrain returns sport field", r.get("sport") == sport, r.get("sport"))
            check("ai_score in [0,1]", 0 <= r.get("ai_score", -1) <= 1, r.get("ai_score"))

    # Retrain for non-existent athlete
    s, r = req("POST", "/admin/ai/retrain/000000000000000000000000", token=admin_token)
    check("Retrain non-existent → 404", s == 404, r)


# ──────────────────────────────────────────────
# 5. New Sport End-to-End (no code changes)
# ──────────────────────────────────────────────
def test_new_sport_e2e(admin_token, inv_token):
    print("\n🔹 New Sport End-to-End (Rugby)")

    # Step 1: Create sport config
    s, r = req("POST", "/sports/", {
        "name": "Rugby",
        "metrics": [
            {"key": "tries", "weight": 0.35, "normalization": "minmax"},
            {"key": "tackles", "weight": 0.25, "normalization": "minmax"},
            {"key": "carries", "weight": 0.20, "normalization": "minmax"},
            {"key": "kicking_accuracy", "weight": 0.20, "normalization": "zscore"},
        ],
        "phi": 0.0,
        "ai_weights": {"xgb": 0.55, "lstm": 0.45}
    }, token=admin_token)
    check("Create Rugby sport config", s == 201, r)

    # Step 2: Create athlete in new sport
    s, r = req("POST", "/athletes/", {
        "name": "Antoine Dupont",
        "sport": "Rugby",
        "total_shares": 60000,
        "base_value": 40.0,
        "alpha": 0.6,
        "beta": 0.05,
        "gamma": 0.1
    }, token=admin_token)
    check("Create Rugby athlete", s == 201, r)
    rugby_id = r.get("_id")

    if not rugby_id:
        return

    # Step 3: Add match stats with sport-specific metrics
    for i in range(3):
        s, r = req("POST", "/match-stats/", {
            "athlete_id": rugby_id,
            "match_date": f"2026-02-{15+i}T00:00:00Z",
            "stats": {
                "tries": 2 + i,
                "tackles": 10 + i * 2,
                "carries": 8 + i,
                "kicking_accuracy": 0.7 + i * 0.05,
            }
        }, token=admin_token)
    check("Added 3 Rugby match stats", s == 201)

    # Step 4: Recalculate price (should use Rugby metrics)
    s, r = req("POST", f"/athletes/{rugby_id}/recalculate-price", token=admin_token)
    check("Recalc Rugby athlete price", s == 200 and "current_price" in r, r)
    if s == 200:
        check("Rugby PS computed", 0 <= r.get("performance_score", -1) <= 1, r.get("performance_score"))
        check("Rugby price > 0", r.get("current_price", 0) > 0, r.get("current_price"))

    # Step 5: Retrain AI for Rugby athlete
    s, r = req("POST", f"/admin/ai/retrain/{rugby_id}", token=admin_token)
    check("Retrain AI for Rugby athlete", s == 200 and "ai_score" in r, r)

    # Step 6: Update phi to enable hybrid blend
    # First get rugby sport config id
    s, sports = req("GET", "/sports/", token=inv_token)
    rugby_sport = next((sp for sp in sports if sp["name"] == "Rugby"), None) if isinstance(sports, list) else None
    if rugby_sport:
        s, r = req("PUT", f"/sports/{rugby_sport['_id']}", {"phi": 0.3}, token=admin_token)
        check("Update Rugby phi to 0.3", s == 200 and r.get("phi") == 0.3, r)

        # Recalculate again with hybrid blend active
        s, r = req("POST", f"/athletes/{rugby_id}/recalculate-price", token=admin_token)
        check("Recalc with hybrid blend", s == 200, r)


# ──────────────────────────────────────────────
# 6. Backward Compatibility
# ──────────────────────────────────────────────
def test_backward_compatibility(admin_token, inv_token):
    print("\n🔹 Backward Compatibility")

    # Existing athletes still work
    s, r = req("GET", "/athletes/", token=inv_token)
    check("Existing athletes list OK", s == 200 and isinstance(r, list) and len(r) > 0)

    if isinstance(r, list) and r:
        aid = r[0]["_id"]
        # Price recalculation still works for seeded athletes
        s, r2 = req("POST", f"/athletes/{aid}/recalculate-price", token=admin_token)
        check("Seeded athlete recalc OK", s == 200 and "current_price" in r2, r2)

    # Existing match stats still accessible
    s, r = req("GET", "/match-stats/", token=inv_token)
    check("Existing match stats OK", s == 200 and isinstance(r, list))

    # Existing admin endpoints still work
    s, r = req("POST", "/admin/price/recalculate-all", token=admin_token)
    check("Recalculate-all still works", s == 200 and isinstance(r, list), r)

    s, r = req("POST", "/admin/dividends/accrue-all", token=admin_token)
    check("Accrue-all still works", s == 200, r)

    s, r = req("POST", "/admin/liquidity/audit", token=admin_token)
    check("Liquidity audit still works", s == 200, r)


# ──────────────────────────────────────────────
# 7. Edge Cases
# ──────────────────────────────────────────────
def test_edge_cases(admin_token, inv_token):
    print("\n🔹 Edge Cases")

    # Athlete with sport that has no config → should not crash
    s, r = req("POST", "/athletes/", {
        "name": "No Config Sport Player",
        "sport": "Curling",
        "total_shares": 10000,
        "base_value": 15.0,
        "alpha": 0.4,
        "beta": 0.03,
        "gamma": 0.08
    }, token=admin_token)
    check("Create athlete (no sport config)", s == 201, r)
    curling_id = r.get("_id")

    if curling_id:
        # Add stats
        s, r = req("POST", "/match-stats/", {
            "athlete_id": curling_id,
            "match_date": "2026-02-20T00:00:00Z",
            "stats": {"score": 0.8, "accuracy": 0.9}
        }, token=admin_token)
        check("Stats for unconfigured sport", s == 201)

        # Recalculate → should fallback to legacy
        s, r = req("POST", f"/athletes/{curling_id}/recalculate-price", token=admin_token)
        check("Recalc (no sport config) → no crash", s == 200, r)
        if s == 200:
            check("Price computed (legacy fallback)", r.get("current_price", 0) > 0, r.get("current_price"))

    # Sport with phi but no ML trained → phi should be ignored
    s, r = req("POST", "/sports/", {
        "name": "Archery",
        "metrics": [
            {"key": "accuracy", "weight": 0.6, "normalization": "minmax"},
            {"key": "consistency", "weight": 0.4, "normalization": "minmax"},
        ],
        "phi": 0.8,
        "ai_weights": {"xgb": 0.5, "lstm": 0.5}
    }, token=admin_token)
    check("Create Archery (high phi)", s == 201, r)

    s, r = req("POST", "/athletes/", {
        "name": "Archery Player",
        "sport": "Archery",
        "total_shares": 5000,
        "base_value": 20.0,
        "alpha": 0.3,
        "beta": 0.02,
        "gamma": 0.05
    }, token=admin_token)
    archery_id = r.get("_id") if s == 201 else None

    if archery_id:
        s, r = req("POST", f"/athletes/{archery_id}/recalculate-price", token=admin_token)
        check("Recalc Archery (phi high, no ML) → no crash", s == 200, r)

    # Match stat with all-zero metrics
    if curling_id:
        s, r = req("POST", "/match-stats/", {
            "athlete_id": curling_id,
            "match_date": "2026-02-19T00:00:00Z",
            "stats": {"score": 0, "accuracy": 0}
        }, token=admin_token)
        check("Stats with zero values", s == 201)
        s, r = req("POST", f"/athletes/{curling_id}/recalculate-price", token=admin_token)
        check("Recalc with zero stats → no crash", s == 200, r)


# ──────────────────────────────────────────────
# 8. PS Formula Unchanged
# ──────────────────────────────────────────────
def test_ps_formula_untouched(admin_token, inv_token):
    print("\n🔹 PS Formula Consistency")

    # Verify that PS is still composed of 5 weights summing to 1
    # by checking that recalculated athletes have PS in [0, 1]
    s, athletes = req("GET", "/athletes/", token=inv_token)
    if not isinstance(athletes, list):
        check("Athletes available", False)
        return

    for athlete in athletes[:4]:
        aid = athlete["_id"]
        s, r = req("POST", f"/athletes/{aid}/recalculate-price", token=admin_token)
        if s == 200:
            ps = r.get("performance_score", -1)
            check(f"PS in [0,1] for {athlete.get('name', aid)}",
                  0 <= ps <= 1, f"ps={ps}")


# ──────────────────────────────────────────────
# Main
# ──────────────────────────────────────────────
def main():
    print("=" * 55)
    print("  SportFolio — Sport Expansion Strategy Tests")
    print("=" * 55)

    admin_token, inv_token = get_tokens()
    if not admin_token or not inv_token:
        print("❌ Failed to get auth tokens. Is the server running with seeded data?")
        return 1

    football = test_sport_crud(admin_token, inv_token)
    swimming_id = test_sport_create(admin_token, inv_token)
    test_sport_update(admin_token, inv_token, swimming_id)
    test_sport_aware_match_stats(admin_token, inv_token)
    test_sport_dynamic_pricing(admin_token, inv_token)
    test_sport_isolated_retrain(admin_token, inv_token)
    test_new_sport_e2e(admin_token, inv_token)
    test_backward_compatibility(admin_token, inv_token)
    test_edge_cases(admin_token, inv_token)
    test_ps_formula_untouched(admin_token, inv_token)

    print(f"\n{'=' * 55}")
    print(f"  ✅ Passed: {passed}   ❌ Failed: {failed}")
    print(f"{'=' * 55}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
