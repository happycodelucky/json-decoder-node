"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toNumber = void 0;
/**
 * Converts a JSON value to a Number, if possible
 *
 * @param value - value to convert to a Number
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return parsed number, NaN, or undefined
 */
function toNumber(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    // Extract 0 index of an array
    if (Array.isArray(value)) {
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Boolean`);
        }
        if (value.length > 0) {
            return toNumber(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    else if (typeof value === 'string') {
        let trimmedValue = value.trim();
        const prefixMatch = /^([-+])?[ \t]*/.exec(trimmedValue);
        if (prefixMatch && prefixMatch[0].length) {
            trimmedValue = trimmedValue.slice(prefixMatch[0].length);
        }
        // tslint:disable:no-magic-numbers
        const factor = prefixMatch && prefixMatch[1] === '-' ? -1 : 1;
        if (trimmedValue.startsWith('0x') || trimmedValue.startsWith('0X')) {
            const matches = /^[0-9A-F]+$/i.exec(trimmedValue.slice(2));
            if (matches) {
                // tslint:disable:no-magic-numbers
                return Number.parseInt(matches[0], 16) * factor;
            }
        }
        else if (trimmedValue.startsWith('0b') || trimmedValue.startsWith('0B')) {
            const matches = /^[01]+$/.exec(trimmedValue.slice(2));
            if (matches) {
                // tslint:disable:no-magic-numbers
                return Number.parseInt(matches[0], 2) * factor;
            }
        }
        else {
            const matches = /^[0-9,]*([\.])?([0-9]+)?([Ee][+-]?[0-9]+)?$/.exec(trimmedValue);
            if (matches) {
                const matchedValue = matches[0].replace(/,/g, '');
                if (matches.length > 1) {
                    return Number.parseFloat(matchedValue) * factor;
                }
                else {
                    // tslint:disable:no-magic-numbers
                    return Number.parseInt(matchedValue, 10) * factor;
                }
            }
        }
        if (strict) {
            throw new TypeError(`'${value}' does not represent a Number`);
        }
    }
    if (strict) {
        throw new TypeError(`'${typeof value} cannot be converted to a Number`);
    }
    return Number.NaN;
}
exports.toNumber = toNumber;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibnVtYmVyLW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvbnVtYmVyLW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxLQUFVLEVBQUUsU0FBa0IsS0FBSztJQUN4RCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7UUFDckIsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFRCw4QkFBOEI7SUFDOUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssZ0NBQWdDLENBQUMsQ0FBQTtTQUNqRTtRQUVELElBQUksS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7WUFDbEIsT0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFBO1NBQ3BDO2FBQU07WUFDSCxPQUFPLFNBQVMsQ0FBQTtTQUNuQjtLQUNKO0lBRUQsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLEVBQUU7UUFDM0IsT0FBTyxLQUFLLENBQUE7S0FDZjtJQUVELElBQUksT0FBTyxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQzVCLE9BQU8sS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTtLQUN2QjtTQUFNLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQ2xDLElBQUksWUFBWSxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQTtRQUMvQixNQUFNLFdBQVcsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7UUFDdkQsSUFBSSxXQUFXLElBQUksV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRTtZQUN0QyxZQUFZLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUE7U0FDM0Q7UUFDRCxrQ0FBa0M7UUFDbEMsTUFBTSxNQUFNLEdBQUcsV0FBVyxJQUFJLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7UUFFN0QsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDaEUsTUFBTSxPQUFPLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDMUQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1Qsa0NBQWtDO2dCQUNsQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQTthQUNsRDtTQUNKO2FBQU0sSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkUsTUFBTSxPQUFPLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7WUFDckQsSUFBSSxPQUFPLEVBQUU7Z0JBQ1Qsa0NBQWtDO2dCQUNsQyxPQUFPLE1BQU0sQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLE1BQU0sQ0FBQTthQUNqRDtTQUNKO2FBQU07WUFDSCxNQUFNLE9BQU8sR0FBRyw2Q0FBNkMsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7WUFDaEYsSUFBSSxPQUFPLEVBQUU7Z0JBQ1QsTUFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUE7Z0JBQ2pELElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7b0JBQ3BCLE9BQU8sTUFBTSxDQUFDLFVBQVUsQ0FBQyxZQUFZLENBQUMsR0FBRyxNQUFNLENBQUE7aUJBQ2xEO3FCQUFNO29CQUNILGtDQUFrQztvQkFDbEMsT0FBTyxNQUFNLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUE7aUJBQ3BEO2FBQ0o7U0FDSjtRQUVELElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEtBQUssK0JBQStCLENBQUMsQ0FBQTtTQUNoRTtLQUNKO0lBRUQsSUFBSSxNQUFNLEVBQUU7UUFDUixNQUFNLElBQUksU0FBUyxDQUFDLElBQUksT0FBTyxLQUFLLGtDQUFrQyxDQUFDLENBQUE7S0FDMUU7SUFFRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUE7QUFDckIsQ0FBQztBQXBFRCw0QkFvRUMifQ==