#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "${script_dir}/.." && pwd)"
cache_dir="${project_dir}/.cache/official-docs"

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to fetch the official documentation." >&2
  exit 1
fi

mkdir -p "${cache_dir}/guides"

manual_url="https://teenage.engineering/_img/54b7f9bf8681400300255cab_original.pdf"
curl --fail --location --retry 3 --output "${cache_dir}/op-1-original-manual.pdf" "${manual_url}"

guide_slugs=(
  "original"
  "original/te-boot"
  "original/song-rendering-and-connectivity"
  "original/synthesizer-mode"
  "original/drum-mode"
  "original/tape-mode"
  "original/recording-external-sources"
  "original/sequencers"
)

for slug in "${guide_slugs[@]}"; do
  filename="${slug//\//_}.html"
  url="https://teenage.engineering/guides/op-1/${slug}"
  curl --fail --location --retry 3 --output "${cache_dir}/guides/${filename}" "${url}"
done

if command -v sha256sum >/dev/null 2>&1; then
  (
    cd "${cache_dir}"
    find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > SHA256SUMS
  )
elif command -v shasum >/dev/null 2>&1; then
  (
    cd "${cache_dir}"
    find . -type f ! -name SHA256SUMS -print0 | sort -z | xargs -0 shasum -a 256 > SHA256SUMS
  )
fi

echo "Official documentation cached in: ${cache_dir}"
echo "These files are for local reference and are ignored by Git."

