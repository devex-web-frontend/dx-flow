#!/usr/bin/env bash

root=$( cd $(dirname $0) && pwd -P )

if [ "$1" = "bump" ] || [ "$1" = "hook" ]; then
	node "$root/node-cli.js" ${*:1}
else
	sh "$root/gitflow/git-flow" ${*:1}
fi