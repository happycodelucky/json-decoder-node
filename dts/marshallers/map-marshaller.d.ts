/**
 * Converts a JSON value to a Map, if possible.
 *
 * @param value - value to convert to a Map
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a map, of the value, or the value itself.
 */
export declare function toMap(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): Map<string, any> | undefined;
