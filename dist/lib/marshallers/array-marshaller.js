"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Converts a JSON value to an Array, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns an array, of the value, or the value itself.
 */
function toArray(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}
exports.toArray = toArray;
//# sourceMappingURL=array-marshaller.js.map