import { JsonObject } from './json-decodable-types';
import { JsonValidationError } from './json-validation-errors';
/**
 * Errors
 */
export declare class JsonDecoderError extends Error {
    /**
     * @param message - error message
     */
    constructor(message: string, name?: string);
}
/**
 * Primary error raised when validation fails. It contains all the individual validation issues to examine
 */
export declare class JsonDecoderValidationError extends JsonDecoderError {
    /**
     * Source JSON
     */
    readonly json: JsonObject;
    /**
     * All validation errors
     */
    readonly validationErrors: ReadonlyArray<JsonValidationError>;
    /**
     * @param errors - all validation errors
     * @param json - source JSON
     * @param [message=undefined] - custom error message
     */
    constructor(errors: JsonValidationError[], json: JsonObject, message?: string);
}
