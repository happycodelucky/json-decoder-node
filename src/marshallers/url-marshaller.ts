/**
 * @module json-decoder
 */

import { URL } from 'url'

/**
 * Converts a JSON value to an URL, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return An URL, or undefined if the value could not be converted
 */
export function toURL(value: any, strict: boolean = false): URL | undefined {
    if (value === undefined) {
        return undefined
    }

    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return toURL(value[0], strict)
        } else {
            return undefined
        }
    }

    if (typeof value !== 'string') {
        if (strict) {
            throw new TypeError(`${typeof value} cannot be converted to a URL`)
        }
        return undefined
    }

    try {
        return new URL(value)
    } catch {
        if (strict) {
            throw new TypeError(`'${value}' is not a valid URL`)
        }
        return undefined
    }
}
