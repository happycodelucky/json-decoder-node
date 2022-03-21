/**
 * Declarations for the JSON decoder as used internally by the
 */
/**
 * Reflection metadata keys
 */
export declare const DecoderMetadataKeys: {
    /**
     * Metadata on the decodable class
     */
    decodable: symbol;
    /**
     * Decoder options set during declaration
     */
    decodableOptions: symbol;
    /**
     * Represents the decoder map as part of a class
     */
    decoderMap: symbol;
    /**
     * Decoder notifiers handlers
     */
    decoderNotifiers: symbol;
    /**
     * Decoder factory function to provide alternative objects to decode on to
     */
    decoderFactory: symbol;
    /**
     * Custom decoder function on the class or prototype
     */
    decoder: symbol;
    /**
     * Custom decoder completion function on class prototype
     */
    decoderCompleted: symbol;
};
/**
 * Any target with a constructor function
 */
export interface DecoderConstructableTarget extends Record<string, any> {
    constructor: Function;
}
/**
 * Any target with a name and prototype object
 */
export interface DecoderPrototypalTarget extends Record<string, any> {
    name: string;
    prototype: object;
}
/**
 * Collection target, with potentially nested collection
 */
export interface DecoderPrototypalCollectionTarget {
    collection: DecoderPrototypalTarget;
    element: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget;
}
/**
 * Type guard for collection targets
 * @param target - target to test
 * @returns true if the target is a DecoderPrototypalCollectionTarget
 */
export declare function isDecoderPrototypalCollectionTarget(target: any): target is DecoderPrototypalCollectionTarget;
