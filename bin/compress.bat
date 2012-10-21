@echo off
cd %~dp0/../js
copy /b datatypes.js+jsscratch.js+scratchio.js+jdataview.js+blocks.js tmp.js
java -jar %~dp0/yuicompressor-2.4.7.jar tmp.js -o ../jsscratch.min.js
del tmp.js
cd ..
java -jar %~dp0/yuicompressor-2.4.7.jar player.css -o player.min.css
pause