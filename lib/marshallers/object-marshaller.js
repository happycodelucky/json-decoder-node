"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toObject = void 0;
/**
 * Converts a JSON value to a Object, if possible
 *
 * @param value - value to convert to an Object
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @return Object, null, or undefined
 */
function toObject(value, strict = false) {
    if (value === undefined || value === null) {
        return value;
    }
    // Arrays are not treated as Objects here
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value;
    }
    return { value };
}
exports.toObject = toObject;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0LW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvb2JqZWN0LW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLFFBQVEsQ0FBQyxLQUFVLEVBQUUsU0FBa0IsS0FBSztJQUN4RCxJQUFJLEtBQUssS0FBSyxTQUFTLElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUN2QyxPQUFPLEtBQUssQ0FBQTtLQUNmO0lBRUQseUNBQXlDO0lBQ3pDLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUNwRCxPQUFPLEtBQUssQ0FBQTtLQUNmO0lBRUQsT0FBTyxFQUFFLEtBQUssRUFBRSxDQUFBO0FBQ3BCLENBQUM7QUFYRCw0QkFXQyJ9