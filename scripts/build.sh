#!/usr/bin/env bash

set -eu

BASEDIR=$(dirname "$0")
cd ${BASEDIR}/../

mkdir -p ./src/proto ./lib/src/proto
cp ./src/proto/* ./lib/src/proto

npm run build-ts
npm run tslint
