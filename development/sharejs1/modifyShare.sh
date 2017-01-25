#!/bin/bash

rm ./node_modules/share/bin/exampleserver 2>/dev/null
rm ./node_modules/share/src/server/session.coffee 2>/dev/null
cp $PWD/modified_sharejs_modules/sharejs-server $PWD/node_modules/share/bin/server 
cp $PWD/modified_sharejs_modules/session.coffee $PWD/node_modules/share/src/server/session.coffee 