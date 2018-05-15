/**
 * @module json-decoder
 *
 * JSON specific types an interfaces
 */

export * from '../decoder/decodable-types'
import { ArrayConvertable, ConvertableBasicConstructionType, ConvertableBasicType } from '../decoder/decodable-types'

/**
 * JSON convertable type
 */
export interface JsonConvertable<T = any> {
    /**
     * Converts an object from JSON
     * @param json - JSON object
     */
    fromJSON(json: {}): T | null | undefined
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
    (json: JsonObject): T | null | undefined
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
    '1'?: ConvertableBasicConstructionType | JsonConvertableFunction | JsonConvertable
}

/**
 * JSON decodable types allowed in marshalling
 */
export type JsonDecodableType = ConvertableBasicConstructionType | JsonConvertable | JsonConvertableCollectionType

/**
 * Generic JSON object
 */
export interface JsonObject extends Record<string, any> {

}
