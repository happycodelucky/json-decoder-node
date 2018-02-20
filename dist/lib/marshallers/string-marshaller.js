"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Converts a JSON value to a String, if possible
 *
 * @param value - a value to convert to a string
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A string, or undefined if the value could not be converted
 */
function toString(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        if (strict) {
            throw new TypeError(`'null' cannot be converted to a String`);
        }
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.toString();
}
exports.toString = toString;
//# sourceMappingURL=string-marshaller.js.map