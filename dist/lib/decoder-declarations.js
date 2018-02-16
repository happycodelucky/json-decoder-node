"use strict";
/**
 * @module json-decoder
 *
 * Declarations for the JSON decoder as used internally by the
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Reflection metadata keys
 */
exports.DecoderMetadataKeys = {
    /**
     * Metadata on the decodable class
     */
    decodable: Symbol.for('decoder.decodable'),
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
    decoderCompleted: Symbol.for('decoder.decoderCompleted'),
};
//# sourceMappingURL=decoder-declarations.js.map