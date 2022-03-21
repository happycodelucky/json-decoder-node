/// <reference types="node" />
import { URL } from 'url';
/**
 * Converts a JSON value to an URL, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return An URL, or undefined if the value could not be converted
 */
export declare function toURL(value: any, strict?: boolean): URL | undefined;
