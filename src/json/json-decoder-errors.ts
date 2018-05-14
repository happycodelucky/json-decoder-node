import { JsonObject } from './json-decodable-types'
import { JsonValidationError } from './json-validation-errors'

/**
 * Errors
 */
export class JsonDecoderError extends Error {
    /**
     * @param message - error message
     */
    constructor(message: string, name: string = new.target.name) {
        super(message)

        // Correct prototype overridden by Error
        Reflect.setPrototypeOf(this, new.target.prototype);

        this.name = name
    }
}

/**
 * Primary error raised when validation fails. It contains all the individual validation issues to examine
 */
export class JsonDecoderValidationError extends JsonDecoderError {
    /**
     * Source JSON
     */
    readonly json: JsonObject

    /**
     * All validation errors
     */
    readonly validationErrors: ReadonlyArray<JsonValidationError>

    /**
     * @param errors - all validation errors
     * @param json - source JSON
     * @param [message=undefined] - custom error message
     */
    constructor(errors: JsonValidationError[], json: JsonObject, message?: string) {
        super(message || (!errors || errors.length <= 1)
            ? 'JSON validation failed'
            : `JSON validation failed with ${errors.length} issues`)

        this.json = json
        this.validationErrors = [...errors]
    }
}
