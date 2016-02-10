#!/usr/bin/env node

var exec = require('child_process').exec;
var path = require('path');
var files = ['package.json', 'bower.json'];
var fs = require('fs');
var cwd = process.cwd();

exec('git rev-parse --abbrev-ref HEAD', function(error, branch, stderr) {
	if (error) {
		throw stderr;
	}

	var repoVersion = branch.trim().match(/^(?:release|hotfix)\/(.+)$/);
	if (repoVersion) {
		repoVersion = repoVersion[1];

		var changed = [];
		files.forEach(function(file) {
			if (bump(path.resolve(cwd, file), repoVersion)) {
				changed.push(file);
			}
		});

		if (changed.length > 0) {
			exec('git commit -m "bump version ' + repoVersion + '" ' + changed.join(' '));
		}
	}
});

/**
 * Bumps version section in speficied file
 * @param {String} file
 * @param {String} version
 * @returns {boolean}
 */
function bump(file, version) {
	if (fs.existsSync(file)) {
		var pversion = require(file).version;

		if (version !== pversion) {
			var content = fs.readFileSync(file).toString();
			var modified = content.replace(/"version":\s*".+"/, '"version": "' + version + '"');
			fs.writeFileSync(file, modified);
			return true;
		}
	}
	return false;
}

module.exports = bump;