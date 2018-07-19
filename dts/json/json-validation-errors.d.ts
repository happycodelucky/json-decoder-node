import { JsonDecoderError } from './json-decoder-errors';
export declare abstract class JsonValidationError extends JsonDecoderError {
}
export declare abstract class JsonValidatorPropertyError extends JsonValidationError {
    readonly property: string;
    readonly propertyPath: string;
    constructor(propertyPath: string, property: string, message: string);
}
export declare class JsonValidatorPropertyMissingError extends JsonValidatorPropertyError {
}
export declare class JsonValidatorPropertyUnsupportedError extends JsonValidatorPropertyError {
}
export declare class JsonValidatorPropertyValueError extends JsonValidatorPropertyError {
    readonly value: any;
    constructor(propertyPath: string, value: any, message: string);
}
