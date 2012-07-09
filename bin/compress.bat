@echo off
cd %~dp0/../js
copy /b datatypes.js+jsscratch.js+scratchio.js+jdataview.js tmp.js
java -jar %~dp0/yuicompressor-2.4.7.jar tmp.js -o jsscratch.min.js
del tmp.js
pause