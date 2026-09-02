#!/usr/bin/env python3
"""Production browser gate for ProbeLoop.

Starts the static site, mocks the proposed WebMCP browser surface, executes the
real registered tools, crosses human-only controls through the visible UI, and
captures judge-ready screenshots.
"""
from __future__ import annotations

import json
import os
import shutil
import socket
import subprocess
import sys
import time
from pathlib import Path
from urllib.request import urlopen

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
SCREENSHOTS = ROOT / "docs" / "screenshots"
PORT = int(os.environ.get("PROBELOOP_PORT", "4187"))
BASE = f"http://127.0.0.1:{PORT}"


def wait_for_server(timeout: float = 8.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urlopen(BASE, timeout=0.5) as response:
                if response.status == 200:
                    return
        except Exception:
            time.sleep(0.1)
    raise RuntimeError(f"Static server did not start at {BASE}")


def assert_equal(actual, expected, label: str) -> None:
    if actual != expected:
        raise AssertionError(f"{label}: expected {expected!r}, got {actual!r}")


def main() -> int:
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    chromium = os.environ.get("CHROMIUM_PATH") or shutil.which("chromium") or shutil.which("google-chrome")
    if not chromium:
        raise RuntimeError("Set CHROMIUM_PATH or install Chromium to run the browser gate.")

    server = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        wait_for_server()
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch(
                headless=True,
                executable_path=chromium,
                args=["--no-sandbox"],
            )
            context = browser.new_context(
                viewport={"width": 1440, "height": 1000},
                device_scale_factor=1,
                accept_downloads=True,
            )
            context.add_init_script(
                """
                window.__registeredWebMCPTools = [];
                Object.defineProperty(document, 'modelContext', {
                  configurable: true,
                  value: {
                    async registerTool(tool, options = {}) {
                      window.__registeredWebMCPTools.push({ tool, signal: options.signal });
                    }
                  }
                });
                """
            )
            page = context.new_page()
            browser_errors: list[str] = []
            page.on("pageerror", lambda error: browser_errors.append(f"pageerror: {error}"))
            page.on(
                "console",
                lambda message: browser_errors.append(f"console.{message.type}: {message.text}")
                if message.type == "error"
                else None,
            )
            page.goto(f"{BASE}/?reset=1", wait_until="networkidle")
            page.wait_for_function("window.__PROBELOOP__ && window.__registeredWebMCPTools.length === 9")

            assert_equal(page.locator("#phase-badge").inner_text(), "DIAGNOSE", "initial phase")
            assert_equal(page.locator("#webmcp-status").inner_text(), "9 site tools available", "WebMCP status")
            assert_equal(page.evaluate("window.__registeredWebMCPTools.length"), 9, "registered tool count")
            assert_equal(page.evaluate("window.__PROBELOOP__.store.getState().version"), 1, "initial version")
            page.screenshot(path=SCREENSHOTS / "workbench.png", full_page=True)
            page.screenshot(path=SCREENSHOTS / "workbench-fold.png", full_page=False)

            # The calls below execute the exact functions registered through document.modelContext.
            select_result = page.evaluate(
                """async () => JSON.parse(await window.__registeredWebMCPTools
                    .find(({tool}) => tool.name === 'select_test').tool.execute({
                      test_id: 'f1_continuity', expected_version: 1
                    }))"""
            )
            assert_equal(select_result["version"], 2, "selected-test version")
            assert_equal(page.locator("#phase-badge").inner_text(), "PROBE", "probe phase")
            assert_equal(page.locator(".probe-point.is-visible").count(), 2, "visible probe points")
            page.screenshot(path=SCREENSHOTS / "probe-points.png", full_page=False)

            measure_result = page.evaluate(
                """async () => JSON.parse(await window.__registeredWebMCPTools
                    .find(({tool}) => tool.name === 'record_measurement').tool.execute({
                      test_id: 'f1_continuity',
                      outcome: 'open',
                      observed_by: 'human',
                      power_disconnected: true,
                      note: 'Human read OL at the highlighted pads.',
                      expected_version: 2
                    }))"""
            )
            assert_equal(measure_result["version"], 3, "measurement version")
            if measure_result["leading_hypothesis"]["confidence"] < 0.89:
                raise AssertionError("F1 confidence did not cross the evidence threshold")
            assert_equal(page.locator("#phase-badge").inner_text(), "INTERPRET", "interpret phase")
            page.screenshot(path=SCREENSHOTS / "evidence-update.png", full_page=False)

            stage_result = page.evaluate(
                """async () => JSON.parse(await window.__registeredWebMCPTools
                    .find(({tool}) => tool.name === 'stage_repair_plan').tool.execute({
                      repair_id: 'replace_f1',
                      rationale: 'The human-reported open result crossed the confidence threshold.',
                      expected_version: 3
                    }))"""
            )
            assert_equal(stage_result["version"], 4, "staged-repair version")
            assert_equal(stage_result["repair_plan"]["status"], "staged", "staged repair status")
            assert_equal(page.locator("#phase-badge").inner_text(), "REVIEW", "review phase")
            if page.locator(".approval-gate").count() != 1:
                raise AssertionError("Human-only approval gate is not visible")
            page.screenshot(path=SCREENSHOTS / "human-approval-gate.png", full_page=False)

            # Approval and physical completion are intentionally absent from the tool manifest.
            registered_names = page.evaluate("window.__registeredWebMCPTools.map(({tool}) => tool.name)")
            if any("approve" in name or "perform" in name for name in registered_names):
                raise AssertionError("An agent approval/physical-work tool was exposed")
            page.locator(".approve-repair").click()
            assert_equal(page.evaluate("window.__PROBELOOP__.store.getState().version"), 5, "human approval version")
            page.locator("#attest-human").check()
            page.locator("#attest-power").check()
            page.locator(".attest-repair").click()
            assert_equal(page.evaluate("window.__PROBELOOP__.store.getState().version"), 6, "human completion version")
            assert_equal(page.locator("#phase-badge").inner_text(), "VERIFY", "verify phase")

            verify_result = page.evaluate(
                """async () => JSON.parse(await window.__registeredWebMCPTools
                    .find(({tool}) => tool.name === 'record_post_repair_check').tool.execute({
                      startup: 'normal',
                      charging_indicator: 'normal',
                      observed_by: 'human',
                      note: 'Human observed a normal boot and charge light.',
                      expected_version: 6
                    }))"""
            )
            assert_equal(verify_result["version"], 7, "verification version")
            assert_equal(verify_result["phase"], "resolved", "resolved result")
            assert_equal(page.locator("#phase-badge").inner_text(), "RESOLVED", "resolved phase")
            page.evaluate(
                """() => {
                  window.scrollTo(0, 0);
                  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
                  const toast = document.querySelector('#toast');
                  if (toast) toast.hidden = true;
                  const skip = document.querySelector('.skip-link');
                  if (skip) skip.style.visibility = 'hidden';
                }"""
            )
            page.wait_for_timeout(200)
            page.screenshot(path=SCREENSHOTS / "resolved.png", full_page=True)
            page.locator(".workspace-grid").scroll_into_view_if_needed()
            page.wait_for_timeout(120)
            page.screenshot(path=SCREENSHOTS / "resolved-fold.png", full_page=False)

            # Persisted shared state survives refresh.
            page.reload(wait_until="networkidle")
            page.wait_for_function("window.__PROBELOOP__")
            assert_equal(page.evaluate("window.__PROBELOOP__.store.getState().version"), 7, "persisted version")
            assert_equal(page.evaluate("window.__PROBELOOP__.store.getState().phase"), "resolved", "persisted phase")

            # Export contains human approval/completion evidence.
            with page.expect_download() as download_info:
                page.locator("#download-report").click()
            download = download_info.value
            exported_path = Path(download.path())
            report = json.loads(exported_path.read_text())
            assert_equal(report["repair"]["approved_by_human"], True, "report approval evidence")
            assert_equal(report["repair"]["completed_by_human"], True, "report completion evidence")

            # Manifest screenshot and structural accessibility checks.
            page.locator("#site-tool-pill").click()
            page.locator("#tools-dialog").wait_for(state="visible")
            page.screenshot(path=SCREENSHOTS / "site-tools.png", full_page=False)
            page.locator("#tools-dialog .close-dialog").click()

            duplicate_ids = page.evaluate(
                """() => [...document.querySelectorAll('[id]')]
                  .map((element) => element.id)
                  .filter((id, index, all) => all.indexOf(id) !== index)"""
            )
            assert_equal(duplicate_ids, [], "duplicate DOM ids")
            unnamed_buttons = page.evaluate(
                """() => [...document.querySelectorAll('button')]
                  .filter((button) => !(button.innerText.trim() || button.getAttribute('aria-label') || button.title))
                  .length"""
            )
            assert_equal(unnamed_buttons, 0, "unnamed buttons")

            if browser_errors:
                raise AssertionError("Browser errors:\n" + "\n".join(browser_errors))

            context.close()

            # Mobile fallback remains fully usable without WebMCP.
            mobile = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=1)
            mobile_page = mobile.new_page()
            mobile_page.goto(f"{BASE}/?reset=1", wait_until="networkidle")
            assert_equal(mobile_page.locator("#phase-badge").inner_text(), "DIAGNOSE", "mobile initial phase")
            if mobile_page.evaluate("document.body.scrollWidth") > 390:
                raise AssertionError("Mobile layout has horizontal overflow")
            mobile_page.screenshot(path=SCREENSHOTS / "mobile.png", full_page=True)
            mobile.close()
            browser.close()

        print("Browser verification passed: native registration mock, golden tool path, human-only gate, persistence, export, accessibility structure, and mobile layout.")
        return 0
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    raise SystemExit(main())
