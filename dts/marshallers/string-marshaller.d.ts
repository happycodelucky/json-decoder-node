/**
 * Converts a JSON value to a String, if possible
 *
 * @param value - a value to convert to a string
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A string, or undefined if the value could not be converted
 */
export declare function toString(value: any, strict?: boolean): string | undefined;
