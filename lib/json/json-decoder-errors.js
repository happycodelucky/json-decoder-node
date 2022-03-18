"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonDecoderValidationError = exports.JsonDecoderError = void 0;
/**
 * Errors
 */
class JsonDecoderError extends Error {
    /**
     * @param message - error message
     */
    // tslint:disable-next-line:no-unsafe-any
    constructor(message, name = new.target.name) {
        super(message);
        // Correct prototype overridden by Error
        // tslint:disable-next-line:no-unsafe-any
        Reflect.setPrototypeOf(this, new.target.prototype);
        this.name = name;
    }
}
exports.JsonDecoderError = JsonDecoderError;
/**
 * Primary error raised when validation fails. It contains all the individual validation issues to examine
 */
class JsonDecoderValidationError extends JsonDecoderError {
    /**
     * @param errors - all validation errors
     * @param json - source JSON
     * @param [message=undefined] - custom error message
     */
    constructor(errors, json, message) {
        super(message || (!errors || errors.length <= 1)
            ? 'JSON validation failed'
            : `JSON validation failed with ${errors.length} issues`);
        this.json = json;
        this.validationErrors = [...errors];
    }
}
exports.JsonDecoderValidationError = JsonDecoderValidationError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLWVycm9ycy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9qc29uL2pzb24tZGVjb2Rlci1lcnJvcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBR0E7O0dBRUc7QUFDSCxNQUFhLGdCQUFpQixTQUFRLEtBQUs7SUFDdkM7O09BRUc7SUFDSCx5Q0FBeUM7SUFDekMsWUFBWSxPQUFlLEVBQUUsT0FBZSxHQUFHLENBQUMsTUFBTSxDQUFDLElBQUk7UUFDdkQsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBO1FBRWQsd0NBQXdDO1FBQ3hDLHlDQUF5QztRQUN6QyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBRW5ELElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFBO0lBQ3BCLENBQUM7Q0FDSjtBQWRELDRDQWNDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLDBCQUEyQixTQUFRLGdCQUFnQjtJQVc1RDs7OztPQUlHO0lBQ0gsWUFBWSxNQUE2QixFQUFFLElBQWdCLEVBQUUsT0FBZ0I7UUFDekUsS0FBSyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsTUFBTSxJQUFJLE1BQU0sQ0FBQyxNQUFNLElBQUksQ0FBQyxDQUFDO1lBQzVDLENBQUMsQ0FBQyx3QkFBd0I7WUFDMUIsQ0FBQyxDQUFDLCtCQUErQixNQUFNLENBQUMsTUFBTSxTQUFTLENBQUMsQ0FBQTtRQUU1RCxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQTtRQUNoQixJQUFJLENBQUMsZ0JBQWdCLEdBQUcsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxDQUFBO0lBQ3ZDLENBQUM7Q0FDSjtBQXhCRCxnRUF3QkMifQ==