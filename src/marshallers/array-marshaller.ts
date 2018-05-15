/**
 * Converts a JSON value to an Array, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns an array, of the value, or the value itself.
 */
export function toArray(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): any[] | undefined {
    if (value === undefined) {
        return undefined
    }
    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to an Array')
        }

        return undefined
    }

    if (Array.isArray(value)) {
        if (itemMarshaller) {
            return value.map(item => itemMarshaller(item, strict))
        }

        return value
    }

    return [itemMarshaller ? itemMarshaller(value, strict) : value]
}
