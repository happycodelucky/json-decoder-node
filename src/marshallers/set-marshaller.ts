/**
 * Converts a JSON value to a Set, if possible.
 *
 * @param value - value to convert to a Set
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a set, of the value, or the value itself.
 */
export function toSet(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): Set<any> | undefined {
    if (value === undefined) {
        return undefined
    }

    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to a Set')
        }

        return undefined
    }

    if (Array.isArray(value)) {
        if (itemMarshaller) {
            value = value.map(item => itemMarshaller(item, strict))
        }

        return new Set(value)
    }

    const set = new Set()
    set.add(itemMarshaller ? itemMarshaller(value, strict) : value)

    return set
}
