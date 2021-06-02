// package: huddly
// file: proto/huddly.proto

import * as jspb from "google-protobuf";
import * as google_protobuf_empty_pb from "google-protobuf/google/protobuf/empty_pb";
import * as google_protobuf_timestamp_pb from "google-protobuf/google/protobuf/timestamp_pb";

export class CropIndexStatusRequest extends jspb.Message {
  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CropIndexStatusRequest.AsObject;
  static toObject(includeInstance: boolean, msg: CropIndexStatusRequest): CropIndexStatusRequest.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CropIndexStatusRequest, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CropIndexStatusRequest;
  static deserializeBinaryFromReader(message: CropIndexStatusRequest, reader: jspb.BinaryReader): CropIndexStatusRequest;
}

export namespace CropIndexStatusRequest {
  export type AsObject = {
  }
}

export class CropIndexStatusResponse extends jspb.Message {
  getCropIndex(): number;
  setCropIndex(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CropIndexStatusResponse.AsObject;
  static toObject(includeInstance: boolean, msg: CropIndexStatusResponse): CropIndexStatusResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CropIndexStatusResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CropIndexStatusResponse;
  static deserializeBinaryFromReader(message: CropIndexStatusResponse, reader: jspb.BinaryReader): CropIndexStatusResponse;
}

export namespace CropIndexStatusResponse {
  export type AsObject = {
    cropIndex: number,
  }
}

export class Rect extends jspb.Message {
  getXCenter(): number;
  setXCenter(value: number): void;

  getYCenter(): number;
  setYCenter(value: number): void;

  getZoomFactor(): number;
  setZoomFactor(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Rect.AsObject;
  static toObject(includeInstance: boolean, msg: Rect): Rect.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Rect, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Rect;
  static deserializeBinaryFromReader(message: Rect, reader: jspb.BinaryReader): Rect;
}

export namespace Rect {
  export type AsObject = {
    xCenter: number,
    yCenter: number,
    zoomFactor: number,
  }
}

export class Range extends jspb.Message {
  getMin(): number;
  setMin(value: number): void;

  getMax(): number;
  setMax(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Range.AsObject;
  static toObject(includeInstance: boolean, msg: Range): Range.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Range, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Range;
  static deserializeBinaryFromReader(message: Range, reader: jspb.BinaryReader): Range;
}

export namespace Range {
  export type AsObject = {
    min: number,
    max: number,
  }
}

export class VideoFormats extends jspb.Message {
  clearFormatsList(): void;
  getFormatsList(): Array<VideoFormats.Format>;
  setFormatsList(value: Array<VideoFormats.Format>): void;
  addFormats(value?: VideoFormats.Format, index?: number): VideoFormats.Format;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): VideoFormats.AsObject;
  static toObject(includeInstance: boolean, msg: VideoFormats): VideoFormats.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: VideoFormats, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): VideoFormats;
  static deserializeBinaryFromReader(message: VideoFormats, reader: jspb.BinaryReader): VideoFormats;
}

export namespace VideoFormats {
  export type AsObject = {
    formatsList: Array<VideoFormats.Format.AsObject>,
  }

  export class Format extends jspb.Message {
    getWidth(): number;
    setWidth(value: number): void;

    getHeight(): number;
    setHeight(value: number): void;

    hasZoom(): boolean;
    clearZoom(): void;
    getZoom(): Range | undefined;
    setZoom(value?: Range): void;

    hasDzoom(): boolean;
    clearDzoom(): void;
    getDzoom(): Range | undefined;
    setDzoom(value?: Range): void;

    hasPan(): boolean;
    clearPan(): void;
    getPan(): Range | undefined;
    setPan(value?: Range): void;

    hasTilt(): boolean;
    clearTilt(): void;
    getTilt(): Range | undefined;
    setTilt(value?: Range): void;

    getType(): VideoTypeMap[keyof VideoTypeMap];
    setType(value: VideoTypeMap[keyof VideoTypeMap]): void;

    getUri(): string;
    setUri(value: string): void;

    getFps(): number;
    setFps(value: number): void;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Format.AsObject;
    static toObject(includeInstance: boolean, msg: Format): Format.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Format, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Format;
    static deserializeBinaryFromReader(message: Format, reader: jspb.BinaryReader): Format;
  }

  export namespace Format {
    export type AsObject = {
      width: number,
      height: number,
      zoom?: Range.AsObject,
      dzoom?: Range.AsObject,
      pan?: Range.AsObject,
      tilt?: Range.AsObject,
      type: VideoTypeMap[keyof VideoTypeMap],
      uri: string,
      fps: number,
    }
  }
}

export class IndexedTransitions extends jspb.Message {
  clearStartingIndexList(): void;
  getStartingIndexList(): Array<number>;
  setStartingIndexList(value: Array<number>): void;
  addStartingIndex(value: number, index?: number): number;

  clearTransitionList(): void;
  getTransitionList(): Array<IndexedTransitions.Transition>;
  setTransitionList(value: Array<IndexedTransitions.Transition>): void;
  addTransition(value?: IndexedTransitions.Transition, index?: number): IndexedTransitions.Transition;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IndexedTransitions.AsObject;
  static toObject(includeInstance: boolean, msg: IndexedTransitions): IndexedTransitions.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IndexedTransitions, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IndexedTransitions;
  static deserializeBinaryFromReader(message: IndexedTransitions, reader: jspb.BinaryReader): IndexedTransitions;
}

export namespace IndexedTransitions {
  export type AsObject = {
    startingIndexList: Array<number>,
    transitionList: Array<IndexedTransitions.Transition.AsObject>,
  }

  export class Transition extends jspb.Message {
    clearCropsList(): void;
    getCropsList(): Array<IndexedTransitions.Transition.Crop>;
    setCropsList(value: Array<IndexedTransitions.Transition.Crop>): void;
    addCrops(value?: IndexedTransitions.Transition.Crop, index?: number): IndexedTransitions.Transition.Crop;

    serializeBinary(): Uint8Array;
    toObject(includeInstance?: boolean): Transition.AsObject;
    static toObject(includeInstance: boolean, msg: Transition): Transition.AsObject;
    static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
    static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
    static serializeBinaryToWriter(message: Transition, writer: jspb.BinaryWriter): void;
    static deserializeBinary(bytes: Uint8Array): Transition;
    static deserializeBinaryFromReader(message: Transition, reader: jspb.BinaryReader): Transition;
  }

  export namespace Transition {
    export type AsObject = {
      cropsList: Array<IndexedTransitions.Transition.Crop.AsObject>,
    }

    export class Crop extends jspb.Message {
      hasRect(): boolean;
      clearRect(): void;
      getRect(): Rect | undefined;
      setRect(value?: Rect): void;

      getCropIndex(): number;
      setCropIndex(value: number): void;

      serializeBinary(): Uint8Array;
      toObject(includeInstance?: boolean): Crop.AsObject;
      static toObject(includeInstance: boolean, msg: Crop): Crop.AsObject;
      static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
      static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
      static serializeBinaryToWriter(message: Crop, writer: jspb.BinaryWriter): void;
      static deserializeBinary(bytes: Uint8Array): Crop;
      static deserializeBinaryFromReader(message: Crop, reader: jspb.BinaryReader): Crop;
    }

    export namespace Crop {
      export type AsObject = {
        rect?: Rect.AsObject,
        cropIndex: number,
      }
    }
  }
}

export class IndexedTransitionsResponse extends jspb.Message {
  getChosenStartingIndex(): number;
  setChosenStartingIndex(value: number): void;

  hasCurrentPosition(): boolean;
  clearCurrentPosition(): void;
  getCurrentPosition(): Rect | undefined;
  setCurrentPosition(value?: Rect): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): IndexedTransitionsResponse.AsObject;
  static toObject(includeInstance: boolean, msg: IndexedTransitionsResponse): IndexedTransitionsResponse.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: IndexedTransitionsResponse, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): IndexedTransitionsResponse;
  static deserializeBinaryFromReader(message: IndexedTransitionsResponse, reader: jspb.BinaryReader): IndexedTransitionsResponse;
}

export namespace IndexedTransitionsResponse {
  export type AsObject = {
    chosenStartingIndex: number,
    currentPosition?: Rect.AsObject,
  }
}

export class CurrentPtzCrop extends jspb.Message {
  hasCurrentCrop(): boolean;
  clearCurrentCrop(): void;
  getCurrentCrop(): Rect | undefined;
  setCurrentCrop(value?: Rect): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CurrentPtzCrop.AsObject;
  static toObject(includeInstance: boolean, msg: CurrentPtzCrop): CurrentPtzCrop.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CurrentPtzCrop, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CurrentPtzCrop;
  static deserializeBinaryFromReader(message: CurrentPtzCrop, reader: jspb.BinaryReader): CurrentPtzCrop;
}

export namespace CurrentPtzCrop {
  export type AsObject = {
    currentCrop?: Rect.AsObject,
  }
}

export class Chunk extends jspb.Message {
  getContent(): Uint8Array | string;
  getContent_asU8(): Uint8Array;
  getContent_asB64(): string;
  setContent(value: Uint8Array | string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Chunk.AsObject;
  static toObject(includeInstance: boolean, msg: Chunk): Chunk.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Chunk, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Chunk;
  static deserializeBinaryFromReader(message: Chunk, reader: jspb.BinaryReader): Chunk;
}

export namespace Chunk {
  export type AsObject = {
    content: Uint8Array | string,
  }
}

export class DeviceVersion extends jspb.Message {
  getVersion(): string;
  setVersion(value: string): void;

  getVersionState(): VersionStateMap[keyof VersionStateMap];
  setVersionState(value: VersionStateMap[keyof VersionStateMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeviceVersion.AsObject;
  static toObject(includeInstance: boolean, msg: DeviceVersion): DeviceVersion.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeviceVersion, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeviceVersion;
  static deserializeBinaryFromReader(message: DeviceVersion, reader: jspb.BinaryReader): DeviceVersion;
}

export namespace DeviceVersion {
  export type AsObject = {
    version: string,
    versionState: VersionStateMap[keyof VersionStateMap],
  }
}

export class PTZ extends jspb.Message {
  getPan(): number;
  setPan(value: number): void;

  getTilt(): number;
  setTilt(value: number): void;

  getZoom(): number;
  setZoom(value: number): void;

  getTrans(): number;
  setTrans(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): PTZ.AsObject;
  static toObject(includeInstance: boolean, msg: PTZ): PTZ.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: PTZ, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): PTZ;
  static deserializeBinaryFromReader(message: PTZ, reader: jspb.BinaryReader): PTZ;
}

export namespace PTZ {
  export type AsObject = {
    pan: number,
    tilt: number,
    zoom: number,
    trans: number,
  }
}

export class DeviceName extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeviceName.AsObject;
  static toObject(includeInstance: boolean, msg: DeviceName): DeviceName.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeviceName, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeviceName;
  static deserializeBinaryFromReader(message: DeviceName, reader: jspb.BinaryReader): DeviceName;
}

export namespace DeviceName {
  export type AsObject = {
    name: string,
  }
}

export class BootSlot extends jspb.Message {
  getSlot(): SlotMap[keyof SlotMap];
  setSlot(value: SlotMap[keyof SlotMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): BootSlot.AsObject;
  static toObject(includeInstance: boolean, msg: BootSlot): BootSlot.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: BootSlot, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): BootSlot;
  static deserializeBinaryFromReader(message: BootSlot, reader: jspb.BinaryReader): BootSlot;
}

export namespace BootSlot {
  export type AsObject = {
    slot: SlotMap[keyof SlotMap],
  }
}

export class DeviceStatus extends jspb.Message {
  getMessage(): string;
  setMessage(value: string): void;

  getCode(): StatusCodeMap[keyof StatusCodeMap];
  setCode(value: StatusCodeMap[keyof StatusCodeMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): DeviceStatus.AsObject;
  static toObject(includeInstance: boolean, msg: DeviceStatus): DeviceStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: DeviceStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): DeviceStatus;
  static deserializeBinaryFromReader(message: DeviceStatus, reader: jspb.BinaryReader): DeviceStatus;
}

export namespace DeviceStatus {
  export type AsObject = {
    message: string,
    code: StatusCodeMap[keyof StatusCodeMap],
  }
}

export class Ipv4Config extends jspb.Message {
  getAddress(): number;
  setAddress(value: number): void;

  getBits(): number;
  setBits(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Ipv4Config.AsObject;
  static toObject(includeInstance: boolean, msg: Ipv4Config): Ipv4Config.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Ipv4Config, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Ipv4Config;
  static deserializeBinaryFromReader(message: Ipv4Config, reader: jspb.BinaryReader): Ipv4Config;
}

export namespace Ipv4Config {
  export type AsObject = {
    address: number,
    bits: number,
  }
}

export class Temperature extends jspb.Message {
  getName(): string;
  setName(value: string): void;

  getValue(): number;
  setValue(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Temperature.AsObject;
  static toObject(includeInstance: boolean, msg: Temperature): Temperature.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Temperature, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Temperature;
  static deserializeBinaryFromReader(message: Temperature, reader: jspb.BinaryReader): Temperature;
}

export namespace Temperature {
  export type AsObject = {
    name: string,
    value: number,
  }
}

export class Temperatures extends jspb.Message {
  clearTemperaturesList(): void;
  getTemperaturesList(): Array<Temperature>;
  setTemperaturesList(value: Array<Temperature>): void;
  addTemperatures(value?: Temperature, index?: number): Temperature;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Temperatures.AsObject;
  static toObject(includeInstance: boolean, msg: Temperatures): Temperatures.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Temperatures, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Temperatures;
  static deserializeBinaryFromReader(message: Temperatures, reader: jspb.BinaryReader): Temperatures;
}

export namespace Temperatures {
  export type AsObject = {
    temperaturesList: Array<Temperature.AsObject>,
  }
}

export class CNNStatus extends jspb.Message {
  getCode(): StatusCodeMap[keyof StatusCodeMap];
  setCode(value: StatusCodeMap[keyof StatusCodeMap]): void;

  hasFbeStatus(): boolean;
  clearFbeStatus(): void;
  getFbeStatus(): FBEStatus | undefined;
  setFbeStatus(value?: FBEStatus): void;

  hasAzStatus(): boolean;
  clearAzStatus(): void;
  getAzStatus(): AZStatus | undefined;
  setAzStatus(value?: AZStatus): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CNNStatus.AsObject;
  static toObject(includeInstance: boolean, msg: CNNStatus): CNNStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CNNStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CNNStatus;
  static deserializeBinaryFromReader(message: CNNStatus, reader: jspb.BinaryReader): CNNStatus;
}

export namespace CNNStatus {
  export type AsObject = {
    code: StatusCodeMap[keyof StatusCodeMap],
    fbeStatus?: FBEStatus.AsObject,
    azStatus?: AZStatus.AsObject,
  }
}

export class FBEStatus extends jspb.Message {
  getFbeEnabled(): boolean;
  setFbeEnabled(value: boolean): void;

  getNumIterations(): number;
  setNumIterations(value: number): void;

  getNumWeightsCalculated(): number;
  setNumWeightsCalculated(value: number): void;

  getCurrentFaceWeight(): number;
  setCurrentFaceWeight(value: number): void;

  clearPerFaceWeightList(): void;
  getPerFaceWeightList(): Array<number>;
  setPerFaceWeightList(value: Array<number>): void;
  addPerFaceWeight(value: number, index?: number): number;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): FBEStatus.AsObject;
  static toObject(includeInstance: boolean, msg: FBEStatus): FBEStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: FBEStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): FBEStatus;
  static deserializeBinaryFromReader(message: FBEStatus, reader: jspb.BinaryReader): FBEStatus;
}

export namespace FBEStatus {
  export type AsObject = {
    fbeEnabled: boolean,
    numIterations: number,
    numWeightsCalculated: number,
    currentFaceWeight: number,
    perFaceWeightList: Array<number>,
  }
}

export class AZStatus extends jspb.Message {
  getAzEnabled(): boolean;
  setAzEnabled(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): AZStatus.AsObject;
  static toObject(includeInstance: boolean, msg: AZStatus): AZStatus.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: AZStatus, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): AZStatus;
  static deserializeBinaryFromReader(message: AZStatus, reader: jspb.BinaryReader): AZStatus;
}

export namespace AZStatus {
  export type AsObject = {
    azEnabled: boolean,
  }
}

export class LogFile extends jspb.Message {
  getFile(): LogFilesMap[keyof LogFilesMap];
  setFile(value: LogFilesMap[keyof LogFilesMap]): void;

  getKeepLog(): boolean;
  setKeepLog(value: boolean): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): LogFile.AsObject;
  static toObject(includeInstance: boolean, msg: LogFile): LogFile.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: LogFile, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): LogFile;
  static deserializeBinaryFromReader(message: LogFile, reader: jspb.BinaryReader): LogFile;
}

export namespace LogFile {
  export type AsObject = {
    file: LogFilesMap[keyof LogFilesMap],
    keepLog: boolean,
  }
}

export class CnnFeature extends jspb.Message {
  getMode(): ModeMap[keyof ModeMap];
  setMode(value: ModeMap[keyof ModeMap]): void;

  getFeature(): FeatureMap[keyof FeatureMap];
  setFeature(value: FeatureMap[keyof FeatureMap]): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): CnnFeature.AsObject;
  static toObject(includeInstance: boolean, msg: CnnFeature): CnnFeature.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: CnnFeature, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): CnnFeature;
  static deserializeBinaryFromReader(message: CnnFeature, reader: jspb.BinaryReader): CnnFeature;
}

export namespace CnnFeature {
  export type AsObject = {
    mode: ModeMap[keyof ModeMap],
    feature: FeatureMap[keyof FeatureMap],
  }
}

export class Uptime extends jspb.Message {
  getUptime(): number;
  setUptime(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Uptime.AsObject;
  static toObject(includeInstance: boolean, msg: Uptime): Uptime.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Uptime, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Uptime;
  static deserializeBinaryFromReader(message: Uptime, reader: jspb.BinaryReader): Uptime;
}

export namespace Uptime {
  export type AsObject = {
    uptime: number,
  }
}

export class Timezone extends jspb.Message {
  getTimezone(): string;
  setTimezone(value: string): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Timezone.AsObject;
  static toObject(includeInstance: boolean, msg: Timezone): Timezone.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Timezone, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Timezone;
  static deserializeBinaryFromReader(message: Timezone, reader: jspb.BinaryReader): Timezone;
}

export namespace Timezone {
  export type AsObject = {
    timezone: string,
  }
}

export class Brightness extends jspb.Message {
  getBrightness(): number;
  setBrightness(value: number): void;

  serializeBinary(): Uint8Array;
  toObject(includeInstance?: boolean): Brightness.AsObject;
  static toObject(includeInstance: boolean, msg: Brightness): Brightness.AsObject;
  static extensions: {[key: number]: jspb.ExtensionFieldInfo<jspb.Message>};
  static extensionsBinary: {[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>};
  static serializeBinaryToWriter(message: Brightness, writer: jspb.BinaryWriter): void;
  static deserializeBinary(bytes: Uint8Array): Brightness;
  static deserializeBinaryFromReader(message: Brightness, reader: jspb.BinaryReader): Brightness;
}

export namespace Brightness {
  export type AsObject = {
    brightness: number,
  }
}

export interface VideoTypeMap {
  MAIN: 0;
  PREVIEW: 1;
}

export const VideoType: VideoTypeMap;

export interface VersionStateMap {
  UNKNOWNVERSIONSTATE: 0;
  VERIFIED: 1;
  UNVERIFIED: 2;
  RECOVERY: 3;
}

export const VersionState: VersionStateMap;

export interface StatusCodeMap {
  UNKNOWN: 0;
  OK: 1;
  FAILED: 2;
}

export const StatusCode: StatusCodeMap;

export interface SlotMap {
  A: 0;
  B: 1;
  C: 2;
  UNKNOWNSLOT: 3;
}

export const Slot: SlotMap;

export interface LogFilesMap {
  APP: 0;
  MYRIAD: 1;
  DMESG: 2;
}

export const LogFiles: LogFilesMap;

export interface ModeMap {
  START: 0;
  STOP: 1;
}

export const Mode: ModeMap;

export interface FeatureMap {
  FACEBASEDEXPOSURE: 0;
  AUTOZOOM: 1;
}

export const Feature: FeatureMap;

