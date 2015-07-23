if (process.argv.length !== 3 && process.argv.length !== 4 && process.argv.length !== 5) {
	var error = 'Usage:\n' +
		'\tdx-flow type (release|hotfix) operation (start|finish) [version]\n' +
		'\tdx-flow hook [name]\n';
	throw new Error(error);
}

var fs = require('fs');
var path = require('path');
var shell = require('shelljs');

var type = process.argv[2];
var operation = process.argv[3];
var version = process.argv[4];

var cwd = process.cwd();
var root = path.dirname(__filename);

var gitHooks = path.resolve(root, 'hooks', 'git');

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
		if (!version) {
			//take version from package.json
		}
		break;
	}
	case 'hotfix':
	{
		break;
	}
}

function hook(name) {
	var source = path.resolve(gitHooks, name + '.js');
	var destination = path.resolve(cwd, '.git', 'hooks', name);
	shell.exec('ln -fs ' + source + ' ' + destination);
}