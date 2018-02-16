"use strict";
/**
 * @module json-decoder
 *
 * Decoder basic types
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Type assertion for ArrayConvertable types
 * @param type - type to check for conformance
 */
function isArrayConvertable(type) {
    return 'fromArray' in type;
}
exports.isArrayConvertable = isArrayConvertable;
//# sourceMappingURL=decodable-types.js.map