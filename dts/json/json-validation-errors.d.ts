import { JsonDecoderError } from './json-decoder-errors';
/**
 * Base error for all validation errors
 */
export declare abstract class JsonValidationError extends JsonDecoderError {
}
/**
 * Base error for all validation property errors
 */
export declare abstract class JsonValidatorPropertyError extends JsonValidationError {
    /**
     * Property name
     */
    readonly property: string;
    /**
     * Property path from the root
     */
    readonly propertyPath: string;
    /**
     * @param propertyPath - path to property
     * @param property - independent property name
     * @param message - error message
     */
    constructor(propertyPath: string, property: string, message: string);
}
/**
 * Error when validation finds a missing property declaration
 */
export declare class JsonValidatorPropertyMissingError extends JsonValidatorPropertyError {
}
/**
 * Error when validation finds a property not supported by the schema
 */
export declare class JsonValidatorPropertyUnsupportedError extends JsonValidatorPropertyError {
}
/**
 * Error when validation finds a property value to be invalid declaration
 */
export declare class JsonValidatorPropertyValueError extends JsonValidatorPropertyError {
    /**
     * Property value
     */
    readonly value: any;
    /**
     * @param propertyPath - path to property
     * @param value - property value
     * @param message - error message
     */
    constructor(propertyPath: string, value: any, message: string);
}
