#!/bin/bash
# This script can be used to manually build the docker images necessary to run the tests
# It should be executed from the tests folder

# It assumes that you previously built the module you're going to be testing
#   and that the modules artifacts are located one level up

if [ ! -d ./artifacts ]; then
  mkdir -p ./artifacts
fi

rm -rf ./artifacts/*

if [ -d ./results/reports ]; then
  rm -rf ./results/reports
fi

if [ -d ./results/screenshots ]; then
  rm -rf ./results/screenshots
fi

if [ -d ./results/videos ]; then
  rm -rf ./results/videos
fi

if [[ -e ../target ]]; then
    cp -R ../target/* ./artifacts/
    cp ./artifacts/*SNAPSHOT.jar ./artifacts/scheduled-publication-workflow-SNAPSHOT.jar
fi

docker build -t jahia/scheduled-publication-workflow-test:latest .
