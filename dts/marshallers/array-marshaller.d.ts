/**
 * Converts a JSON value to an Array, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns an array, of the value, or the value itself.
 */
export declare function toArray(value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): any[] | undefined;
