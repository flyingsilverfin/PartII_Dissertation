#!/bin/bash


killall -9 chrome;
pkill -9 Xvfb;
sleep 0.5;
Xvfb :99 -ac -screen 0 1280x1024x16 &
export DISPLAY=:99
sleep 0.5;
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:9000 
