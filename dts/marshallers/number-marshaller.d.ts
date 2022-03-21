/**
 * Converts a JSON value to a Number, if possible
 *
 * @param value - value to convert to a Number
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return parsed number, NaN, or undefined
 */
export declare function toNumber(value: any, strict?: boolean): number | undefined;
