import { JsonObject } from './json-decodable-types';
import { JsonValidationError } from './json-validation-errors';
export declare class JsonDecoderError extends Error {
    constructor(message: string, name?: string);
}
export declare class JsonDecoderValidationError extends JsonDecoderError {
    readonly json: JsonObject;
    readonly validationErrors: ReadonlyArray<JsonValidationError>;
    constructor(errors: JsonValidationError[], json: JsonObject, message?: string);
}
