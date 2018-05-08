/**
 * Converts a JSON value to a Date, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A Date, or undefined if the value could not be converted
 */
export function toDate(value: any, strict: boolean = false): Date | undefined {
    if (value === undefined) {
        return undefined
    }

    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return toDate(value[0], strict)
        } else {
            return undefined
        }
    }

    if (typeof value === 'string') {
        const timestamp = Date.parse(value)
        if (Number.isNaN(timestamp)) {
            if (strict) {
                throw new TypeError(`'${value}' is not a valid URL`)
            }

            return undefined
        }

        return new Date(timestamp)
    }

    if (typeof value === 'number') {
        if (Number.isNaN(value) || value < 0) {
            if (strict) {
                throw new TypeError(`'${value}' is not a valid URL`)
            }

            return undefined
        }

        return new Date(value)
    }

    if (strict) {
        throw new TypeError(`'${value}' is not a valid URL`)
    }

    return undefined
}
