#!/bin/bash

killall chrome;
cd simulation
python experiment_server.py;
sleep 8;
google-chrome --enable-precise-memory-info http://localhost:8000