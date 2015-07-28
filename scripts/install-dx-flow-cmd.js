var shell = require('shelljs');
var path = require('path');

var root = path.resolve(__filename, '..', '..');
var cwd = process.cwd();

var source = path.resolve(root, 'dx-flow.cmd');
var destination = path.resolve(root, '..', '.bin', 'dx-flow.cmd');

shell.exec('ln -fs ' + source + ' ' + destination);