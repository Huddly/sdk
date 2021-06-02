// GENERATED CODE -- DO NOT EDIT!

// Original file comments:
// TODO: import the protofile from falcon-interface???
'use strict';
var grpc = require('@grpc/grpc-js');
var proto_huddly_pb = require('../proto/huddly_pb.js');
var google_protobuf_empty_pb = require('google-protobuf/google/protobuf/empty_pb.js');
var google_protobuf_timestamp_pb = require('google-protobuf/google/protobuf/timestamp_pb.js');

function serialize_google_protobuf_Empty(arg) {
  if (!(arg instanceof google_protobuf_empty_pb.Empty)) {
    throw new Error('Expected argument of type google.protobuf.Empty');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Empty(buffer_arg) {
  return google_protobuf_empty_pb.Empty.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_google_protobuf_Timestamp(arg) {
  if (!(arg instanceof google_protobuf_timestamp_pb.Timestamp)) {
    throw new Error('Expected argument of type google.protobuf.Timestamp');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_google_protobuf_Timestamp(buffer_arg) {
  return google_protobuf_timestamp_pb.Timestamp.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_BootSlot(arg) {
  if (!(arg instanceof proto_huddly_pb.BootSlot)) {
    throw new Error('Expected argument of type huddly.BootSlot');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_BootSlot(buffer_arg) {
  return proto_huddly_pb.BootSlot.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Brightness(arg) {
  if (!(arg instanceof proto_huddly_pb.Brightness)) {
    throw new Error('Expected argument of type huddly.Brightness');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Brightness(buffer_arg) {
  return proto_huddly_pb.Brightness.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_CNNStatus(arg) {
  if (!(arg instanceof proto_huddly_pb.CNNStatus)) {
    throw new Error('Expected argument of type huddly.CNNStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_CNNStatus(buffer_arg) {
  return proto_huddly_pb.CNNStatus.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Chunk(arg) {
  if (!(arg instanceof proto_huddly_pb.Chunk)) {
    throw new Error('Expected argument of type huddly.Chunk');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Chunk(buffer_arg) {
  return proto_huddly_pb.Chunk.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_CnnFeature(arg) {
  if (!(arg instanceof proto_huddly_pb.CnnFeature)) {
    throw new Error('Expected argument of type huddly.CnnFeature');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_CnnFeature(buffer_arg) {
  return proto_huddly_pb.CnnFeature.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_CropIndexStatusResponse(arg) {
  if (!(arg instanceof proto_huddly_pb.CropIndexStatusResponse)) {
    throw new Error('Expected argument of type huddly.CropIndexStatusResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_CropIndexStatusResponse(buffer_arg) {
  return proto_huddly_pb.CropIndexStatusResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_CurrentPtzCrop(arg) {
  if (!(arg instanceof proto_huddly_pb.CurrentPtzCrop)) {
    throw new Error('Expected argument of type huddly.CurrentPtzCrop');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_CurrentPtzCrop(buffer_arg) {
  return proto_huddly_pb.CurrentPtzCrop.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_DeviceName(arg) {
  if (!(arg instanceof proto_huddly_pb.DeviceName)) {
    throw new Error('Expected argument of type huddly.DeviceName');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_DeviceName(buffer_arg) {
  return proto_huddly_pb.DeviceName.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_DeviceStatus(arg) {
  if (!(arg instanceof proto_huddly_pb.DeviceStatus)) {
    throw new Error('Expected argument of type huddly.DeviceStatus');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_DeviceStatus(buffer_arg) {
  return proto_huddly_pb.DeviceStatus.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_DeviceVersion(arg) {
  if (!(arg instanceof proto_huddly_pb.DeviceVersion)) {
    throw new Error('Expected argument of type huddly.DeviceVersion');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_DeviceVersion(buffer_arg) {
  return proto_huddly_pb.DeviceVersion.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_IndexedTransitions(arg) {
  if (!(arg instanceof proto_huddly_pb.IndexedTransitions)) {
    throw new Error('Expected argument of type huddly.IndexedTransitions');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_IndexedTransitions(buffer_arg) {
  return proto_huddly_pb.IndexedTransitions.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_IndexedTransitionsResponse(arg) {
  if (!(arg instanceof proto_huddly_pb.IndexedTransitionsResponse)) {
    throw new Error('Expected argument of type huddly.IndexedTransitionsResponse');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_IndexedTransitionsResponse(buffer_arg) {
  return proto_huddly_pb.IndexedTransitionsResponse.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Ipv4Config(arg) {
  if (!(arg instanceof proto_huddly_pb.Ipv4Config)) {
    throw new Error('Expected argument of type huddly.Ipv4Config');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Ipv4Config(buffer_arg) {
  return proto_huddly_pb.Ipv4Config.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_LogFile(arg) {
  if (!(arg instanceof proto_huddly_pb.LogFile)) {
    throw new Error('Expected argument of type huddly.LogFile');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_LogFile(buffer_arg) {
  return proto_huddly_pb.LogFile.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_PTZ(arg) {
  if (!(arg instanceof proto_huddly_pb.PTZ)) {
    throw new Error('Expected argument of type huddly.PTZ');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_PTZ(buffer_arg) {
  return proto_huddly_pb.PTZ.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Temperatures(arg) {
  if (!(arg instanceof proto_huddly_pb.Temperatures)) {
    throw new Error('Expected argument of type huddly.Temperatures');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Temperatures(buffer_arg) {
  return proto_huddly_pb.Temperatures.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Timezone(arg) {
  if (!(arg instanceof proto_huddly_pb.Timezone)) {
    throw new Error('Expected argument of type huddly.Timezone');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Timezone(buffer_arg) {
  return proto_huddly_pb.Timezone.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_Uptime(arg) {
  if (!(arg instanceof proto_huddly_pb.Uptime)) {
    throw new Error('Expected argument of type huddly.Uptime');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_Uptime(buffer_arg) {
  return proto_huddly_pb.Uptime.deserializeBinary(new Uint8Array(buffer_arg));
}

function serialize_huddly_VideoFormats(arg) {
  if (!(arg instanceof proto_huddly_pb.VideoFormats)) {
    throw new Error('Expected argument of type huddly.VideoFormats');
  }
  return Buffer.from(arg.serializeBinary());
}

function deserialize_huddly_VideoFormats(buffer_arg) {
  return proto_huddly_pb.VideoFormats.deserializeBinary(new Uint8Array(buffer_arg));
}


var HuddlyServiceService = exports.HuddlyServiceService = {
  upgradeDevice: {
    path: '/huddly.HuddlyService/UpgradeDevice',
    requestStream: true,
    responseStream: false,
    requestType: proto_huddly_pb.Chunk,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Chunk,
    requestDeserialize: deserialize_huddly_Chunk,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  upgradeVerify: {
    path: '/huddly.HuddlyService/UpgradeVerify',
    requestStream: true,
    responseStream: false,
    requestType: proto_huddly_pb.Chunk,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Chunk,
    requestDeserialize: deserialize_huddly_Chunk,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  reset: {
    path: '/huddly.HuddlyService/Reset',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getDeviceName: {
    path: '/huddly.HuddlyService/GetDeviceName',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceName,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceName,
    responseDeserialize: deserialize_huddly_DeviceName,
  },
  getDeviceVersion: {
    path: '/huddly.HuddlyService/GetDeviceVersion',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceVersion,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceVersion,
    responseDeserialize: deserialize_huddly_DeviceVersion,
  },
  getBootloaderVersion: {
    path: '/huddly.HuddlyService/GetBootloaderVersion',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceVersion,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceVersion,
    responseDeserialize: deserialize_huddly_DeviceVersion,
  },
  getDevicePackages: {
    path: '/huddly.HuddlyService/GetDevicePackages',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceVersion,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceVersion,
    responseDeserialize: deserialize_huddly_DeviceVersion,
  },
  getBootSlot: {
    path: '/huddly.HuddlyService/GetBootSlot',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.BootSlot,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_BootSlot,
    responseDeserialize: deserialize_huddly_BootSlot,
  },
  setBootSlot: {
    path: '/huddly.HuddlyService/SetBootSlot',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.BootSlot,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_BootSlot,
    requestDeserialize: deserialize_huddly_BootSlot,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  upgradeBootLoader: {
    path: '/huddly.HuddlyService/UpgradeBootLoader',
    requestStream: true,
    responseStream: false,
    requestType: proto_huddly_pb.Chunk,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Chunk,
    requestDeserialize: deserialize_huddly_Chunk,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  setIpv4: {
    path: '/huddly.HuddlyService/SetIpv4',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.Ipv4Config,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Ipv4Config,
    requestDeserialize: deserialize_huddly_Ipv4Config,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  setPTZ: {
    path: '/huddly.HuddlyService/SetPTZ',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.PTZ,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_PTZ,
    requestDeserialize: deserialize_huddly_PTZ,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getPTZ: {
    path: '/huddly.HuddlyService/GetPTZ',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.PTZ,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_PTZ,
    responseDeserialize: deserialize_huddly_PTZ,
  },
  getLogFiles: {
    path: '/huddly.HuddlyService/GetLogFiles',
    requestStream: false,
    responseStream: true,
    requestType: proto_huddly_pb.LogFile,
    responseType: proto_huddly_pb.Chunk,
    requestSerialize: serialize_huddly_LogFile,
    requestDeserialize: deserialize_huddly_LogFile,
    responseSerialize: serialize_huddly_Chunk,
    responseDeserialize: deserialize_huddly_Chunk,
  },
  eraseLogFile: {
    path: '/huddly.HuddlyService/EraseLogFile',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.LogFile,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_LogFile,
    requestDeserialize: deserialize_huddly_LogFile,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getTemperatures: {
    path: '/huddly.HuddlyService/GetTemperatures',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.Temperatures,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_Temperatures,
    responseDeserialize: deserialize_huddly_Temperatures,
  },
  resetPtzTransition: {
    path: '/huddly.HuddlyService/ResetPtzTransition',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getCropIndex: {
    path: '/huddly.HuddlyService/GetCropIndex',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.CropIndexStatusResponse,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_CropIndexStatusResponse,
    responseDeserialize: deserialize_huddly_CropIndexStatusResponse,
  },
  ptzTransition: {
    path: '/huddly.HuddlyService/PtzTransition',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.IndexedTransitions,
    responseType: proto_huddly_pb.IndexedTransitionsResponse,
    requestSerialize: serialize_huddly_IndexedTransitions,
    requestDeserialize: deserialize_huddly_IndexedTransitions,
    responseSerialize: serialize_huddly_IndexedTransitionsResponse,
    responseDeserialize: deserialize_huddly_IndexedTransitionsResponse,
  },
  getCurrentPtzCrop: {
    path: '/huddly.HuddlyService/GetCurrentPtzCrop',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.CurrentPtzCrop,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_CurrentPtzCrop,
    responseDeserialize: deserialize_huddly_CurrentPtzCrop,
  },
  setCnnFeature: {
    path: '/huddly.HuddlyService/SetCnnFeature',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.CnnFeature,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_CnnFeature,
    requestDeserialize: deserialize_huddly_CnnFeature,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  // @HuddlyOnly-NextLine
getCnnFeatureStatus: {
    path: '/huddly.HuddlyService/GetCnnFeatureStatus',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.CnnFeature,
    responseType: proto_huddly_pb.CNNStatus,
    requestSerialize: serialize_huddly_CnnFeature,
    requestDeserialize: deserialize_huddly_CnnFeature,
    responseSerialize: serialize_huddly_CNNStatus,
    responseDeserialize: deserialize_huddly_CNNStatus,
  },
  getUptime: {
    path: '/huddly.HuddlyService/GetUptime',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.Uptime,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_Uptime,
    responseDeserialize: deserialize_huddly_Uptime,
  },
  setTimezone: {
    path: '/huddly.HuddlyService/SetTimezone',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.Timezone,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Timezone,
    requestDeserialize: deserialize_huddly_Timezone,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getTimezone: {
    path: '/huddly.HuddlyService/GetTimezone',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.Timezone,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_Timezone,
    responseDeserialize: deserialize_huddly_Timezone,
  },
  setTime: {
    path: '/huddly.HuddlyService/SetTime',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_timestamp_pb.Timestamp,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_google_protobuf_Timestamp,
    requestDeserialize: deserialize_google_protobuf_Timestamp,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getTime: {
    path: '/huddly.HuddlyService/GetTime',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: google_protobuf_timestamp_pb.Timestamp,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_google_protobuf_Timestamp,
    responseDeserialize: deserialize_google_protobuf_Timestamp,
  },
  setBrightness: {
    path: '/huddly.HuddlyService/SetBrightness',
    requestStream: false,
    responseStream: false,
    requestType: proto_huddly_pb.Brightness,
    responseType: proto_huddly_pb.DeviceStatus,
    requestSerialize: serialize_huddly_Brightness,
    requestDeserialize: deserialize_huddly_Brightness,
    responseSerialize: serialize_huddly_DeviceStatus,
    responseDeserialize: deserialize_huddly_DeviceStatus,
  },
  getBrightness: {
    path: '/huddly.HuddlyService/GetBrightness',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.Brightness,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_Brightness,
    responseDeserialize: deserialize_huddly_Brightness,
  },
  getRawBuffer: {
    path: '/huddly.HuddlyService/GetRawBuffer',
    requestStream: false,
    responseStream: true,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.Chunk,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_Chunk,
    responseDeserialize: deserialize_huddly_Chunk,
  },
  getVideoFormats: {
    path: '/huddly.HuddlyService/GetVideoFormats',
    requestStream: false,
    responseStream: false,
    requestType: google_protobuf_empty_pb.Empty,
    responseType: proto_huddly_pb.VideoFormats,
    requestSerialize: serialize_google_protobuf_Empty,
    requestDeserialize: deserialize_google_protobuf_Empty,
    responseSerialize: serialize_huddly_VideoFormats,
    responseDeserialize: deserialize_huddly_VideoFormats,
  },
};

exports.HuddlyServiceClient = grpc.makeGenericClientConstructor(HuddlyServiceService);
