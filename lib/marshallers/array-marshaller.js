"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toArray = void 0;
/**
 * Converts a JSON value to an Array, if possible.
 *
 * @param value - value to convert to a Boolean
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns an array, of the value, or the value itself.
 */
function toArray(value, itemMarshaller, strict) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to an Array');
        }
        return undefined;
    }
    if (Array.isArray(value)) {
        if (itemMarshaller) {
            return value.map(item => itemMarshaller(item, strict));
        }
        return value;
    }
    return [itemMarshaller ? itemMarshaller(value, strict) : value];
}
exports.toArray = toArray;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXJyYXktbWFyc2hhbGxlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9tYXJzaGFsbGVycy9hcnJheS1tYXJzaGFsbGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7OztHQVFHO0FBQ0gsU0FBZ0IsT0FBTyxDQUFDLEtBQVUsRUFBRSxjQUFzRCxFQUFFLE1BQWdCO0lBQ3hHLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUNyQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUNELElBQUksS0FBSyxLQUFLLElBQUksRUFBRTtRQUNoQixJQUFJLE1BQU0sRUFBRTtZQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsMENBQTBDLENBQUMsQ0FBQTtTQUNsRTtRQUVELE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBRUQsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1FBQ3RCLElBQUksY0FBYyxFQUFFO1lBQ2hCLE9BQU8sS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQTtTQUN6RDtRQUVELE9BQU8sS0FBSyxDQUFBO0tBQ2Y7SUFFRCxPQUFPLENBQUMsY0FBYyxDQUFDLENBQUMsQ0FBQyxjQUFjLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQTtBQUNuRSxDQUFDO0FBckJELDBCQXFCQyJ9