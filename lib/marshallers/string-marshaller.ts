/**
 * @module json-decoder
 */

/**
 * Converts a JSON value to a String, if possible
 *
 * @param value - a value to convert to a string
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A string, or undefined if the value could not be converted
 */
export function toString(value: any, strict: boolean = false): string | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        if (strict) {
            throw new TypeError(`'null' cannot be converted to a String`)
        }
        return undefined
    }

    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return toString(value[0], strict)
        } else {
            return undefined
        }
    }    

    if (typeof value === 'string') {
        return value
    }

    return value.toString()
}
