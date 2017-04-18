#!/bin/bash

# this was all lost... redo Xvfb

killall -9 chrome;
pkill -9 Xvfb
sleep 1;
Xvfb :99 -screen 0 '1280x1024x16' -ac &> /dev/null &
export DISPLAY=:99;
sleep 3;
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:9000 
