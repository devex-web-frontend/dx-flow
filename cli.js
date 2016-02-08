import app from 'commander';
import fs from 'fs';
import path from 'path';
import shell from 'shelljs';
import semver from 'semver';
import glob from 'glob';
import cp from 'child_process';

const CWD = process.cwd();
const ROOT = path.dirname(__filename);

const DX_FLOW_HOOKS_DIRECTORY = path.resolve(ROOT, 'hooks');
const GITFLOW_PATH = path.resolve(ROOT, 'gitflow', `git-flow`);
const LAUNCHER_PATH = path.resolve(ROOT, 'launcher.sh');
const AVAILABLE_HOOKS = getHooks(DX_FLOW_HOOKS_DIRECTORY);
const HOOKS_DIRECTORY_POSTFIX = '-hooks'; //this is used in launcher.sh
const DESTINATION_HOOKS_DIRECTORY = path.resolve(CWD, '.git', 'hooks');

if (ROOT === CWD) {
	throw new Error('Do not run dx-flow in its own directory');
}

app
	.version(require(path.resolve(ROOT, 'package.json')).version, '')
	.usage('<command> [options]');

app
	.command('list')
	.description('Lists all available hooks')
	.action(options => {
		AVAILABLE_HOOKS.forEach(hook => console.log(hook));
	});

app
	.command('hook [name]')
	.description('Install hook by its name')
	.action((name, options) => {
		if (!name) {
			throw new Error('Please specify hook name');
		}
		hook(name);
	});

app
	.command('clean')
	.description('Removes all hooks')
	.action(options => {
		getHooks(DESTINATION_HOOKS_DIRECTORY).forEach(name => {
			console.log('Removing hook', name + '...');
			var destination = path.resolve(DESTINATION_HOOKS_DIRECTORY, name);
			cp.execSync(`rm ${destination}`);
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
		return cp.execSync(`bash ${GITFLOW_PATH} ${process.argv.slice(2).join(' ')}`, {
			stdio: 'inherit'
		});
		//throw new Error('You should not use node-cli.js as a proxy to gitflow, ' +
		//	'as it does not pass stdin through. ' +
		//	'Use cli.sh instead!');
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
	const [namespace, part] = name.split('/');

	//check if hook exists
	const file = path.resolve(DX_FLOW_HOOKS_DIRECTORY, name);
	if (!fs.existsSync(file)) {
		throw new Error('Hook ' + name + ' not found!');
	}

	//resolve paths
	const destinationDirectory = path.resolve(DESTINATION_HOOKS_DIRECTORY, `${namespace}${HOOKS_DIRECTORY_POSTFIX}`);

	//install launcher
	console.log(`Installing launcher ${namespace}...`);
	cp.execSync(`ln -fs ${LAUNCHER_PATH} ${path.resolve(DESTINATION_HOOKS_DIRECTORY, namespace)}`);

	//install hook
	console.log('Installing hook ' + name + '...');
	if (!fs.existsSync(destinationDirectory)) {
		cp.execSync(`mkdir ${destinationDirectory}`);
	}
	const destination = path.resolve(destinationDirectory, part);
	cp.execSync(`ln -fs ${file} ${destination}`);
}

/**
 * Gets all available hooks
 * @param {String} directory
 * @returns {Array.<String>}
 */
function getHooks(directory) {
	return glob.sync(path.join(directory, '*/*.*')).map(file => {
		return path.relative(directory, file).replace(/\\/g, '/');
	});
}