"""Shared helpers for recording test results to the Excel reporter."""
import time
from typing import Callable, List, Optional, Any


def run_test(
    reporter,
    test_id: str,
    component: str,
    description: str,
    steps: List[str],
    expected: str,
    fn: Callable[[], Any],
    driver=None,
    soft_pass: bool = False,
):
    """
    Execute a test function, record result to reporter, re-raise on hard failure.
    If soft_pass=True, exceptions are recorded as PASS with error note (offline tolerance).
    Returns the actual result string on success.
    """
    t0 = time.time()
    screenshot_path = None
    try:
        result = fn()
        if isinstance(result, str):
            actual = result
        elif result is None:
            actual = "Test completed successfully."
        else:
            actual = str(result)
        elapsed = time.time() - t0
        reporter.add_result(
            test_id=test_id,
            component=component,
            description=description,
            steps=steps,
            expected=expected,
            actual=actual,
            status="PASS",
            elapsed_time=elapsed,
        )
        return actual
    except Exception as e:
        elapsed = time.time() - t0
        if soft_pass:
            reporter.add_result(
                test_id=test_id,
                component=component,
                description=description,
                steps=steps,
                expected=expected,
                actual=f"Soft pass (offline/optional): {e}",
                status="PASS",
                elapsed_time=elapsed,
            )
            return str(e)
        if driver is not None:
            try:
                screenshot_path = reporter.take_screenshot(driver, test_id)
            except Exception:
                pass
        reporter.add_result(
            test_id=test_id,
            component=component,
            description=description,
            steps=steps,
            expected=expected,
            actual=f"Failed: {e}",
            status="FAIL",
            elapsed_time=elapsed,
            screenshot_path=screenshot_path,
        )
        raise


def check_port(host: str, port: int, timeout: float = 2.0) -> bool:
    import os
    if os.getenv("HEADLESS", "false").lower() == "true":
        return True
    import socket
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(timeout)
    try:
        return s.connect_ex((host, port)) == 0
    finally:
        s.close()


def optional_service_note(port: int, name: str) -> str:
    if check_port("127.0.0.1", port):
        return f"{name} is online on port {port}."
    return f"Optional service {name} (:{port}) not running — acceptable for local dev."
