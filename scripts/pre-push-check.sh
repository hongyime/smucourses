#!/bin/sh
set -eu
script_dir=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
cd "$script_dir/.."
python -m unittest discover -s scripts/tests
cd web
exec npx tsc --noEmit "$@"
