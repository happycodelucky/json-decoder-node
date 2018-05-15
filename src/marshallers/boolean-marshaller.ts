/**
 * Converts a JSON value to a Boolean, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param strict - when true, parsing is strict and returns undefined if not able to be parsed
 *
 * @return parsed Boolean or undefined
 */
export function toBoolean(value: any, strict: boolean = false): boolean | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        return false
    }

    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`)
        }

        if (value.length > 0) {
            value = toBoolean(value[0], strict)
        } else {
            return undefined
        }
    }

    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'string') {
        if (/^[ \t]*(true|yes|1)[ \t]*$/i.test(value)) {
            return true
        }
        // Strict requires exact match to false
        if (/^[ \t]*(false|no|0)[ \t]*$/i.test(value)) {
            return false
        }

        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`)
        }

        return undefined
    } else if (typeof value === 'number') {
        if (!strict) {
            return value !== 0
        }

        if (value === 0) {
            return false
        } else if (value === 1) {
            return true
        }

        throw new TypeError(`'${value}' does not represent a Boolean`)
    }

    if (strict) {
        throw new TypeError(`'${typeof value}' cannot be converted to a Boolean`)
    }

    return undefined
}
