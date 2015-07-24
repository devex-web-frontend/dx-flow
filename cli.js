var app = require('commander');

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');
var semver = require('semver');

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
	.description('Install git hook by its name (by default install all hooks)')
	.action(function(name, options) {
		if (name) {
			//exact hook name
			hook(name);
		} else {
			//iterate
			fs.readdirSync(gitHooks).forEach(function(name) {
				hook(path.basename(name, '.js'));
			});
		}
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
		var args = process.argv.slice(2).join(' ');
		shell.exec('sh ' + gitflow + ' ' + args);
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
	var source = path.resolve(gitHooks, name + '.js');
	var destination = path.resolve(cwd, '.git', 'hooks', name);
	shell.exec('ln -fs ' + source + ' ' + destination);
}