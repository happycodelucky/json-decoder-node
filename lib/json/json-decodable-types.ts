/**
 * @module json-decoder
 * 
 * JSON specific types an interfaces
 */

import { ArrayConvertable, ConvertableBasicType, ConvertableBasicConstructionType} from '../decodable-types'
import { ConvertableCollectionType, ConvertableType } from '../decodable-types'
export * from '../decodable-types'

/**
 * JSON convertable type
 */
export interface JsonConvertable<T = any> {
    /**
     * Converts an object from JSON
     * @param json - JSON object
     */
    fromJSON(json: Object): T | null | undefined
}

/**
 * JSON convertable function
 */
export interface JsonConvertableFunction<T = any> {
    /**
     * Converts an object from a JSON object
     * @param json - JSON object
     * @return Converted object or null/undefined
     */
    (json: Object): T | null | undefined
}

/**
 * Type assertion for JsonConvertable types
 * @param type - type to check for conformance
 */
export function isJSONConvertable(type: any): type is JsonConvertable {
    return 'fromJSON' in type
}

/**
 * Decodable collection types allowed in marshalling
 */
export interface JsonConvertableCollectionType {
    /**
     * Collection type
     */
    '0': typeof Array | typeof Set | typeof Map | ArrayConvertable<ConvertableBasicType>

    /**
     * Element type
     */
    '1'?: ConvertableBasicConstructionType | JsonConvertableFunction | JsonConvertable,
}

/**
 * JSON decodable types allowed in marshalling
 */
export type JsonDecodableType = ConvertableBasicConstructionType | JsonConvertable | JsonConvertableCollectionType