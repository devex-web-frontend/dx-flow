#!/usr/bin/env node

var fs = require('fs');
var execSync = require('child_process').execSync;

var commitMsg = fs.readFileSync(process.argv[2]);
var branchName = execSync('git rev-parse --abbrev-ref HEAD').toString();

var branchTicker = getTicker(branchName);
var commitTicker = getTicker(commitMsg);

if (!!branchTicker && branchTicker !== commitTicker) {
	console.error(
		'Error: Branch ticker(' + branchTicker + ') and commit message ticker(' + commitTicker + ') doesn\'t fit');
	process.exit(1);
}

function getTicker(branchName) {
	var execResult = /.*[^a-zA-Z0-9]([A-Z]{2,}\-\d{1,})[^a-zA-Z0-9].*/.exec(branchName);
	return execResult ? execResult[1].toLowerCase() : null;
}

