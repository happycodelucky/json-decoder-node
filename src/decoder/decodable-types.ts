/**
 * @module json-decoder
 *
 * Decoder basic types
 */

// TODO: Remove
export interface ConvertableFunction {
    (value: any): any
}

/** */
export type ConvertableBasicType = Boolean | Number | String | Object
export type ConvertableBasicConstructionType =
    | typeof Boolean
    | typeof Number
    | typeof String
    | typeof Object
    | ConvertableFunction

/**
 * Array convertable type
 */
export interface ArrayConvertable<E, T = any> {
    fromArray(array: Array<E>): T | null | undefined
}

/**
 * Array convertable type
 */
export interface ArrayConvertableFunction<E, T = any> {
    (array: Array<E>): T | null | undefined
}

/**
 * Type assertion for ArrayConvertable types
 * @param type - type to check for conformance
 */
export function isArrayConvertable<E>(type: any): type is ArrayConvertable<E> {
    return 'fromArray' in type
}

/**
 * Decodable collection types allowed in marshalling
 */
export interface ConvertableCollectionType {
    /**
     * Collection type
     */
    '0':
        | typeof Array
        | typeof Set
        | typeof Map
        | ArrayConvertable<ConvertableBasicType>
        | ArrayConvertableFunction<ConvertableBasicType>

    /**
     * Element type
     */
    '1': ConvertableBasicConstructionType
}

/**
 * Decodable types allowed in marshalling
 */
export type ConvertableType = ConvertableBasicConstructionType | ConvertableCollectionType
