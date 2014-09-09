#!/bin/bash

lsof -nP -iTCP -sTCP:LISTEN | grep $1 | awk '{ print $2 }' | xargs kill
