/**
 * @module json-decoder
 *
 * Type and interfaces to support decoder mapping
 */
import { JsonObject } from '../json/json-decodable-types';
import { DecoderPrototypalCollectionTarget, DecoderPrototypalTarget } from './decoder-declarations';
/**
 * Decoder map alias entry in a decoder configuration map
 */
export interface DecoderMapEntry {
    /**
     * JSON property key
     */
    key: string;
    /**
     * Type to marshal a property value to
     */
    type?: object & (DecoderPrototypalTarget | DecoderPrototypalCollectionTarget);
    /**
     * Map function taking the marshaled value (array, object or scalar) and applies another level of mapping
     */
    mapFunction?(value: any, object: JsonObject): any;
}
/**
 * Decoder configuration map
 * A key/entry pair for properties to map JSON properties to decoded object properties
 */
export interface DecoderMap extends Record<string | number | symbol, DecoderMapEntry | undefined> {
}
/**
 * Returns the decoder map for a given target class type
 *
 * @param target - target constructor function
 *
 * @return decoder map object to assign JSON decoding configuration to
 */
export declare function decoderMapForTarget(target: DecoderPrototypalTarget): DecoderMap;
/**
 * Returns a decoder map entry given a entry key and a target class type
 *
 * @param key - property key on the target
 * @param target - target constructor function
 * @param decoderMap - decoder map to assign to the class type
 */
export declare function decoderMapEntryForTarget(key: string, target: DecoderPrototypalTarget): DecoderMapEntry;
