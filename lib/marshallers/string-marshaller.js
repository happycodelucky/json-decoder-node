"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toString = void 0;
/**
 * Converts a JSON value to a String, if possible
 *
 * @param value - a value to convert to a string
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A string, or undefined if the value could not be converted
 */
function toString(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to a String');
        }
        return undefined;
    }
    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            return toString(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.toString();
}
exports.toString = toString;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RyaW5nLW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvc3RyaW5nLW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxLQUFVLEVBQUUsU0FBa0IsS0FBSztJQUN4RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDckIsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFRCxJQUFJLEtBQUssS0FBSyxJQUFJLEVBQUU7UUFDaEIsSUFBSSxNQUFNLEVBQUU7WUFDUixNQUFNLElBQUksU0FBUyxDQUFDLDBDQUEwQyxDQUFDLENBQUE7U0FDbEU7UUFFRCxPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELDhCQUE4QjtJQUM5QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdEIsSUFBSSxNQUFNLEVBQUU7WUFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxnQ0FBZ0MsQ0FBQyxDQUFBO1NBQ2pFO1FBRUQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNsQixPQUFPLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDcEM7YUFBTTtZQUNILE9BQU8sU0FBUyxDQUFBO1NBQ25CO0tBQ0o7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUMzQixPQUFPLEtBQUssQ0FBQTtLQUNmO0lBRUQsT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7QUFDM0IsQ0FBQztBQS9CRCw0QkErQkMifQ==