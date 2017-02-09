#!/bin/bash


killall chrome;
sleep 5;

while :
do
    echo "Restarting chrome for next experiment"
    killall chrome;
    sleep 5;
    google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:9000 &
    sleep 15;
    echo "finished";
done