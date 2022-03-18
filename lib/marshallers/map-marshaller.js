"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMap = void 0;
/**
 * Converts a JSON value to a Map, if possible.
 *
 * @param value - value to convert to a Map
 * @param itemMarshaller - item marshaller function
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 *
 * @returns a map, of the value, or the value itself.
 */
function toMap(value, itemMarshaller, strict) {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        if (strict) {
            throw new TypeError('\'null\' cannot be converted to a Map');
        }
        return undefined;
    }
    const map = new Map();
    if (typeof value !== 'object') {
        if (strict) {
            throw new TypeError(`'${typeof value}' cannot be converted to a Map`);
        }
        if (itemMarshaller) {
            map.set(value, itemMarshaller(value, strict));
        }
        return map;
    }
    if (Array.isArray(value)) {
        if (itemMarshaller) {
            value.forEach((item, i) => map.set(i, itemMarshaller(value, strict)));
        }
        else {
            value.forEach((item, i) => map.set(i, value));
        }
        return map;
    }
    for (const propertyName of Reflect.ownKeys(value)) {
        const propertyValue = Reflect.get(value, propertyName);
        map.set(propertyName, itemMarshaller ? itemMarshaller(propertyValue, strict) : propertyValue);
    }
    return map;
}
exports.toMap = toMap;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwLW1hcnNoYWxsZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvbWFwLW1hcnNoYWxsZXIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7O0dBUUc7QUFDSCxTQUFnQixLQUFLLENBQUMsS0FBVSxFQUFFLGNBQXNELEVBQUUsTUFBZ0I7SUFDdEcsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JCLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBQ0QsSUFBSSxLQUFLLEtBQUssSUFBSSxFQUFFO1FBQ2hCLElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO1NBQy9EO1FBRUQsT0FBTyxTQUFTLENBQUE7S0FDbkI7SUFFRCxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO0lBQ3JCLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxFQUFFO1FBQzNCLElBQUksTUFBTSxFQUFFO1lBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxJQUFJLE9BQU8sS0FBSyxnQ0FBZ0MsQ0FBQyxDQUFBO1NBQ3hFO1FBQ0QsSUFBSSxjQUFjLEVBQUU7WUFDaEIsR0FBRyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFBO1NBQ2hEO1FBRUQsT0FBTyxHQUFHLENBQUE7S0FDYjtJQUVELElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUN0QixJQUFJLGNBQWMsRUFBRTtZQUNoQixLQUFLLENBQUMsT0FBTyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsY0FBYyxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7U0FDeEU7YUFBTTtZQUNILEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFBO1NBQ2hEO1FBRUQsT0FBTyxHQUFHLENBQUE7S0FDYjtJQUVELEtBQUssTUFBTSxZQUFZLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtRQUMvQyxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxZQUFZLENBQUMsQ0FBQTtRQUN0RCxHQUFHLENBQUMsR0FBRyxDQUFDLFlBQVksRUFBRSxjQUFjLENBQUMsQ0FBQyxDQUFDLGNBQWMsQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxDQUFBO0tBQ2hHO0lBRUQsT0FBTyxHQUFHLENBQUE7QUFDZCxDQUFDO0FBeENELHNCQXdDQyJ9