#!/usr/bin/env bash

set -eu

BASEDIR=$(dirname "$0")
cd ${BASEDIR}/../

# Path to this plugin, Note this must be an abolsute path on Windows (see #15)
PROTOC_GEN_TS_PATH="./node_modules/.bin/protoc-gen-ts"
# Path to the grpc_node_plugin
PROTOC_GEN_GRPC_PATH="./node_modules/.bin/grpc_tools_node_protoc_plugin"

# JavaScript code generating
protoc \
    --plugin="protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH}" \
    --js_out="import_style=commonjs,binary:./" \
    --grpc_out="grpc_js:./" \
    proto/huddly.proto

# Typescript code generating
protoc \
    --plugin="protoc-gen-ts=${PROTOC_GEN_TS_PATH}" \
    --plugin="protoc-gen-grpc=${PROTOC_GEN_GRPC_PATH}" \
    --js_out="import_style=commonjs,binary:./" \
    --ts_out="service=grpc-node,mode=grpc-js:./" \
    --grpc_out="grpc_js:./" \
    proto/huddly.proto
