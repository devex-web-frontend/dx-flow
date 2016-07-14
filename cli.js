#!/usr/bin/env node

var app = require('commander');
var fs = require('fs');
var path = require('path');
var semver = require('semver');
var glob = require('glob');
var cp = require('child_process');

var CWD = process.cwd();
var ROOT = path.dirname(__filename);

var DX_FLOW_HOOKS_DIRECTORY = path.resolve(ROOT, 'hooks');
var GITFLOW_PATH = path.resolve(ROOT, 'gitflow', 'git-flow');
var LAUNCHER_PATH = path.resolve(ROOT, 'launcher.sh');
var AVAILABLE_HOOKS = getHooks(DX_FLOW_HOOKS_DIRECTORY);
var HOOKS_DIRECTORY_POSTFIX = '-hooks'; //this is used in launcher.sh
var DESTINATION_HOOKS_DIRECTORY = path.resolve(CWD, '.git', 'hooks');

var DESTINATION_PACKAGE_JSON = path.resolve(CWD, 'package.json');
var DESTINATION_BOWER_JSON = path.resolve(CWD, 'bower.json');

var bump = require(path.resolve(DX_FLOW_HOOKS_DIRECTORY, 'post-checkout/autobump.js'));

var BRANCH_MAP = {
	major: 'release',
	minor: 'release',
	patch: 'hotfix'
};

if (ROOT === CWD) {
	throw new Error('Do not run dx-flow in its own directory');
}

app
	.version(require(path.resolve(ROOT, 'package.json')).version, '')
	.usage('<command> [options]');

app
	.command('list')
	.description('Lists all available hooks')
	.action(function(options) {
		AVAILABLE_HOOKS.forEach(function(hook) {
			console.log(hook);
		});
	});

app
	.command('hook [name]')
	.description('Install hook by its name')
	.action(function(name, options) {
		if (!name) {
			throw new Error('Please specify hook name');
		}
		hook(name);
	});

app
	.command('clean')
	.description('Removes all hooks')
	.action(function(options) {
		getHooks(DESTINATION_HOOKS_DIRECTORY).forEach(function(name) {
			console.log('Removing hook', name + '...');
			var destination = path.resolve(DESTINATION_HOOKS_DIRECTORY, name);
			exec('rm ' + destination);
		});
		console.log('Done');
	});

app
	.command('install')
	.description('Installs npm dependencies')
	.action(function(options) {
		if (fs.existsSync(DESTINATION_PACKAGE_JSON)) {
			var packageJson = require(DESTINATION_PACKAGE_JSON);
			var dependencies = Object
				.keys(packageJson.dependencies)
				.map(key => `${key}@${packageJson.dependencies[key]}`)
				.join(' ');
			console.log('Installing', dependencies);
			exec('npm i ' + dependencies);
		}
	});

app
	.command('start <version>')
	.description('Starts new branch (release/hotfix) with bumped version from package.json (major|minor|patch)')
	.action(function(version, options) {
		if (['major', 'minor', 'patch'].indexOf(version) === -1) {
			throw new Error('Unknown version, should be one of (major|minor|patch)');
		}
		if (fs.existsSync(DESTINATION_PACKAGE_JSON)) {
			var packageJson = require(DESTINATION_PACKAGE_JSON);
			var bumpedVersion = semver.inc(packageJson.version, version);

			console.log('Starting ' + version + ' from ' + packageJson.version + ' to ' + bumpedVersion);
			gitflow(BRANCH_MAP[version] + ' start ' + bumpedVersion);

			var changedFiles = [DESTINATION_PACKAGE_JSON, DESTINATION_BOWER_JSON].filter(function(file) {
				return bump(file, bumpedVersion);
			});
			console.log('Bumped ' + changedFiles.join(' '));

			commit('bump version ' + bumpedVersion, changedFiles);
			console.log('Commited ' + changedFiles.join(' '));

			switch (version) {
				case 'major': //fall through
				case 'minor':
					gitflow(BRANCH_MAP[version] + ' finish ' + bumpedVersion + ' -n');
					break;
				case 'patch':
					break;
			}
		} else {
			throw new Error(DESTINATION_PACKAGE_JSON + ' is not found');
		}
	});

app
	.command('*')
	.description('Proxy to git-flow')
	.action(function(name, options) {
		return gitflow(process.argv.slice(2).join(' '));
	});

app
	.parse(process.argv);

if (!app.args.length) {
	app.help();
}

/**
 * Install hook by its name (without extension)
 * @param {String} name
 */
function hook(name) {
	var split = name.split('/');
	var namespace = split[0];
	var part = split[1];

	//check if hook exists
	var file = path.resolve(DX_FLOW_HOOKS_DIRECTORY, name);
	if (!fs.existsSync(file)) {
		throw new Error('Hook ' + name + ' not found!');
	}

	//resolve paths
	var destinationDirectory = path.resolve(DESTINATION_HOOKS_DIRECTORY, namespace + HOOKS_DIRECTORY_POSTFIX);

	//install launcher
	console.log('Installing launcher ' + namespace + '...');
	exec('ln -fs ' + LAUNCHER_PATH + ' ' + path.resolve(DESTINATION_HOOKS_DIRECTORY, namespace));

	//install hook
	console.log('Installing hook ' + name + '...');
	if (!fs.existsSync(destinationDirectory)) {
		exec('mkdir ' + destinationDirectory);
	}
	var destination = path.resolve(destinationDirectory, part);
	exec('ln -fs ' + file + ' ' + destination);
}

/**
 * Gets all available hooks
 * @param {String} directory
 * @returns {Array.<String>}
 */
function getHooks(directory) {
	return glob.sync(path.join(directory, '*/*.*')).map(function(file) {
		return path.relative(directory, file).replace(/\\/g, '/');
	});
}

/**
 * Launches gitflow with specified argument string, inherits stdio
 * @param {String} argsString
 * @returns {*}
 */
function gitflow(argsString) {
	return exec('bash ' + GITFLOW_PATH + ' ' + argsString);
}

/**
 * Synchronously executes passed command inheriting stdio
 * @param {String} command
 * @returns {*}
 */
function exec(command) {
	return cp.execSync(command, {
		stdio: 'inherit'
	});
}

/**
 * Commits specified files under specified message using git
 * @param {String} message
 * @param {Array.<String>} files
 */
function commit(message, files) {
	if (files.length !== 0) {
		var escapedMessage = '"' + message.replace(/"/g, '\"') + '"';
		var scapedFiles = '"' + files.join('" "') + '"';
		var gitDir = '--git-dir "' + CWD + '/.git"';
		exec('git ' + gitDir + ' commit -m ' + escapedMessage + ' ' + scapedFiles);
	}
}