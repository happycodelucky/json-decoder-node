"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
const array_marshaller_1 = require("./array-marshaller");
const boolean_marshaller_1 = require("./boolean-marshaller");
const map_marshaller_1 = require("./map-marshaller");
const number_marshaller_1 = require("./number-marshaller");
const object_marshaller_1 = require("./object-marshaller");
const set_marshaller_1 = require("./set-marshaller");
const string_marshaller_1 = require("./string-marshaller");
const url_marshaller_1 = require("./url-marshaller");
const url_1 = require("url");
// Marshaller function map
const marshallers = new Map();
marshallers.set(Boolean, boolean_marshaller_1.toBoolean);
marshallers.set(Number, number_marshaller_1.toNumber);
marshallers.set(Object, object_marshaller_1.toObject);
marshallers.set(String, string_marshaller_1.toString);
marshallers.set(url_1.URL, url_marshaller_1.toURL);
// Collection marshaller function map
const collectionMarshallers = new Map();
collectionMarshallers.set(Array, array_marshaller_1.toArray);
collectionMarshallers.set(Map, map_marshaller_1.toMap);
collectionMarshallers.set(Set, set_marshaller_1.toSet);
/**
 * Returns a marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
function marshallerForType(type) {
    return marshallers.get(type);
}
exports.marshallerForType = marshallerForType;
/**
 * Returns a collection marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
function collectionMarshallerForType(type) {
    return collectionMarshallers.get(type);
}
exports.collectionMarshallerForType = collectionMarshallerForType;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyc2hhbGxlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOztBQUdILHlEQUE0QztBQUM1Qyw2REFBZ0Q7QUFDaEQscURBQXdDO0FBQ3hDLDJEQUE4QztBQUM5QywyREFBOEM7QUFDOUMscURBQXdDO0FBQ3hDLDJEQUE4QztBQUM5QyxxREFBd0M7QUFDeEMsNkJBQXlCO0FBRXpCLDBCQUEwQjtBQUMxQixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsRUFBa0UsQ0FBQTtBQUM3RixXQUFXLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSw4QkFBUyxDQUFDLENBQUE7QUFDbkMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsNEJBQVEsQ0FBQyxDQUFBO0FBQ2pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLDRCQUFRLENBQUMsQ0FBQTtBQUNqQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSw0QkFBUSxDQUFDLENBQUE7QUFDakMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxTQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBRTNCLHFDQUFxQztBQUNyQyxNQUFNLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUFxSSxDQUFBO0FBQzFLLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsMEJBQU8sQ0FBQyxDQUFBO0FBQ3pDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBQ3JDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBRXJDOzs7OztHQUtHO0FBQ0gsMkJBQWtDLElBQTZCO0lBQzNELE1BQU0sQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFBO0FBQ2hDLENBQUM7QUFGRCw4Q0FFQztBQUVEOzs7OztHQUtHO0FBQ0gscUNBQTRDLElBQTZCO0lBQ3JFLE1BQU0sQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDMUMsQ0FBQztBQUZELGtFQUVDIn0=