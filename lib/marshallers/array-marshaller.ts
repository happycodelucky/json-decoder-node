/**
 * @module json-decoder
 */

/**
 * Converts a JSON value to an Array, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns an array, of the value, or the value itself.
 */
export function toArray(value: any, strict: boolean = false): Array<any> | undefined {
    if (value === undefined) {
        return undefined
    }

    if (Array.isArray(value)) {
        return value
    }

    return [value]
}
