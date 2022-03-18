/**
 * Converts a JSON value to a Set, if possible.
 *
 * @param value - value to convert to a Set
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a set, of the value, or the value itself.
 */
export declare function toSet(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): Set<any> | undefined;
