"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toBoolean = void 0;
/**
 * Converts a JSON value to a Boolean, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param strict - when true, parsing is strict and returns undefined if not able to be parsed
 *
 * @return parsed Boolean or undefined
 */
function toBoolean(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return false;
    }
    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            value = toBoolean(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (/^[ \t]*(true|yes|1)[ \t]*$/i.test(value)) {
            return true;
        }
        // Strict requires exact match to false
        if (/^[ \t]*(false|no|0)[ \t]*$/i.test(value)) {
            return false;
        }
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        return undefined;
    }
    else if (typeof value === 'number') {
        if (!strict) {
            return value !== 0;
        }
        if (value === 0) {
            return false;
        }
        else if (value === 1) {
            return true;
        }
        throw new TypeError(`'${value}' does not represent a Boolean`);
    }
    if (strict) {
        throw new TypeError(`'${typeof value}' cannot be converted to a Boolean`);
    }
    return undefined;
}
exports.toBoolean = toBoolean;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vbGVhbi1tYXJzaGFsbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hcnNoYWxsZXJzL2Jvb2xlYW4tbWFyc2hhbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsU0FBUyxDQUFDLEtBQVUsRUFBRSxTQUFrQixLQUFLO0lBQ3pELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUNyQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNoQixPQUFPLEtBQUssQ0FBQTtLQUNmO0lBRUQsOEJBQThCO0lBQzlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN0QixJQUFJLE1BQU0sRUFBRTtZQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGdDQUFnQyxDQUFDLENBQUE7U0FDakU7UUFFRCxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1lBQ2xCLEtBQUssR0FBRyxTQUFTLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1NBQ3RDO2FBQU07WUFDSCxPQUFPLFNBQVMsQ0FBQTtTQUNuQjtLQUNKO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDNUIsT0FBTyxLQUFLLENBQUE7S0FDZjtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLElBQUksNkJBQTZCLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBQzNDLE9BQU8sSUFBSSxDQUFBO1NBQ2Q7UUFDRCx1Q0FBdUM7UUFDdkMsSUFBSSw2QkFBNkIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDM0MsT0FBTyxLQUFLLENBQUE7U0FDZjtRQUVELElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssZ0NBQWdDLENBQUMsQ0FBQTtTQUNqRTtRQUVELE9BQU8sU0FBUyxDQUFBO0tBQ25CO1NBQU0sSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDbEMsSUFBSSxDQUFDLE1BQU0sRUFBRTtZQUNULE9BQU8sS0FBSyxLQUFLLENBQUMsQ0FBQTtTQUNyQjtRQUVELElBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtZQUNiLE9BQU8sS0FBSyxDQUFBO1NBQ2Y7YUFBTSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7WUFDcEIsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUVELE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxLQUFLLGdDQUFnQyxDQUFDLENBQUE7S0FDakU7SUFFRCxJQUFJLE1BQU0sRUFBRTtRQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsSUFBSSxPQUFPLEtBQUssb0NBQW9DLENBQUMsQ0FBQTtLQUM1RTtJQUVELE9BQU8sU0FBUyxDQUFBO0FBQ3BCLENBQUM7QUEzREQsOEJBMkRDIn0=