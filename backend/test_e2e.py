#!/usr/bin/env python3
"""
End-to-end API smoke test for SportFolio backend.
Run with: python test_e2e.py
Requires the server to be running on localhost:8000.
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


def test():
    passed = 0
    failed = 0

    def check(name, condition, detail=""):
        nonlocal passed, failed
        if condition:
            print(f"  ✅ {name}")
            passed += 1
        else:
            print(f"  ❌ {name} — {detail}")
            failed += 1

    # 1. Health
    print("\n🔹 Health")
    s, r = req("GET", "/health")
    check("GET /health", s == 200 and r.get("status") == "ok", r)

    # 2. Auth – register
    print("\n🔹 Auth")
    s, r = req("POST", "/auth/register", {
        "name": "Test User", "email": "test_e2e@test.com", "password": "testpass123"
    })
    check("POST /auth/register", s in (201, 400), r)

    # 3. Auth – login investor
    s, r = req("POST", "/auth/login", {"email": "john@example.com", "password": "investor123"})
    check("POST /auth/login (investor)", s == 200 and "access_token" in r, r)
    inv_token = r.get("access_token", "")

    # 4. Auth – login admin
    s, r = req("POST", "/auth/login", {"email": "admin@sportfolio.io", "password": "admin12345"})
    check("POST /auth/login (admin)", s == 200 and "access_token" in r, r)
    admin_token = r.get("access_token", "")

    # 5. Auth – /me
    s, r = req("GET", "/auth/me", token=inv_token)
    check("GET /auth/me", s == 200 and r.get("email") == "john@example.com", r)

    # 6. List athletes
    print("\n🔹 Athletes")
    s, r = req("GET", "/athletes/", token=inv_token)
    check("GET /athletes", s == 200 and isinstance(r, list) and len(r) > 0, f"count={len(r) if isinstance(r,list) else r}")
    athlete_id = r[0]["_id"] if r else None

    # 7. Get single athlete
    if athlete_id:
        s, r = req("GET", f"/athletes/{athlete_id}", token=inv_token)
        check(f"GET /athletes/{{id}}", s == 200 and r.get("name"), r.get("name"))

    # 8. Admin – create athlete
    s, r = req("POST", "/athletes/", {
        "name": "Test Athlete", "sport": "Tennis",
        "total_shares": 50000, "base_value": 30.0,
        "alpha": 0.5, "beta": 0.04, "gamma": 0.1
    }, token=admin_token)
    check("POST /athletes (admin)", s == 201, r)

    # 9. Admin – update athlete
    if athlete_id:
        s, r = req("PUT", f"/athletes/{athlete_id}", {"base_value": 55.0}, token=admin_token)
        check("PUT /athletes (admin)", s == 200, r)

    # 10. Wallet deposit
    print("\n🔹 Portfolio & Trading")
    s, r = req("POST", f"/portfolio/wallet/deposit?amount=10000", token=inv_token)
    check("POST /wallet/deposit", s == 200, r)

    # 11. Buy shares
    if athlete_id:
        s, r = req("POST", "/trade/buy", {"athlete_id": athlete_id, "shares": 10}, token=inv_token)
        check("POST /trade/buy", s == 200 and "transaction_id" in r, r)

    # 12. Holdings
    s, r = req("GET", "/portfolio/holdings", token=inv_token)
    check("GET /portfolio/holdings", s == 200 and isinstance(r, list), f"count={len(r) if isinstance(r,list) else r}")

    # 13. Transactions
    s, r = req("GET", "/portfolio/transactions", token=inv_token)
    check("GET /portfolio/transactions", s == 200 and isinstance(r, list), r)

    # 14. Sell shares
    if athlete_id:
        s, r = req("POST", "/trade/sell", {"athlete_id": athlete_id, "shares": 2}, token=inv_token)
        check("POST /trade/sell", s == 200 or s == 400, r)

    # 15. Match stats
    print("\n🔹 Match Stats")
    s, r = req("GET", "/match-stats/", token=inv_token)
    check("GET /match-stats", s == 200 and isinstance(r, list), f"count={len(r) if isinstance(r,list) else r}")

    if athlete_id:
        s, r = req("POST", "/match-stats/", {
            "athlete_id": athlete_id,
            "match_date": "2026-02-20T00:00:00Z",
            "stats": {"goals": 3, "assists": 1, "rating": 8.5, "custom_field": "anything"}
        }, token=admin_token)
        check("POST /match-stats (dynamic stats)", s == 201, r)
        stat_id = r.get("_id")

        if stat_id:
            s, r = req("PUT", f"/match-stats/{stat_id}", {
                "stats": {"goals": 4, "assists": 2, "rating": 9.0, "new_field": True}
            }, token=admin_token)
            check("PUT /match-stats (editable)", s == 200, r)

    # 16. Income events
    print("\n🔹 Income & Dividends")
    if athlete_id:
        s, r = req("POST", "/income/", {
            "athlete_id": athlete_id,
            "verified_income": 100000,
            "income_date": "2026-02-01T00:00:00Z"
        }, token=admin_token)
        check("POST /income", s == 201, r)
        evt_id = r.get("_id")

        if evt_id:
            s, r = req("POST", f"/income/{evt_id}/distribute", token=admin_token)
            check("POST /income/distribute", s == 200 and "investor_pool" in r, r)

    # 17. Admin endpoints
    print("\n🔹 Admin")
    if athlete_id:
        s, r = req("POST", "/admin/ai-score/override", {"athlete_id": athlete_id, "ai_score": 0.92}, token=admin_token)
        check("POST /admin/ai-score/override", s == 200, r)

        s, r = req("POST", "/admin/liquidity/adjust", {"athlete_id": athlete_id, "amount": 5000}, token=admin_token)
        check("POST /admin/liquidity/adjust", s == 200, r)

        s, r = req("POST", f"/admin/dividends/accrue/{athlete_id}", token=admin_token)
        check("POST /admin/dividends/accrue", s == 200, r)

        s, r = req("POST", f"/athletes/{athlete_id}/recalculate-price", token=admin_token)
        check("POST /athletes/recalculate-price", s == 200 and "current_price" in r, r)

    s, r = req("POST", "/admin/dividends/accrue-all", token=admin_token)
    check("POST /admin/dividends/accrue-all", s == 200, r)

    s, r = req("POST", "/admin/price/recalculate-all", token=admin_token)
    check("POST /admin/price/recalculate-all", s == 200 and isinstance(r, list), r)

    s, r = req("POST", "/admin/liquidity/audit", token=admin_token)
    check("POST /admin/liquidity/audit", s == 200, r)

    s, r = req("POST", "/admin/ai/retrain", token=admin_token)
    check("POST /admin/ai/retrain", s == 200, r)

    # 18. RBAC — investor cannot access admin routes
    print("\n🔹 RBAC")
    s, r = req("POST", "/admin/ai/retrain", token=inv_token)
    check("Admin route blocked for investor", s == 403, r)

    s, r = req("POST", "/athletes/", {
        "name": "Hacker", "sport": "x", "total_shares": 1, "base_value": 1,
        "alpha": 1, "beta": 1, "gamma": 1
    }, token=inv_token)
    check("Create athlete blocked for investor", s == 403, r)

    # Summary
    print(f"\n{'='*50}")
    print(f"  ✅ Passed: {passed}   ❌ Failed: {failed}")
    print(f"{'='*50}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(test())
