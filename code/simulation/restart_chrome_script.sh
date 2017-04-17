#!/bin/bash


killall chrome;
sleep 10;
google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:9000 &
