#!/bin/sh
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir/.."
exec pwsh -NoProfile -File "$script_dir/run_pipeline.ps1" "$@"
