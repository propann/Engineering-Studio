#!/usr/bin/env python3
"""Download and validate an official original OP-1 firmware release.

The command deliberately keeps the network boundary narrow: it only accepts
HTTPS URLs listed in the local catalog, streams to a private temporary file,
validates the container before moving it to its final destination, and never
ships a proprietary firmware in this repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import HTTPRedirectHandler, Request, build_opener

from firmware_inspector import FirmwareInspectionError, inspect_firmware_file


DEFAULT_MAX_BYTES = 32 * 1024 * 1024
USER_AGENT = "OP-1-Studio/0.1 (official firmware helper)"


class FirmwareFetchError(Exception):
    """A stable, user-facing download or catalog failure."""

    def __init__(self, code: str, message: str, **details: Any) -> None:
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details

    def to_dict(self) -> dict[str, Any]:
        result: dict[str, Any] = {"code": self.code, "message": self.message}
        if self.details:
            result["details"] = self.details
        return result


def _official_host(host: str, allowed_hosts: set[str]) -> bool:
    normalized = host.lower().rstrip(".")
    return normalized in {item.lower().rstrip(".") for item in allowed_hosts}


def validate_official_url(url: str, allowed_hosts: set[str]) -> None:
    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        raise FirmwareFetchError(
            "unapproved_url",
            "The firmware URL must use HTTPS and an approved host.",
            url=url,
        )
    if not _official_host(parsed.hostname, allowed_hosts):
        raise FirmwareFetchError(
            "unapproved_host",
            "The firmware URL is not hosted by an approved official source.",
            host=parsed.hostname,
        )
    if not parsed.path.lower().endswith(".op1"):
        raise FirmwareFetchError(
            "unexpected_extension",
            "The official firmware URL must point to an .op1 file.",
            path=parsed.path,
        )


class RestrictedRedirectHandler(HTTPRedirectHandler):
    def __init__(self, allowed_hosts: set[str]) -> None:
        super().__init__()
        self.allowed_hosts = allowed_hosts

    def redirect_request(self, req: Request, fp: Any, code: int, msg: str, headers: Any, newurl: str):  # type: ignore[no-untyped-def]
        validate_official_url(newurl, self.allowed_hosts)
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def load_release(catalog_path: Path, version: int) -> tuple[dict[str, Any], set[str]]:
    try:
        catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise FirmwareFetchError("catalog_unavailable", "The firmware catalog cannot be read.", path=str(catalog_path)) from exc

    if catalog.get("model") != "op-1-original":
        raise FirmwareFetchError("catalog_model", "The catalog is not for the original OP-1.")

    policy = catalog.get("policy") or {}
    allowed_hosts = set(policy.get("allowedDownloadHosts") or [])
    if not allowed_hosts:
        raise FirmwareFetchError("catalog_policy", "The catalog does not define an approved download host.")

    releases = catalog.get("releases") or []
    release = next((item for item in releases if int(item.get("version", -1)) == version), None)
    if release is None:
        raise FirmwareFetchError("release_unknown", "That firmware version is not listed in the local catalog.", version=version)

    url = release.get("officialUrl")
    if not isinstance(url, str):
        raise FirmwareFetchError("release_url", "The catalog entry has no official download URL.", version=version)
    validate_official_url(url, allowed_hosts)
    return release, allowed_hosts


def _copy_stream(response: Any, partial_path: Path, max_bytes: int) -> int:
    total = 0
    with partial_path.open("wb") as output:
        while True:
            chunk = response.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                raise FirmwareFetchError(
                    "download_size_limit",
                    "The downloaded firmware exceeds the safety limit.",
                    max_bytes=max_bytes,
                )
            output.write(chunk)
        output.flush()
        os.fsync(output.fileno())
    return total


def download_release(
    catalog_path: Path,
    version: int,
    output_path: Path,
    *,
    max_bytes: int = DEFAULT_MAX_BYTES,
    force: bool = False,
) -> dict[str, Any]:
    release, allowed_hosts = load_release(catalog_path, version)
    url = str(release["officialUrl"])

    if output_path.exists() and not force:
        raise FirmwareFetchError("output_exists", "The destination already exists; pass --force to replace it.", path=str(output_path))
    output_path.parent.mkdir(parents=True, exist_ok=True)

    partial_path: Path | None = None
    opener = build_opener(RestrictedRedirectHandler(allowed_hosts))
    request = Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/octet-stream"})

    try:
        with opener.open(request, timeout=30) as response:
            final_url = response.geturl()
            validate_official_url(final_url, allowed_hosts)
            declared_size = response.headers.get("Content-Length")
            if declared_size and int(declared_size) > max_bytes:
                raise FirmwareFetchError(
                    "download_size_limit",
                    "The server-declared firmware size exceeds the safety limit.",
                    content_length=int(declared_size),
                    max_bytes=max_bytes,
                )

            with tempfile.NamedTemporaryFile(
                mode="wb",
                prefix=f".{output_path.name}.",
                suffix=".partial",
                dir=output_path.parent,
                delete=False,
            ) as temporary:
                partial_path = Path(temporary.name)

            size = _copy_stream(response, partial_path, max_bytes)

        report = inspect_firmware_file(partial_path)
        expected_sha256 = release.get("sha256")
        if expected_sha256:
            if report.sha256.lower() != str(expected_sha256).lower():
                raise FirmwareFetchError(
                    "sha256_mismatch",
                    "The firmware hash does not match the catalog.",
                    expected_sha256=expected_sha256,
                    calculated_sha256=report.sha256,
                )

        os.replace(partial_path, output_path)
        partial_path = None
        return {
            "version": version,
            "model": "op-1-original",
            "path": str(output_path),
            "bytes": size,
            "sha256": report.sha256,
            "sha256Approved": bool(expected_sha256),
            "containerValid": report.valid,
            "recognizedLayout": report.recognized_layout,
            "sourceUrl": url,
        }
    except (HTTPError, URLError, TimeoutError, OSError) as exc:
        raise FirmwareFetchError("download_failed", "The official firmware could not be downloaded.", url=url) from exc
    except FirmwareInspectionError as exc:
        raise FirmwareFetchError("invalid_firmware", "The downloaded file failed container validation.", error=exc.to_dict()) from exc
    finally:
        if partial_path is not None:
            try:
                partial_path.unlink(missing_ok=True)
            except OSError:
                pass


def _positive_mib(value: str) -> int:
    try:
        mib = int(value)
    except ValueError as exc:
        raise argparse.ArgumentTypeError("expected an integer number of MiB") from exc
    if mib <= 0:
        raise argparse.ArgumentTypeError("the limit must be greater than zero")
    return mib * 1024 * 1024


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Download and validate an official original OP-1 firmware.")
    parser.add_argument("--catalog", type=Path, default=Path("data/firmware/catalog.json"))
    parser.add_argument("--version", type=int, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--max-mib", type=_positive_mib, default=DEFAULT_MAX_BYTES, metavar="MIB")
    parser.add_argument("--force", action="store_true", help="replace an existing destination")
    parser.add_argument("--compact", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    try:
        result = download_release(args.catalog, args.version, args.output, max_bytes=args.max_mib, force=args.force)
        exit_code = 0
    except FirmwareFetchError as exc:
        result = {"valid": False, "error": exc.to_dict()}
        exit_code = 2

    json.dump(result, sys.stdout, ensure_ascii=False, indent=None if args.compact else 2, sort_keys=True)
    sys.stdout.write("\n")
    return exit_code


if __name__ == "__main__":
    # Allow execution directly from the repository root without packaging the tools.
    sys.path.insert(0, str(Path(__file__).parent))
    raise SystemExit(main())
