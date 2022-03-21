"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toSet = void 0;
/**
 * Converts a JSON value to a Set, if possible.
 *
 * @param value - value to convert to a Set
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a set, of the value, or the value itself.
 */
function toSet(value, itemMarshaller, strict) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to a Set');
        }
        return undefined;
    }
    if (Array.isArray(value)) {
        if (itemMarshaller) {
            value = value.map(item => itemMarshaller(item, strict));
        }
        return new Set(value);
    }
    const set = new Set();
    set.add(itemMarshaller ? itemMarshaller(value, strict) : value);
    return set;
}
exports.toSet = toSet;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2V0LW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvc2V0LW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFnQixLQUFLLENBQUMsS0FBVSxFQUFFLGNBQXNELEVBQUUsTUFBZ0I7SUFDdEcsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JCLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBRUQsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ2hCLElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO1NBQy9EO1FBRUQsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFRCxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7UUFDdEIsSUFBSSxjQUFjLEVBQUU7WUFDaEIsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDLENBQUE7U0FDMUQ7UUFFRCxPQUFPLElBQUksR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFBO0tBQ3hCO0lBRUQsTUFBTSxHQUFHLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtJQUNyQixHQUFHLENBQUMsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDLENBQUMsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUE7SUFFL0QsT0FBTyxHQUFHLENBQUE7QUFDZCxDQUFDO0FBekJELHNCQXlCQyJ9