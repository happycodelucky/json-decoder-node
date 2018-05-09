import { JsonDecoderError } from './json-decoder-errors'

// We have more than 3 classes, this is ok
// tslint:disable:max-classes-per-file

/**
 * Base error for all validation errors
 */
export class JsonValidationError extends JsonDecoderError { }

/**
 * Base error for all validation property errors
 */
export abstract class JsonValidatorPropertyError extends JsonValidationError {
    /**
     * Property name
     */
    readonly property: string

    /**
     * Property path from the root
     */
    readonly propertyPath: string

    /**
     * @param propertyPath - path to property
     * @param property - indepedent property name
     * @param message - error message
     */
    constructor(propertyPath: string, property: string, message: string) {
        super(message)

        this.property = property
        this.propertyPath = propertyPath
    }
}

/**
 * Error when validation finds a missing property declaration
 */
export class JsonValidatorPropertyMissingError extends JsonValidatorPropertyError {}

/**
 * Error when validation finds a property value to be invalid declaration
 */
export class JsonValidatorPropertyValueError extends JsonValidatorPropertyError {
    /**
     * Property value
     */
    readonly value: any

    /**
     * @param propertyPath - path to property
     * @param value - property value
     * @param message - error message
     */
    constructor(propertyPath: string, value: any, message: string) {
        super(propertyPath, propertyPath.split('.').pop()!, message)

        this.value = value
    }
}