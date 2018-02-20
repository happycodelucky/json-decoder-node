"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
/**
 * Converts a JSON value to an URL, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return An URL, or undefined if the value could not be converted
 */
function toURL(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (value instanceof url_1.URL) {
        return value;
    }
    if (typeof value !== 'string') {
        if (strict) {
            throw new TypeError(`${typeof value} cannot be converted to a URL`);
        }
        return undefined;
    }
    try {
        return new url_1.URL(value);
    }
    catch (_a) {
        if (strict) {
            throw new TypeError(`'${value}' is not a valid URL`);
        }
        return undefined;
    }
}
exports.toURL = toURL;
//# sourceMappingURL=url-marshaller.js.map