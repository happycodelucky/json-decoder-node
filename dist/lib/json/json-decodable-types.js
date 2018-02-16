"use strict";
/**
 * @module json-decoder
 *
 * JSON specific types an interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("../decodable-types"), exports);
/**
 * Type assertion for JsonConvertable types
 * @param type - type to check for conformance
 */
function isJSONConvertable(type) {
    return 'fromJSON' in type;
}
exports.isJSONConvertable = isJSONConvertable;
//# sourceMappingURL=json-decodable-types.js.map