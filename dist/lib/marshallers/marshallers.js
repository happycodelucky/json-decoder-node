"use strict";
/**
 * @module json-decoder
 */
Object.defineProperty(exports, "__esModule", { value: true });
const array_marshaller_1 = require("./array-marshaller");
const boolean_marshaller_1 = require("./boolean-marshaller");
const number_marshaller_1 = require("./number-marshaller");
const object_marshaller_1 = require("./object-marshaller");
const string_marshaller_1 = require("./string-marshaller");
const url_marshaller_1 = require("./url-marshaller");
const url_1 = require("url");
// Marshaller function map
const marshallers = new Map();
marshallers.set(Array, array_marshaller_1.toArray);
marshallers.set(Boolean, boolean_marshaller_1.toBoolean);
marshallers.set(Number, number_marshaller_1.toNumber);
marshallers.set(Object, object_marshaller_1.toObject);
marshallers.set(String, string_marshaller_1.toString);
marshallers.set(url_1.URL, url_marshaller_1.toURL);
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
//# sourceMappingURL=marshallers.js.map