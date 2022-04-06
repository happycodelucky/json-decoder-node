"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toDate = void 0;
/**
 * Converts a JSON value to a Date, if possible.
 *
 * @param value - a value to convert to an URL
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return A Date, or undefined if the value could not be converted
 */
function toDate(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            return toDate(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'string') {
        if (/^[\\d]+$/.test(value)) {
            value = Number.parseInt(value, 10);
        }
        else {
            const timestamp = Date.parse(value);
            if (Number.isNaN(timestamp)) {
                if (strict) {
                    throw new TypeError(`'${value}' is not a valid URL`);
                }
                return undefined;
            }
            return new Date(timestamp);
        }
    }
    if (typeof value === 'number') {
        if (Number.isNaN(value) || value < 0) {
            if (strict) {
                throw new TypeError(`'${value}' is not a valid date`);
            }
            return undefined;
        }
        return new Date(value);
    }
    if (strict) {
        throw new TypeError(`'${value}' is not a valid date`);
    }
    return undefined;
}
exports.toDate = toDate;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0ZS1tYXJzaGFsbGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hcnNoYWxsZXJzL2RhdGUtbWFyc2hhbGxlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQTs7Ozs7OztHQU9HO0FBQ0gsU0FBZ0IsTUFBTSxDQUFDLEtBQVUsRUFBRSxTQUFrQixLQUFLO0lBQ3RELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUNyQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELDhCQUE4QjtJQUM5QixJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdEIsSUFBSSxNQUFNLEVBQUU7WUFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxnQ0FBZ0MsQ0FBQyxDQUFBO1NBQ2pFO1FBRUQsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNsQixPQUFPLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDbEM7YUFBTTtZQUNILE9BQU8sU0FBUyxDQUFBO1NBQ25CO0tBQ0o7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUMzQixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDeEIsS0FBSyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFBO1NBQ3JDO2FBQU07WUFDSCxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFBO1lBQ25DLElBQUksTUFBTSxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsRUFBRTtnQkFDekIsSUFBSSxNQUFNLEVBQUU7b0JBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssc0JBQXNCLENBQUMsQ0FBQTtpQkFDdkQ7Z0JBRUQsT0FBTyxTQUFTLENBQUE7YUFDbkI7WUFFRCxPQUFPLElBQUksSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFBO1NBQzdCO0tBQ0o7SUFFRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsRUFBRTtRQUMzQixJQUFJLE1BQU0sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUMsRUFBRTtZQUNsQyxJQUFJLE1BQU0sRUFBRTtnQkFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyx1QkFBdUIsQ0FBQyxDQUFBO2FBQ3hEO1lBRUQsT0FBTyxTQUFTLENBQUE7U0FDbkI7UUFFRCxPQUFPLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ3pCO0lBRUQsSUFBSSxNQUFNLEVBQUU7UUFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyx1QkFBdUIsQ0FBQyxDQUFBO0tBQ3hEO0lBRUQsT0FBTyxTQUFTLENBQUE7QUFDcEIsQ0FBQztBQXBERCx3QkFvREMifQ==