#!/usr/bin/env bash

set -eux

BASEDIR=$(dirname "$0")
cd ${BASEDIR}

rm -rf ./lib
mkdir -p ./lib


# Path to this plugin, Note this must be an abolsute path on Windows
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"
# Path to the grpc_node_plugin
PROTOC_GEN_GRPC_PATH="./node_modules/.bin/grpc_tools_node_protoc_plugin"

protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --plugin="protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH}" \
    --js_out="import_style=commonjs,binary:./lib" \
    --ts_out="service=grpc-node,mode=grpc-js:./lib" \
    --grpc_out="grpc_js:./lib" \
    proto/*.proto

