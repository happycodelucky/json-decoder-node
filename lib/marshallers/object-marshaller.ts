/**
 * @module json-decoder
 */

/**
 * Converts a JSON value to a Object, if possible
 *
 * @param value - value to convert to an Object
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return Object, null, or undefined
 */
export function toObject(value: any, strict: boolean = false): object | null | undefined {
    if (value === undefined || value === null) {
        return value
    }

    // Arrays are not treated as Objects here
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value
    }

    return { value }
}
