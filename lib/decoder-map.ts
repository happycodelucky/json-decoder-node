/**
 * @module json-decoder
 *
 * Type and interfaces to support decoder mapping
 */

import 'reflect-metadata'
import { DecoderConstructableTarget, DecoderPrototypalTarget, DecoderMetadataKeys } from './decoder-declarations'

/**
 * Decoder map alias entry in a decoder configuration map
 */
export interface DecoderMapAliasEntry {
    /**
     * JSON property key
     */
    key: string
    /**
     * Type to marshal a property value to
     */
    type?: Object & DecoderConstructableTarget
    /**
     * Map function taking the marshaled value (array, object or scalar) and applies another level of mapping
     */
    mapFunction?: (value: any) => any
}

/**
 * Decoder map entry in a decoder configuration map
 */
export type DecoderMapEntry = DecoderMapAliasEntry | string

/**
 * Decoder configuration map
 * A key/entry pair for properties to map JSON properties to decoded object properties
 */
export interface DecoderMap {
    [key: string]: DecoderMapEntry
}

/**
 * JSON-Schema desclaration for a decoder map
 */
export interface DecoderMapSchema {
    /**
     * JSON schema declaration in a parsed JSON object
     */
    schema: Object
}

/**
 * Returns the decoder map for a given target class type
 *
 * @param target - target constructor function
 *
 * @return decoder map object to assign JSON decoding configuration to
 */
export function decoderMapForTarget(target: DecoderPrototypalTarget): DecoderMap {
    let map = Reflect.getOwnMetadata(DecoderMetadataKeys.decoderMap, target) || target[DecoderMetadataKeys.decoderMap]
    if (map) {
        return map
    }

    // Set an empty decoder map
    setDecoderMapForTarget(target, {})
    return Reflect.getOwnMetadata(DecoderMetadataKeys.decoderMap, target)!
}

/**
 * Overrides the decoder map for a given target class type
 *
 * @param target - target constructor function
 * @param decoderMap - decoder map to assign to the class type
 */
export function setDecoderMapForTarget(target: DecoderPrototypalTarget, decoderMap: DecoderMap) {
    Reflect.defineMetadata(DecoderMetadataKeys.decoderMap, decoderMap, target)
}
