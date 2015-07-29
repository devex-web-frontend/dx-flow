#!/usr/bin/env bash

root=$( cd $(dirname `readlink -f ${BASH_SOURCE[0]}`) && pwd -P )

if [ "$1" = "bump" ] || [ "$1" = "hook" ] || [ "$1" = "clean" ]; then
	node "$root/node-cli.js" ${*:1}
else
	sh "$root/gitflow/git-flow" ${*:1}
fi