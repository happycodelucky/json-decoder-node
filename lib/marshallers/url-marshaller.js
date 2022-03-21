"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toURL = void 0;
const url_1 = require("url");
/**
 * Converts a JSON value to an URL, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return An URL, or undefined if the value could not be converted
 */
function toURL(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            return toURL(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'string') {
        try {
            return new url_1.URL(value);
        }
        catch { }
    }
    if (strict) {
        throw new TypeError(`${typeof value} cannot be converted to a URL`);
    }
    return undefined;
}
exports.toURL = toURL;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvdXJsLW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsNkJBQXlCO0FBRXpCOzs7Ozs7O0dBT0c7QUFDSCxTQUFnQixLQUFLLENBQUMsS0FBVSxFQUFFLFNBQWtCLEtBQUs7SUFDckQsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JCLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBRUQsOEJBQThCO0lBQzlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN0QixJQUFJLE1BQU0sRUFBRTtZQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGdDQUFnQyxDQUFDLENBQUE7U0FDakU7UUFFRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLE9BQU8sS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQTtTQUNqQzthQUFNO1lBQ0gsT0FBTyxTQUFTLENBQUE7U0FDbkI7S0FDSjtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLElBQUk7WUFDQSxPQUFPLElBQUksU0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO1NBQ3hCO1FBQUMsTUFBTSxHQUFHO0tBQ2Q7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsR0FBRyxPQUFPLEtBQUssK0JBQStCLENBQUMsQ0FBQTtLQUN0RTtJQUVELE9BQU8sU0FBUyxDQUFBO0FBQ3BCLENBQUM7QUE3QkQsc0JBNkJDIn0=