@IF EXIST "%~dp0\bash.exe" (
  "%~dp0\bash.exe"  "%~dp0\..\dx-flow\cli.sh" %*
) ELSE (
  @SETLOCAL
  @SET PATHEXT=%PATHEXT:;.JS;=;%

  @ECHO OFF
  @SET SCRIPT=%~dp0)
  @SET SCRIPT=%SCRIPT:\=/%
  @SET SCRIPT=%SCRIPT:.bin/=dx-flow/cli.sh%

  sh %SCRIPT% %*
  EXIT
)