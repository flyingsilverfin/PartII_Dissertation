#!/bin/bash


killall chrome;

cd simulation;
python experiment_server.py &
sleep 5;

while :
do
    echo "Restarting chrome for next experiment"
    killall chrome;
    sleep 3;
    google-chrome --enable-precise-memory-info --js-flags="--expose-gc" http://localhost:8000
    sleep 15
    echo "finished"
done