#!/usr/bin/env bash

root=$( cd ${0%/*} && pwd -P )

if [ "$1" = "bump" ] || [ "$1" = "hook" ]; then
	node "$root/node-cli.js" ${*:1}
else
	"$root/gitflow/git-flow" ${*:1}
fi