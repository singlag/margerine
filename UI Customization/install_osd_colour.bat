@echo off
echo You can continue if your DJI device connected and ADB enabled
echo Modify by Gary Kan 
echo Press enter to install Colour OSD to V1 Goggles...
Pause

@echo on
adb push osd_colour /blackbox
adb shell chmod 755 /blackbox/osd_colour/*.sh
@echo off

pause