/**
 * Converts a JSON value to a Date, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A Date, or undefined if the value could not be converted
 */
export declare function toDate(value: any, strict?: boolean): Date | undefined;
