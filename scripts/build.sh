#!/usr/bin/env bash

set -eu

BASEDIR=$(dirname "$0")
cd ${BASEDIR}/../

rm -rf ./src/proto ./lib
mkdir -p ./src/proto ./lib/src/proto
cp ./proto/* ./src/proto

npm run build-ts
npm run tslint
cp ./proto/*.js ./lib/src/proto
