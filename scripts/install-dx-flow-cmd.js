var shell = require('shelljs');
var path = require('path');
var fs = require('fs');

var root = path.resolve(__filename, '..', '..');
var cwd = process.cwd();

if (root !== cwd) {
	//link only if not run it own directory
	var bin = path.resolve(root, '..', '.bin');

	var source = path.resolve(root, 'dx-flow.cmd');
	var destination = path.resolve(root, '..', '.bin', 'dx-flow.cmd');
	shell.exec('ln -fs ' + source + ' ' + destination);
}