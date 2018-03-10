"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib2JqZWN0LW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvbWFyc2hhbGxlcnMvb2JqZWN0LW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUVIOzs7Ozs7O0dBT0c7QUFDSCxrQkFBeUIsS0FBVSxFQUFFLFNBQWtCLEtBQUs7SUFDeEQsRUFBRSxDQUFDLENBQUMsS0FBSyxLQUFLLFNBQVMsSUFBSSxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUMsQ0FBQztRQUN4QyxNQUFNLENBQUMsS0FBSyxDQUFBO0lBQ2hCLENBQUM7SUFFRCx5Q0FBeUM7SUFDekMsRUFBRSxDQUFDLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDckQsTUFBTSxDQUFDLEtBQUssQ0FBQTtJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUE7QUFDcEIsQ0FBQztBQVhELDRCQVdDIn0=