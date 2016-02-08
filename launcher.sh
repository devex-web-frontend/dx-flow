#!/usr/bin/env bash

CURRENT_DIRECTORY="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FILE_NAME=$(basename ${BASH_SOURCE[0]})
HOOK_NAME="${FILE_NAME%.*}"

for SCRIPT in ${CURRENT_DIRECTORY}/${HOOK_NAME}-hooks/*
do
	if [ -f ${SCRIPT} -a -x ${SCRIPT} ]
	then
		${SCRIPT}
	fi
done