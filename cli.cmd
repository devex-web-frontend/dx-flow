@ECHO OFF
@SETLOCAL
IF NOT %1 == bump (
	IF NOT %1 == hook (
		IF NOT %1 == clean (
			sh %~dp0\gitflow\git-flow %*
			GOTO end
		)
	)
)
node %~dp0\node-cli.js %*
:end
