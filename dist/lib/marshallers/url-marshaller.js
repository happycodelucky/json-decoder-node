"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
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
        if (value.length > 0) {
            return toURL(value[0], strict);
        }
        else {
            return undefined;
        }
    }
    if (typeof value !== 'string') {
        if (strict) {
            throw new TypeError(`${typeof value} cannot be converted to a URL`);
        }
        return undefined;
    }
    try {
        return new url_1.URL(value);
    }
    catch (_a) {
        if (strict) {
            throw new TypeError(`'${value}' is not a valid URL`);
        }
        return undefined;
    }
}
exports.toURL = toURL;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXJsLW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvbWFyc2hhbGxlcnMvdXJsLW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVILDZCQUF5QjtBQUV6Qjs7Ozs7OztHQU9HO0FBQ0gsZUFBc0IsS0FBVSxFQUFFLFNBQWtCLEtBQUs7SUFDckQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQyxDQUFDLENBQUM7UUFDdEIsTUFBTSxDQUFDLFNBQVMsQ0FBQTtJQUNwQixDQUFDO0lBRUQsOEJBQThCO0lBQzlCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLEVBQUUsQ0FBQyxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztZQUNuQixNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNsQyxDQUFDO1FBQUMsSUFBSSxDQUFDLENBQUM7WUFDSixNQUFNLENBQUMsU0FBUyxDQUFBO1FBQ3BCLENBQUM7SUFDTCxDQUFDO0lBRUQsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxDQUFDLENBQUMsQ0FBQztRQUM1QixFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1lBQ1QsTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLE9BQU8sS0FBSywrQkFBK0IsQ0FBQyxDQUFBO1FBQ3ZFLENBQUM7UUFDRCxNQUFNLENBQUMsU0FBUyxDQUFBO0lBQ3BCLENBQUM7SUFFRCxJQUFJLENBQUM7UUFDRCxNQUFNLENBQUMsSUFBSSxTQUFHLENBQUMsS0FBSyxDQUFDLENBQUE7SUFDekIsQ0FBQztJQUFDLEtBQUssQ0FBQyxDQUFDLElBQUQsQ0FBQztRQUNMLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7WUFDVCxNQUFNLElBQUksU0FBUyxDQUFDLElBQUksS0FBSyxzQkFBc0IsQ0FBQyxDQUFBO1FBQ3hELENBQUM7UUFDRCxNQUFNLENBQUMsU0FBUyxDQUFBO0lBQ3BCLENBQUM7QUFDTCxDQUFDO0FBN0JELHNCQTZCQyJ9