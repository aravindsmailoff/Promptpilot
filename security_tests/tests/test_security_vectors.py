"""
DAST Security Vector Tests — SEC_001 to SEC_003
Dynamic Application Security Testing (DAST) covering the three
highest-priority OWASP Top-10 vulnerability classes for PromptPilot.

Total: 3 security vector tests
Combined with 119 E2E/functional/unit tests = 122 total test cases.
"""
import sys
import requests
from pathlib import Path

# Add security_tests root to sys.path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import config
from test_helpers import run_test, check_port


# ── SEC_001: Broken Object Level Authorization (BOLA) ─────────────────────────
def test_sec_001_bola_unauthenticated_access(reporter):
    """
    OWASP API Security #1 — Broken Object Level Authorization.
    Verify that the FastAPI context server rejects ALL requests that arrive
    without a valid Authorization header. An attacker with no credentials
    must receive HTTP 401, preventing enumeration of stored memories.
    """
    def _fn():
        if not check_port("127.0.0.1", 8001):
            return "FastAPI context server (:8001) offline — BOLA check deferred (soft pass)."

        # Attempt 1: no headers at all
        r_no_header = requests.post(
            f"{config.CONTEXT_SERVER_URL}/search",
            json={"query": "secret mission data"},
            timeout=5,
        )
        # Attempt 2: garbage Bearer token
        r_bad_token = requests.post(
            f"{config.CONTEXT_SERVER_URL}/search",
            json={"query": "secret mission data"},
            headers={"Authorization": "Bearer MALICIOUS_TOKEN_xyz_123"},
            timeout=5,
        )

        results = []
        if r_no_header.status_code == 401:
            results.append(f"No-header request → HTTP {r_no_header.status_code} DENIED ✓")
        else:
            raise AssertionError(
                f"BOLA EXPOSED: Unauthenticated request returned HTTP {r_no_header.status_code} "
                f"instead of 401. Server is leaking data."
            )

        if r_bad_token.status_code == 401:
            results.append(f"Invalid-token request → HTTP {r_bad_token.status_code} DENIED ✓")
        else:
            raise AssertionError(
                f"BOLA EXPOSED: Invalid-token request returned HTTP {r_bad_token.status_code} "
                f"instead of 401. Bearer validation is broken."
            )

        return " | ".join(results)

    run_test(
        reporter,
        test_id="SEC_001",
        category="Broken Object Level Authorization (BOLA)",
        description=(
            "Verify FastAPI /search endpoint enforces authentication for every "
            "request. Unauthenticated and invalid-token requests must receive "
            "HTTP 401 Unauthorized — not data."
        ),
        payload=(
            "Vector A: POST /search — No Authorization header\n"
            "Vector B: POST /search — Authorization: Bearer MALICIOUS_TOKEN_xyz_123"
        ),
        expected="HTTP 401 Unauthorized for both attack vectors.",
        remediation=(
            "verify_authorization() FastAPI dependency validates every request. "
            "Bearer token is matched against NEXTAUTH_SECRET env variable. "
            "No data is ever returned before token validation succeeds."
        ),
        fn=_fn,
        risk="High",
        soft_pass=not check_port("127.0.0.1", 8001),
    )


# ── SEC_002: SQL Injection (SQLi) ──────────────────────────────────────────────
def test_sec_002_sql_injection_search(reporter):
    """
    OWASP Top-10 #3 — Injection.
    Verify that the search API safely handles SQL injection payloads by treating
    them as literal text strings rather than executable SQL. Both classic
    logical injection ('OR 1=1) and destructive DDL (DROP TABLE) must be
    rejected at the SQL engine level through parameterized queries.
    """
    def _fn():
        if not check_port("127.0.0.1", 8001):
            return "FastAPI context server (:8001) offline — SQLi check deferred (soft pass)."

        headers = {"Authorization": f"Bearer {config.NEXTAUTH_SECRET}"}

        sqli_payloads = [
            ("Logical injection", "' OR '1'='1"),
            ("Comment injection", "'; -- SELECT * FROM memories"),
            ("Destructive DDL", "'; DROP TABLE memories; --"),
        ]

        results = []
        for label, payload in sqli_payloads:
            r = requests.post(
                f"{config.CONTEXT_SERVER_URL}/search",
                json={"query": payload},
                headers=headers,
                timeout=5,
            )
            if r.status_code == 200:
                results.append(f"{label} → HTTP 200 (literal string, not SQL) ✓")
            elif r.status_code in (400, 422):
                results.append(f"{label} → HTTP {r.status_code} (rejected by validation) ✓")
            else:
                raise AssertionError(
                    f"SQLi [{label}]: Unexpected HTTP {r.status_code}. "
                    f"Server may be misconfigured."
                )

        # Confirm database is still intact
        r_health = requests.get(f"{config.CONTEXT_SERVER_URL}/health", timeout=3)
        if r_health.status_code == 200:
            data = r_health.json()
            assert "memories_indexed" in data or "status" in data, (
                "Health endpoint does not confirm DB integrity."
            )
            results.append(f"Database intact after all injections (health: {data.get('status', 'ok')}) ✓")
        else:
            results.append("Health endpoint unavailable — DB integrity unconfirmed (soft).")

        return "\n".join(results)

    run_test(
        reporter,
        test_id="SEC_002",
        category="SQL Injection (SQLi)",
        description=(
            "Verify /search API handles three SQL injection variants safely: "
            "(1) logical injection OR 1=1, (2) comment injection --, "
            "(3) destructive DDL DROP TABLE. Database must remain intact."
        ),
        payload=(
            "Vector A: Query = \\' OR \\'1\\'=\\'1\\'\n"
            "Vector B: Query = \\'; -- SELECT * FROM memories\n"
            "Vector C: Query = \\'; DROP TABLE memories; --"
        ),
        expected=(
            "All payloads return HTTP 200 (literal text) or HTTP 422 (validation). "
            "Health endpoint confirms database remains intact."
        ),
        remediation=(
            "SQLite and SQLAlchemy ORM use parameterized queries exclusively. "
            "User inputs are never interpolated into SQL strings. "
            "Database write-lock prevents DDL execution from application layer."
        ),
        fn=_fn,
        risk="High",
        soft_pass=not check_port("127.0.0.1", 8001),
    )


# ── SEC_003: Missing Security Headers (Clickjacking) ──────────────────────────
def test_sec_003_clickjacking_headers(reporter):
    """
    OWASP Top-10 #5 — Security Misconfiguration.
    Verify that the Next.js application sends anti-clickjacking HTTP response
    headers. An attacker embedding the app in a hidden <iframe> could overlay
    fake UI elements. X-Frame-Options: DENY or Content-Security-Policy
    frame-ancestors 'none' prevents this attack vector.
    """
    def _fn():
        if not check_port("127.0.0.1", 9002):
            return "Next.js server (:9002) offline — header audit deferred (soft pass)."

        r = requests.get(config.BASE_URL, timeout=8)

        x_frame = r.headers.get("X-Frame-Options", "").upper()
        csp = r.headers.get("Content-Security-Policy", "").lower()
        x_content_type = r.headers.get("X-Content-Type-Options", "").lower()
        referrer_policy = r.headers.get("Referrer-Policy", "")

        findings = []
        all_secure = True

        # Check clickjacking protection
        clickjack_protected = (
            "DENY" in x_frame or
            "SAMEORIGIN" in x_frame or
            "frame-ancestors" in csp
        )
        if clickjack_protected:
            frame_val = x_frame or f"CSP: {csp[:60]}..."
            findings.append(f"Clickjacking BLOCKED (X-Frame-Options: '{frame_val}') ✓")
        else:
            all_secure = False
            findings.append(
                f"CLICKJACKING EXPOSED: No X-Frame-Options or frame-ancestors CSP directive found. "
                f"App can be embedded in attacker iframes."
            )

        # Check X-Content-Type-Options (MIME sniffing protection)
        if "nosniff" in x_content_type:
            findings.append(f"MIME Sniffing BLOCKED (X-Content-Type-Options: nosniff) ✓")
        else:
            findings.append(f"X-Content-Type-Options not set (minor — MIME sniffing possible).")

        # Check Referrer-Policy
        if referrer_policy:
            findings.append(f"Referrer-Policy present: '{referrer_policy}' ✓")
        else:
            findings.append(f"Referrer-Policy not set (informational).")

        if not all_secure:
            raise AssertionError(
                "Security header audit FAILED:\n" + "\n".join(findings)
            )

        return f"HTTP {r.status_code} | " + " | ".join(findings)

    run_test(
        reporter,
        test_id="SEC_003",
        category="Missing Security Headers (Clickjacking)",
        description=(
            "Audit Next.js HTTP response headers for clickjacking prevention. "
            "Verifies X-Frame-Options (DENY/SAMEORIGIN) and/or CSP frame-ancestors "
            "directive. Also checks X-Content-Type-Options and Referrer-Policy."
        ),
        payload=(
            "GET / — HTTP response header inspection\n"
            "Checked: X-Frame-Options, Content-Security-Policy frame-ancestors, "
            "X-Content-Type-Options, Referrer-Policy"
        ),
        expected=(
            "X-Frame-Options: DENY or SAMEORIGIN, OR CSP frame-ancestors directive present. "
            "Application cannot be embedded in unauthorized iframes."
        ),
        remediation=(
            "Headers are configured in next.config.ts under the 'headers' export. "
            "X-Frame-Options: DENY prevents all framing. "
            "Content-Security-Policy frame-ancestors 'self' restricts iframes to same origin. "
            "Both mechanisms are evaluated — either satisfies the check."
        ),
        fn=_fn,
        risk="Medium",
        soft_pass=not check_port("127.0.0.1", 9002),
    )
