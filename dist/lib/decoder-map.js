"use strict";
/**
 * @module json-decoder
 *
 * Type and interfaces to support decoder mapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const decoder_declarations_1 = require("./decoder-declarations");
/**
 * Returns the decoder map for a given target class type
 *
 * @param target - target constructor function
 *
 * @return decoder map object to assign JSON decoding configuration to
 */
function decoderMapForTarget(target) {
    let map = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target) || target[decoder_declarations_1.DecoderMetadataKeys.decoderMap];
    if (map) {
        return map;
    }
    // Set an empty decoder map
    setDecoderMapForTarget(target, {});
    return Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target);
}
exports.decoderMapForTarget = decoderMapForTarget;
/**
 * Overrides the decoder map for a given target class type
 *
 * @param target - target constructor function
 * @param decoderMap - decoder map to assign to the class type
 */
function setDecoderMapForTarget(target, decoderMap) {
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, decoderMap, target);
}
exports.setDecoderMapForTarget = setDecoderMapForTarget;
//# sourceMappingURL=decoder-map.js.map