/**
 * @module json-decoder
 */

/**
 * Converts a JSON value to a Map, if possible.
 *
 * @param value - value to convert to a Map
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a map, of the value, or the value itself.
 */
export function toMap(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): Map<String, any> | undefined {
    if (value === undefined ) {
        return undefined
    }
    if (value === null) {
        if (strict) {
            throw new TypeError(`'null' cannot be converted to a Map`)
        }
        return undefined
    }

    const map = new Map()
    if (typeof value !== 'object') {
        if (strict) {
            throw new TypeError(`'${typeof value}' cannot be converted to a Map`)
        }
        if (itemMarshaller) {
            map.set(value, itemMarshaller(value, strict))
        }
        return map
    }

    if (Array.isArray(value)) {
        if (itemMarshaller) {
            value.forEach((item, i) => map.set(i, itemMarshaller(value, strict)))
        } else {
            value.forEach((item, i) => map.set(i, value))
        }
        return map
    }

    for (const propertyName of Reflect.ownKeys(value)) {
        const propertyValue = Reflect.get(value, propertyName)
        map.set(propertyName, itemMarshaller ? itemMarshaller(propertyValue, strict) : propertyValue)
    }
    
    return map
}
