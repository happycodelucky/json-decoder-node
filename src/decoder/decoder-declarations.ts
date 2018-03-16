/**
 * @module json-decoder
 *
 * Declarations for the JSON decoder as used internally by the
 */

/**
 * Reflection metadata keys
 */
export const DecoderMetadataKeys = {
    /**
     * Metadata on the decodable class
     */
    decodable: Symbol.for('decoder.decodable'),
    /**
     * Decoder options set during declaration
     */
    decodableOptions: Symbol.for('decoder.options'),
    /**
     * Represents the decoder map as part of a class
     */
    decoderMap: Symbol.for('decoder.map'),
    /**
     * Decoder notifiers handlers
     */
    decoderNotifiers: Symbol.for('decoder.notifiers'),
    /**
     * Decoder factory function to provide alternative objects to decode on to
     */
    decoderFactory: Symbol.for('decoder.factory'),
    /**
     * Custom decoder function on the class or prototype
     */
    decoder: Symbol.for('decoder.decoder'),
    /**
     * Custom decoder completion function on class prototype
     */
    decoderCompleted: Symbol.for('decoder.decoderCompleted')
}

/**
 * Any target with a constructor function
 */
export interface DecoderConstructableTarget {
    constructor: Function

    [key: string]: any
}

/**
 * Any target with a name and prototype object
 */
export interface DecoderPrototypalTarget {
    name: string
    prototype: Object

    [key: string]: any
}

/**
 * Collection target, with potentially nested collection
 */
export interface DecoderPrototypalCollectionTarget {
    collection: DecoderPrototypalTarget
    element: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget
}

/**
 * Type guard for collection targets
 * @param target 
 */
export function isDecoderPrototypalCollectionTarget(target: any): target is DecoderPrototypalCollectionTarget {
    return 'collection' in target && 'element' in target
}