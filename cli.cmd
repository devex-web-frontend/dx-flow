@ECHO OFF
@SETLOCAL
IF NOT %1 == bump (
	IF NOT %1 == hook (
		sh %~dp0\gitflow\git-flow %*
		GOTO end
	)
)
node %~dp0\node-cli.js %*
:end
