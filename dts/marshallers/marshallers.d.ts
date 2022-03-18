/**
 * Registery of types to associated marshallers
 */
import { DecoderPrototypalTarget } from '../decoder/decoder-declarations';
/**
 * Function interface for simple marshallers
 */
export interface MarshallerFunction {
    (value: any, strict?: boolean): any;
}
/**
 * Returns a marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export declare function marshallerForType(type: DecoderPrototypalTarget): ((value: any, strict?: boolean) => any) | undefined;
/**
 * Function interface for collection based marshallers
 */
export interface CollectionMarshallerFunction {
    (value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): any;
}
/**
 * Returns a collection marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export declare function collectionMarshallerForType(type: DecoderPrototypalTarget): CollectionMarshallerFunction | undefined;
