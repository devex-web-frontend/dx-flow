var app = require('commander');

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var semver = require('semver');
var glob = require('glob');

var cwd = process.cwd();
var root = path.dirname(__filename);

var gitHooks = path.resolve(root, 'hooks', 'git');
var gitflow = path.resolve(root, 'gitflow', 'git-flow');

if (root === cwd) {
	throw new Error('Do not run dx-flow in its own directory');
}

app
	.version(require(path.resolve(root, 'package.json')).version, '')
	.usage('<command> [options]');

app
	.command('hook [name]')
	.description('Installs hook by its name (by default install all hooks)')
	.action(function(name, options) {
		if (name) {
			//exact hook name
			hook(name);
		} else {
			//iterate
			fs.readdirSync(gitHooks).forEach(function(name) {
				hook(path.basename(name, path.extname(name)));
			});
		}
		console.log('Done');
	});

app
	.command('clean')
	.description('Removes all hooks')
	.action(function(options) {
		fs.readdirSync(gitHooks).forEach(function(name) {
			var hookName = path.basename(name, path.extname(name));
			var destination = path.resolve(cwd, '.git', 'hooks', hookName);
			console.log('Removing hook', hookName + '...');
			fs.unlink(destination, function(error) {
				if (error && error.code !== 'ENOENT') {
					throw error;
				}
			});
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
		console.log(semver.inc(require(path.resolve(cwd, 'package.json')).version, version));
	});

app
	.command('*')
	.description('Proxy to git-flow')
	.action(function(name, options) {
		throw new Error('You should not use node-cli.js as a proxy to gitflow, ' +
			'as it does not pass stdin through. ' +
			'Use cli.sh instead!');
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
	console.log('Installing hook ' + name + '...');
	var files = glob.sync(path.resolve(gitHooks, name) + '.*');
	if (files.length === 0) {
		throw new Error('Hook ' + name + ' not found!');
	}
	if (files.length > 1) {
		throw new Error('Too many ' + name + ' hooks found!');
	}
	var destination = path.resolve(cwd, '.git', 'hooks', name);
	shell.exec('ln -fs ' + files[0] + ' ' + destination);
}