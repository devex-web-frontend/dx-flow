#!/usr/bin/env bash
CURRENT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
node ${CURRENT_DIRECTORY}/cli.js "$@"