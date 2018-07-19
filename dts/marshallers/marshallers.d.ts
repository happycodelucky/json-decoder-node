import { DecoderPrototypalTarget } from '../decoder/decoder-declarations';
export interface MarshallerFunction {
    (value: any, strict?: boolean): any;
}
export declare function marshallerForType(type: DecoderPrototypalTarget): ((value: any, strict?: boolean) => any) | undefined;
export interface CollectionMarshallerFunction {
    (value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): any;
}
export declare function collectionMarshallerForType(type: DecoderPrototypalTarget): CollectionMarshallerFunction | undefined;
