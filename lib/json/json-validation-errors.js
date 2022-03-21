"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonValidatorPropertyValueError = exports.JsonValidatorPropertyUnsupportedError = exports.JsonValidatorPropertyMissingError = exports.JsonValidatorPropertyError = exports.JsonValidationError = void 0;
const json_decoder_errors_1 = require("./json-decoder-errors");
// We have more than 3 classes, this is ok
// tslint:disable:max-classes-per-file
/**
 * Base error for all validation errors
 */
class JsonValidationError extends json_decoder_errors_1.JsonDecoderError {
}
exports.JsonValidationError = JsonValidationError;
/**
 * Base error for all validation property errors
 */
class JsonValidatorPropertyError extends JsonValidationError {
    /**
     * @param propertyPath - path to property
     * @param property - independent property name
     * @param message - error message
     */
    constructor(propertyPath, property, message) {
        super(message);
        this.property = property;
        this.propertyPath = propertyPath;
    }
}
exports.JsonValidatorPropertyError = JsonValidatorPropertyError;
/**
 * Error when validation finds a missing property declaration
 */
class JsonValidatorPropertyMissingError extends JsonValidatorPropertyError {
}
exports.JsonValidatorPropertyMissingError = JsonValidatorPropertyMissingError;
/**
 * Error when validation finds a property not supported by the schema
 */
class JsonValidatorPropertyUnsupportedError extends JsonValidatorPropertyError {
}
exports.JsonValidatorPropertyUnsupportedError = JsonValidatorPropertyUnsupportedError;
/**
 * Error when validation finds a property value to be invalid declaration
 */
class JsonValidatorPropertyValueError extends JsonValidatorPropertyError {
    /**
     * @param propertyPath - path to property
     * @param value - property value
     * @param message - error message
     */
    constructor(propertyPath, value, message) {
        super(propertyPath, propertyPath.split('.').pop(), message);
        this.value = value;
    }
}
exports.JsonValidatorPropertyValueError = JsonValidatorPropertyValueError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi12YWxpZGF0aW9uLWVycm9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qc29uL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsK0RBQXdEO0FBRXhELDBDQUEwQztBQUMxQyxzQ0FBc0M7QUFFdEM7O0dBRUc7QUFDSCxNQUFzQixtQkFBb0IsU0FBUSxzQ0FBZ0I7Q0FBSTtBQUF0RSxrREFBc0U7QUFFdEU7O0dBRUc7QUFDSCxNQUFzQiwwQkFBMkIsU0FBUSxtQkFBbUI7SUFXeEU7Ozs7T0FJRztJQUNILFlBQVksWUFBb0IsRUFBRSxRQUFnQixFQUFFLE9BQWU7UUFDL0QsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWQsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7UUFDeEIsSUFBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUE7SUFDcEMsQ0FBQztDQUNKO0FBdEJELGdFQXNCQztBQUVEOztHQUVHO0FBQ0gsTUFBYSxpQ0FBa0MsU0FBUSwwQkFBMEI7Q0FBRztBQUFwRiw4RUFBb0Y7QUFFcEY7O0dBRUc7QUFDSCxNQUFhLHFDQUFzQyxTQUFRLDBCQUEwQjtDQUFHO0FBQXhGLHNGQUF3RjtBQUV4Rjs7R0FFRztBQUNILE1BQWEsK0JBQWdDLFNBQVEsMEJBQTBCO0lBTTNFOzs7O09BSUc7SUFDSCxZQUFZLFlBQW9CLEVBQUUsS0FBVSxFQUFFLE9BQWU7UUFDekQsS0FBSyxDQUFDLFlBQVksRUFBRSxZQUFZLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRyxFQUFFLE9BQU8sQ0FBQyxDQUFBO1FBRTVELElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFBO0lBQ3RCLENBQUM7Q0FDSjtBQWhCRCwwRUFnQkMifQ==