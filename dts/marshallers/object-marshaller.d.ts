/**
 * Converts a JSON value to a Object, if possible
 *
 * @param value - value to convert to an Object
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return Object, null, or undefined
 */
export declare function toObject(value: any, strict?: boolean): object | null | undefined;
