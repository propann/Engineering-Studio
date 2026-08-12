#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
project_dir="$(cd -- "${script_dir}/.." && pwd)"
cache_dir="${project_dir}/.cache/community-tools"

mkdir -p "${cache_dir}"

# These are the exact commits studied for the firmware laboratory. The clones
# stay in .cache/ and are never bundled into the application automatically.
tools=(
  "op1repacker|https://github.com/op1hacks/op1repacker.git|390b18e4193a3af4f44e8f89b5f6c017a71ddf96"
  "op1REpackerGUI|https://github.com/op1hacks/op1REpackerGUI.git|3f54f41c771c6045df8e6771fd965b055cef1084"
  "op1-docs|https://github.com/sualk/op1-docs.git|38685982be029f678d9da1d01034a7331ec77808"
  "op1svg|https://github.com/op1hacks/op1svg.git|50a3b01ebb74fd07b33d91c08b1e59e11494801d"
  "op1aiff|https://github.com/op1hacks/op1aiff.git|db742a1bbd42c324b1996f1abbdee755f2cfd3d5"
  "opie|https://github.com/op1hacks/opie.git|90b20ecf43003813d6d46e2e450c45af58d36f36"
)

for spec in "${tools[@]}"; do
  IFS='|' read -r name url commit <<< "${spec}"
  target="${cache_dir}/${name}"

  if [[ -e "${target}" && ! -d "${target}/.git" ]]; then
    echo "Refusing to reuse a non-Git path: ${target}" >&2
    exit 1
  fi

  if [[ ! -d "${target}/.git" ]]; then
    git clone "${url}" "${target}"
  fi

  git -C "${target}" fetch --quiet origin "${commit}"
  git -C "${target}" checkout --quiet --detach "${commit}"
  printf '%-16s %s\n' "${name}" "$(git -C "${target}" rev-parse HEAD)"
done

echo
echo "Community tools are available under ${cache_dir}."
echo "No firmware binary is downloaded by this script."
