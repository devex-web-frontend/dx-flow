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
			cp.execSync('rm ' + destination);
		});
		console.log('Done');
	});

app
	.command('bump <version>')
	.description('Returns bumped version from package.json (major|minor|patch)')
	.action(function(version, options) {
		if (['major', 'minor', 'patch'].indexOf(version) === -1) {
			throw new Error('Unknown version, should be one of (major|minor|patch)');
		}
		console.log(semver.inc(require(path.resolve(CWD, 'package.json')).version, version));
	});

app
	.command('*')
	.description('Proxy to git-flow')
	.action(function(name, options) {
		console.log(GITFLOW_PATH);
		return cp.execSync('bash ' + GITFLOW_PATH + ' ' + process.argv.slice(2).join(' '), {
			stdio: 'inherit'
		});
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
	cp.execSync('ln -fs ' + LAUNCHER_PATH + ' ' + path.resolve(DESTINATION_HOOKS_DIRECTORY, namespace));

	//install hook
	console.log('Installing hook ' + name + '...');
	if (!fs.existsSync(destinationDirectory)) {
		cp.execSync('mkdir ' + destinationDirectory);
	}
	var destination = path.resolve(destinationDirectory, part);
	cp.execSync('ln -fs ' + file + ' ' + destination);
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