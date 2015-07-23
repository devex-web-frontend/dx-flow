if (process.argv.length !== 3 && process.argv.length !== 4 && process.argv.length !== 5) {
	var error = 'Usage:\n' +
		'\tdx-flow type (release|hotfix) operation (start|finish) [version]\n' +
		'\tdx-flow hook [name]\n';
	throw new Error(error);
}

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var semver = require('semver');
var execFile = require('child_process').execFile;
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;

var type = process.argv[2];
var operation = process.argv[3];
var version = process.argv[4];

var cwd = process.cwd();
var root = path.dirname(__filename);

var gitHooks = path.resolve(root, 'hooks', 'git');
var gitflow = path.resolve(root, 'gitflow', 'git-flow');

if (root === cwd) {
	throw new Error('Do not run dx-flow in its project directory');
}

switch (type) {
	case 'hook':
	{
		if (operation) {
			hook(operation);
			//exact hook name
		} else {
			//iterate
			fs.readdirSync(gitHooks).forEach(hook);
		}
		break;
	}
	case 'release':
	{
		var releaseVersion = operation;
		switch (releaseVersion) {
			case 'major':
			{
				release(semver.inc(require(path.resolve(cwd, 'package.json')).version, 'major'));
				break;
			}
			case 'minor':
			{
				release(semver.inc(require(path.resolve(cwd, 'package.json')).version, 'minor'));
				break;
			}
			default:
			{
				//custom
				if (semver.valid(releaseVersion)) {
					release(releaseVersion);
				} else {
					throw new Error('Invalid version', releaseVersion);
				}
			}
		}
		break;
	}
	case 'hotfix':
	{
		switch (operation) {
			case 'start':
			{
				hotfix(semver.inc(require(path.resolve(cwd, 'package.json')).version, 'patch'));
				break;
			}
			case 'finish':
			{
				throw new Error('not implemented');
			}
			default: {
				throw new Error('Specify hotfix opertion (start|finish)');
			}
		}
	}
}

function hook(name) {
	var source = path.resolve(gitHooks, name);
	var destination = path.resolve(cwd, '.git', 'hooks', path.basename(name, '.js'));
	shell.exec('ln -fs ' + source + ' ' + destination);
}

function release(version) {
	shell.exec('sh ' + gitflow + ' release start ' + version);
	//hook should fire with version bump
	shell.exec('sh ' + gitflow + ' release finish -f ' + version);
}

function hotfix(version) {
	shell.exec('sh ' + gitflow + ' hotfix start ' + version);
}