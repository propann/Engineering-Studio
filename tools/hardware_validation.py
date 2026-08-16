#!/usr/bin/env python3
"""Orchestrateur central des validations matérielles locales.

Le mode par défaut est strictement lecture seule : détection Linux, scan d'un
projet EP-133, inventaire des sons et vérification facultative du bridge. Les
écritures ne sont possibles qu'avec ``--write-slot`` et ``--confirm-write``.
Les rapports et les scans générés sont destinés à rester locaux.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


REPOSITORY = Path(__file__).resolve().parents[1]
EP_TOOLS = REPOSITORY / "apps" / "ep133-studio" / "tools"
DEFAULT_SCANNER = Path("/tmp/ep133-scan-venv/bin/python")


def utc_stamp() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def run_command(label: str, command: list[str], timeout: int) -> dict[str, Any]:
    started = datetime.now(timezone.utc).isoformat()
    try:
        completed = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
        return {
            "label": label,
            "command": command,
            "startedAt": started,
            "finishedAt": datetime.now(timezone.utc).isoformat(),
            "exitCode": completed.returncode,
            "ok": completed.returncode == 0,
            "stdout": completed.stdout[-6000:],
            "stderr": completed.stderr[-3000:],
        }
    except subprocess.TimeoutExpired as error:
        return {
            "label": label,
            "command": command,
            "startedAt": started,
            "finishedAt": datetime.now(timezone.utc).isoformat(),
            "exitCode": None,
            "ok": False,
            "stdout": (error.stdout or "")[-6000:] if isinstance(error.stdout, str) else "",
            "stderr": f"timeout après {timeout}s",
        }
    except OSError as error:
        return {
            "label": label,
            "command": command,
            "startedAt": started,
            "finishedAt": datetime.now(timezone.utc).isoformat(),
            "exitCode": None,
            "ok": False,
            "stdout": "",
            "stderr": str(error),
        }


def skipped_check(label: str, reason: str) -> dict[str, Any]:
    """Enregistre une étape non exécutable sans fabriquer un faux traceback."""
    now = datetime.now(timezone.utc).isoformat()
    return {
        "label": label,
        "command": [],
        "startedAt": now,
        "finishedAt": now,
        "exitCode": None,
        "ok": False,
        "status": "skipped",
        "reason": reason,
        "stdout": "",
        "stderr": "",
    }


def bridge_check(base_url: str, path: str, timeout: int = 10) -> dict[str, Any]:
    url = f"{base_url.rstrip('/')}{path}"
    started = datetime.now(timezone.utc).isoformat()
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return {"path": path, "url": url, "ok": True, "status": 200, "payload": payload, "startedAt": started}
    except (OSError, ValueError, urllib.error.URLError) as error:
        return {"path": path, "url": url, "ok": False, "status": None, "error": str(error), "startedAt": started}


def load_json(path: Path) -> dict[str, Any] | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
        return value if isinstance(value, dict) else None
    except (OSError, json.JSONDecodeError):
        return None


def main() -> int:
    parser = argparse.ArgumentParser(description="Valide un EP-133 et produit un rapport local.")
    parser.add_argument("--project", type=int, default=9, choices=range(1, 10), help="projet à scanner (1-9)")
    parser.add_argument("--python", dest="scanner_python", type=Path, default=DEFAULT_SCANNER, help="Python avec epsysex")
    parser.add_argument("--output", type=Path, default=None, help="rapport JSON ; défaut hardware-reports/ep133-<date>.json")
    parser.add_argument("--bridge-url", default="http://127.0.0.1:8765", help="bridge local à vérifier")
    parser.add_argument("--skip-library", action="store_true", help="ne pas inventorier les 532 slots sonores")
    parser.add_argument("--skip-bridge", action="store_true", help="ne pas appeler le bridge local")
    parser.add_argument("--write-slot", type=int, choices=range(1, 10), help="slot à écrire ; désactivé par défaut")
    parser.add_argument("--confirm-write", action="store_true", help="autorisation explicite requise avec --write-slot")
    parser.add_argument("--device-root", type=Path, help="racine locale du clone, obligatoire pour une écriture")
    args = parser.parse_args()

    if args.write_slot is not None and not args.confirm_write:
        parser.error("--write-slot exige --confirm-write")
    if args.write_slot is not None and args.device_root is None:
        parser.error("--write-slot exige --device-root explicite")
    if not args.scanner_python.is_file():
        parser.error(f"Python scanner introuvable : {args.scanner_python}")

    report_path = args.output or REPOSITORY / "hardware-reports" / f"ep133-{utc_stamp()}.json"
    report_path = report_path.expanduser().resolve()
    artifact_dir = report_path.parent / f"{report_path.stem}-artifacts"
    artifact_dir.mkdir(parents=True, exist_ok=True)
    report: dict[str, Any] = {
        "schema": "studio-hub.hardware-validation.v1",
        "startedAt": datetime.now(timezone.utc).isoformat(),
        "repository": str(REPOSITORY),
        "device": "ep133",
        "readOnly": args.write_slot is None,
        "project": args.project,
        "artifacts": {},
        "checks": [],
    }

    device_check = run_command("linux-device-check", ["bash", str(EP_TOOLS / "check-ep133-linux.sh")], 30)
    report["checks"].append(device_check)
    device_present = device_check.get("ok") is True and "EP-133 détecté sur USB." in device_check.get("stdout", "")
    report["devicePresent"] = device_present

    if device_present:
        project_artifact = artifact_dir / f"project-{args.project:02d}.json"
        project_check = run_command(
            "project-readonly-scan",
            [str(args.scanner_python), str(EP_TOOLS / "scan_ep133_readonly.py"), "--project", str(args.project), "--port", "EP-133", "--out", str(project_artifact)],
            120,
        )
        report["checks"].append(project_check)
        report["artifacts"]["projectScan"] = str(project_artifact)
        project_data = load_json(project_artifact)
        if project_data:
            report["projectSummary"] = {"projectName": project_data.get("projectName"), "pads": len(project_data.get("pads", [])), "sounds": len(project_data.get("sounds", {})), "readOnly": project_data.get("readOnly")}

        if not args.skip_library:
            library_artifact = artifact_dir / "sound-index.json"
            library_check = run_command(
                "sound-library-readonly-scan",
                [str(args.scanner_python), str(EP_TOOLS / "scan_ep133_library_readonly.py"), "--port", "EP-133", "--out", str(library_artifact)],
                300,
            )
            report["checks"].append(library_check)
            report["artifacts"]["soundIndex"] = str(library_artifact)
            library_data = load_json(library_artifact)
            if library_data:
                report["soundSummary"] = {"soundCount": library_data.get("soundCount"), "usedBytes": library_data.get("usedBytes"), "readOnly": library_data.get("readOnly")}
    else:
        reason = "EP-133 absente : scans projet et bibliothèque non exécutés."
        report["skippedReason"] = reason
        report["checks"].append(skipped_check("project-readonly-scan", reason))
        if not args.skip_library:
            report["checks"].append(skipped_check("sound-library-readonly-scan", reason))

    if not args.skip_bridge:
        report["bridge"] = [bridge_check(args.bridge_url, path) for path in ("/health", "/clone/status", "/projects/list")]

    if args.write_slot is not None:
        write_check = run_command(
            "project-write-confirmed",
            [str(args.scanner_python), str(EP_TOOLS / "send_project_to_machine.py"), "--root", str(args.device_root.expanduser().resolve()), "write", "--slot", str(args.write_slot), "--confirm"],
            180,
        )
        report["checks"].append(write_check)
        report["write"] = {"slot": args.write_slot, "deviceRoot": str(args.device_root.expanduser().resolve()), "explicitConfirmation": True}

    report["finishedAt"] = datetime.now(timezone.utc).isoformat()
    report["ok"] = device_present and all(
        check.get("ok") is True
        for check in report["checks"]
        if check.get("status") != "skipped" and (check.get("label") != "project-write-confirmed" or args.confirm_write)
    )
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"ok": report["ok"], "report": str(report_path), "artifacts": report["artifacts"], "projectSummary": report.get("projectSummary"), "soundSummary": report.get("soundSummary")}, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 2


if __name__ == "__main__":
    raise SystemExit(main())
