/**
 * Converts a JSON value to a Number, if possible
 *
 * @param value - value to convert to a Number
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return parsed number, NaN, or undefined
 */
export function toNumber(value: any, strict: boolean = false): number | undefined {
    if (value === undefined) {
        return undefined
    }

    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`)
        }

        if (value.length > 0) {
            return toNumber(value[0], strict)
        } else {
            return undefined
        }
    }

    if (typeof value === 'number') {
        return value
    }

    if (typeof value === 'boolean') {
        return value ? 1 : 0
    } else if (typeof value === 'string') {
        let trimmedValue = value.trim()
        const prefixMatch = /^([-+])?[ \t]*/.exec(trimmedValue)
        if (prefixMatch && prefixMatch[0].length) {
            trimmedValue = trimmedValue.slice(prefixMatch[0].length)
        }
        // tslint:disable:no-magic-numbers
        const factor = prefixMatch && prefixMatch[1] === '-' ? -1 : 1

        if (trimmedValue.startsWith('0x') || trimmedValue.startsWith('0X')) {
            const matches = /^[0-9A-F]+$/i.exec(trimmedValue.slice(2))
            if (matches) {
                // tslint:disable:no-magic-numbers
                return Number.parseInt(matches[0], 16) * factor
            }
        } else if (trimmedValue.startsWith('0b') || trimmedValue.startsWith('0B')) {
            const matches = /^[01]+$/.exec(trimmedValue.slice(2))
            if (matches) {
                // tslint:disable:no-magic-numbers
                return Number.parseInt(matches[0], 2) * factor
            }
        } else {
            const matches = /^[0-9,]*([\.])?([0-9]+)?([Ee][+-]?[0-9]+)?$/.exec(trimmedValue)
            if (matches) {
                const matchedValue = matches[0].replace(/,/g, '')
                if (matches.length > 1) {
                    return Number.parseFloat(matchedValue) * factor
                } else {
                    // tslint:disable:no-magic-numbers
                    return Number.parseInt(matchedValue, 10) * factor
                }
            }
        }

        if (strict) {
            throw new TypeError(`'${value}' does not represent a Number`)
        }
    }

    if (strict) {
        throw new TypeError(`'${typeof value} cannot be converted to a Number`)
    }

    return Number.NaN
}
