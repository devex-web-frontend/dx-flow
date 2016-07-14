#!/usr/bin/env node

var fs = require('fs');
var execSync = require('child_process').execSync;
var commitMsg = fs.readFileSync('./.git/COMMIT_EDITMSG');
var branchName = execSync('git rev-parse --abbrev-ref HEAD').toString();

var branchTicker = getTicker(branchName);
var commitTicker = getTicker(commitMsg);

if (!!branchTicker && branchTicker !== commitTicker) {
	console.error('Error: Branch ticker(' + branchTicker +
		') and commit message ticker(' + commitTicker + ') doesn\'t fit');
	process.exit(1);
}

function getTicker(branchName) {
	var execResult = /([A-Z]{2,}\-\d{1,})/.exec(branchName);
	return execResult ? execResult[1].toLowerCase() : null;
}

