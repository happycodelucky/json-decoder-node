"use strict";
/**
 * Registery of types to associated marshallers
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectionMarshallerForType = exports.marshallerForType = void 0;
const url_1 = require("url");
const array_marshaller_1 = require("./array-marshaller");
const boolean_marshaller_1 = require("./boolean-marshaller");
const date_marshaller_1 = require("./date-marshaller");
const map_marshaller_1 = require("./map-marshaller");
const number_marshaller_1 = require("./number-marshaller");
const object_marshaller_1 = require("./object-marshaller");
const set_marshaller_1 = require("./set-marshaller");
const string_marshaller_1 = require("./string-marshaller");
const url_marshaller_1 = require("./url-marshaller");
// Marshaller function map
const marshallers = new Map();
marshallers.set(Boolean, boolean_marshaller_1.toBoolean);
marshallers.set(Date, date_marshaller_1.toDate);
marshallers.set(Number, number_marshaller_1.toNumber);
marshallers.set(Object, object_marshaller_1.toObject);
marshallers.set(String, string_marshaller_1.toString);
marshallers.set(url_1.URL, url_marshaller_1.toURL);
// Collection marshaller function map
const collectionMarshallers = new Map();
collectionMarshallers.set(Array, array_marshaller_1.toArray);
collectionMarshallers.set(Map, map_marshaller_1.toMap);
collectionMarshallers.set(Set, set_marshaller_1.toSet);
// Convert collection marshaller to regular marshallers for type marshalling without item marshalling
collectionMarshallers.forEach((marshaller, key) => {
    marshallers.set(key, convertCollectionMarshallerToMarshaller(marshaller));
});
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
/**
 * Converts a collection marshaller to a standard marshaller function
 *
 * @param marshaller - collection marshaller to convert
 * @return non collection marshaller function
 */
function convertCollectionMarshallerToMarshaller(marshaller) {
    return (value, strict) => {
        return marshaller(value, (item) => item, strict);
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFyc2hhbGxlcnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOztHQUVHOzs7QUFFSCw2QkFBeUI7QUFHekIseURBQTRDO0FBQzVDLDZEQUFnRDtBQUNoRCx1REFBMEM7QUFDMUMscURBQXdDO0FBQ3hDLDJEQUE4QztBQUM5QywyREFBOEM7QUFDOUMscURBQXdDO0FBQ3hDLDJEQUE4QztBQUM5QyxxREFBd0M7QUFFeEMsMEJBQTBCO0FBQzFCLE1BQU0sV0FBVyxHQUFHLElBQUksR0FBRyxFQUErQyxDQUFBO0FBQzFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLDhCQUFTLENBQUMsQ0FBQTtBQUNuQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSx3QkFBTSxDQUFDLENBQUE7QUFDN0IsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsNEJBQVEsQ0FBQyxDQUFBO0FBQ2pDLFdBQVcsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLDRCQUFRLENBQUMsQ0FBQTtBQUNqQyxXQUFXLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSw0QkFBUSxDQUFDLENBQUE7QUFDakMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxTQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBRTNCLHFDQUFxQztBQUNyQyxNQUFNLHFCQUFxQixHQUFHLElBQUksR0FBRyxFQUF5RCxDQUFBO0FBQzlGLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsMEJBQU8sQ0FBQyxDQUFBO0FBQ3pDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBQ3JDLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsc0JBQUssQ0FBQyxDQUFBO0FBRXJDLHFHQUFxRztBQUNyRyxxQkFBcUIsQ0FBQyxPQUFPLENBQUMsQ0FBQyxVQUF3QyxFQUFFLEdBQTRCLEVBQUUsRUFBRTtJQUNyRyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSx1Q0FBdUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO0FBQzdFLENBQUMsQ0FBQyxDQUFBO0FBU0Y7Ozs7O0dBS0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBQyxJQUE2QjtJQUMzRCxPQUFPLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUE7QUFDaEMsQ0FBQztBQUZELDhDQUVDO0FBU0Q7Ozs7O0dBS0c7QUFDSCxTQUFnQiwyQkFBMkIsQ0FBQyxJQUE2QjtJQUNyRSxPQUFPLHFCQUFxQixDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUMxQyxDQUFDO0FBRkQsa0VBRUM7QUFFRDs7Ozs7R0FLRztBQUNILFNBQVMsdUNBQXVDLENBQUMsVUFBd0M7SUFDckYsT0FBTyxDQUFDLEtBQVUsRUFBRSxNQUFnQixFQUFPLEVBQUU7UUFDekMsT0FBTyxVQUFVLENBQUMsS0FBSyxFQUFFLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDcEQsQ0FBQyxDQUFBO0FBQ0wsQ0FBQyJ9