"use strict";
/**
 * @module json-decoder
 *
 * JSON specific decoder and decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const createDebugLog = require("debug");
const decoder_declarations_1 = require("../decoder-declarations");
const decoder_map_1 = require("../decoder-map");
const marshallers_1 = require("../marshallers/marshallers");
// Debug logger
const debug = createDebugLog('decoder:json');
/**
 * Reflection metadata keys
 */
exports.JsonDecoderMetadataKeys = {
    /**
     * Metadata for the JSON schema
     */
    schema: Symbol.for('jsonDecoder.schema'),
    /**
     * JSON context object
     */
    context: Symbol.for('jsonDecoder.context')
};
/**
 * Declare a class as being decodable
 * @param options
 */
function jsonDecodable(options) {
    return (target) => {
        debug(`${target.name} applying jsonDecodable with options ${JSON.stringify(options)}`);
        Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, true, target);
        // Decodable options
        const decodableOptions = Object.assign({}, options);
        delete decodableOptions.schema;
        Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decodableOptions, decodableOptions, target);
        // JSON schema
        if (options && options.schema) {
            Reflect.defineMetadata(exports.JsonDecoderMetadataKeys.schema, options.schema, target);
        }
        // const map = decoderMapForTarget(target);
        // TODO: Output the decoder map for the target. Needs to be sanitize to output correctly
        return target;
    };
}
exports.jsonDecodable = jsonDecodable;
/**
 *
 * @param options
 */
function jsonSchema(target) {
    debug(`${target.name} applying jsonSchema`);
    Reflect.defineMetadata(exports.JsonDecoderMetadataKeys.schema, true, target);
    return target;
}
exports.jsonSchema = jsonSchema;
/**
 * JSON context object assigned to decoding object
 * Also addes `toJSON()` to return the decoded object back
 */
function jsonContext(target, key) {
    debug(`${target.constructor.name} applying jsonContext to ${key}`);
    Reflect.defineMetadata(exports.JsonDecoderMetadataKeys.context, key, target.constructor);
    // Defined toJSON if not already defined
    if (!('toJSON' in target)) {
        target['toJSON'] = function toJSON() {
            return Object.assign({}, this[key]);
        };
    }
}
exports.jsonContext = jsonContext;
/**
 * Maps a top-level JSON property to a prototype property in the decoding object. The property names should match
 * verbatim in the JSON. The value will be unmodified and assigned to the property.
 *
 * @example
 *   @jsonProperty
 *   public name: string
 */
function jsonProperty(target, key) {
    debug(`${target.constructor.name} applying jsonProperty to ${key}`);
    const map = decoder_map_1.decoderMapForTarget(target.constructor);
    map[key] = {
        key
    };
}
exports.jsonProperty = jsonProperty;
/**
 *
 * @example
 *   // Maps 'index' in the JSON to `_index` on the decoding object
 *   @jsonPropertyAlias('index')
 *   private _index: number
 *
 *   // Maps 'model.serialNumber' in the JSON to `serial` on the decoding object, and converts the value to a Number if
 *   // not already a Number
 *   @jsonPropertyAlias('model.serialNumber', Number)
 *   public serial: number
 *
 *   // Used default mapping, and converts a single property value or array to an array of Strings.
 *   @jsonPropertyAlias(undefined, [String])
 *   public flags: Array<String>
 *
 * @param keyPath
 * @param type
 * @param mapFunction
 */
function jsonPropertyAlias(keyPath, type, mapFunction) {
    if (keyPath !== undefined && typeof keyPath !== 'string') {
        throw new TypeError('jsonPropertyAlias(keyPath) should be a non-empty String');
    }
    if (Array.isArray(type) && type.length !== 1) {
        throw new TypeError('jsonPropertyAlias(type) should have exactly one element for Array types');
    }
    return (target, key) => {
        const rootType = Array.isArray(type) ? type[0] : type;
        if (rootType) {
            const elementType = decoder_declarations_1.isDecoderPrototypalCollectionTarget(rootType) ? rootType.collection : rootType;
            debug(`${target.constructor.name} applying jsonPropertyAlias ${keyPath} to ${key}, marshalling using ${elementType.name}`);
        }
        else {
            debug(`${target.constructor.name} applying jsonPropertyAlias ${keyPath} to ${key}`);
        }
        const map = decoder_map_1.decoderMapForTarget(target.constructor);
        // For backwards compatibility
        if (Array.isArray(type)) {
            type = {
                collection: Array,
                element: type[0]
            };
        }
        // Assign the property to the map
        if (type !== undefined) {
            map[key] = {
                key: keyPath || key,
                type,
                mapFunction
            };
        }
        else {
            map[key] = {
                key: keyPath || key,
                mapFunction
            };
        }
    };
}
exports.jsonPropertyAlias = jsonPropertyAlias;
/**
 *
 * @param keyPath - key path to the property from the root for the JSON
 * @param [type] - marshalable type to covert a property to
 * @param {PropertyDescriptor} descriptor
 * @returns
 */
function jsonPropertyHandler(keyPath, type) {
    if (typeof keyPath !== 'string') {
        throw new TypeError('jsonPropertyHandler(keyPath) should be a non-empty String');
    }
    if (Array.isArray(type) && type.length !== 1) {
        throw new TypeError('jsonPropertyHandler(type) should have exactly one element for Array types');
    }
    return (target, key, descriptor) => {
        debug(`${target.constructor.name} applying jsonPropertyHandler ${keyPath} to ${key}`);
        let notifiers = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderNotifiers, target.constructor);
        if (!notifiers) {
            notifiers = new Map();
            Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderNotifiers, notifiers, target.constructor);
        }
        let propertyNotifiers = notifiers.get(keyPath);
        if (!propertyNotifiers) {
            propertyNotifiers = [];
            notifiers.set(keyPath, propertyNotifiers);
        }
        propertyNotifiers.push({
            key: keyPath,
            type,
            mapFunction: descriptor.value
        });
        return descriptor;
    };
}
exports.jsonPropertyHandler = jsonPropertyHandler;
function jsonDecoderFactory(target, key, descriptor) {
    debug(`${target.name} applying jsonDecoderFactory to ${key}`);
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderFactory, target[key], target);
    return descriptor;
}
exports.jsonDecoderFactory = jsonDecoderFactory;
/**
 * Specifies the decoder function. This decoration behaves differently depending on the placement on the
 * class(static function)/constructor function itself, or on the class prototype. Both may be used, if desired.
 * In both case the source JSON object will be supplied to aid decoding.
 *
 * When applied to the class (static function) the decoder function must return the decoded object, or initialize
 * and object to begin decoding. Returning undefined will fallback to the default object creation, returning null will
 * invalidate decoding.
 *
 * When applied to a prototype function, the decoding object will have been created. The function must return this or
 * a replacement object. Returning undefined will fallback and use the same decoding object already created, returning
 * nulll will invalidate the decoding.
 *
 * Errors thrown here will be propagated
 *
 * @example
 *   @jsonDecoder
 *   function decoder(json: Object): MyClass | null { ... }
 */
function jsonDecoder(target, key, descriptor) {
    debug(`${target.constructor.name} applying jsonDecoder to ${key}`);
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoder, target[key], target);
    return descriptor;
}
exports.jsonDecoder = jsonDecoder;
/**
 * Specifies the function called on the decoded object when decoding has completed. At this point all properties have
 * been assigned, and all property handler functions called. `jsonDecoderCompleted` only can be called on prototype
 * functions, and provides a last chance to perform any additional decoding, validation, or invalidation.
 *
 * Like `jsonDecoder` returning `null` invalidates the decoded object.
 *
 * Errors thrown here will be propagated
 *
 * @example
 *   @jsonDecoderComplete
 *   function decoder(json: Object): MyClass | null { ... }
 */
function jsonDecoderCompleted(target, key, descriptor) {
    debug(`${target.constructor.name} applying jsonDecoderCompleted to ${key}`);
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderCompleted, target[key], target);
    return descriptor;
}
exports.jsonDecoderCompleted = jsonDecoderCompleted;
/**
 * JSON decoder for JSON decodable classes
 */
class JsonDecoder {
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - JSON object or string to decode
     * @param classType - Decodeable class type
     * @return results of the decoding
     */
    static decode(objectOrString, classType) {
        if (objectOrString === null || objectOrString === undefined) {
            return null;
        }
        // Extract our JSON object
        let object;
        if (typeof objectOrString === 'string') {
            object = JSON.parse(objectOrString);
        }
        else if (Array.isArray(objectOrString) || typeof objectOrString === 'object') {
            // Arrays are objects too, and can be queried with @0.value
            object = objectOrString;
        }
        else {
            throw new TypeError('decode(object) should be an Object or a String');
        }
        let decodeObject;
        // Create our decoding object using a decoder function if registered
        const objectFactory = Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderFactory, classType);
        if (objectFactory) {
            decodeObject = objectFactory.call(classType, object);
            // Check for invalidation
            if (decodeObject === null) {
                return null;
            }
            // With a new object can come a new decoder configuration
            if (decodeObject !== undefined) {
                classType = decodeObject.constructor;
            }
        }
        if (!decodeObject) {
            const options = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, classType);
            if (options && options.useConstructor) {
                const constructable = classType;
                decodeObject = new constructable();
            }
            else {
                // Instantiate the object, without calling the constructor
                decodeObject = Object.create(classType.prototype);
            }
        }
        // Check if a context needs to be set
        const contextKey = Reflect.getMetadata(exports.JsonDecoderMetadataKeys.context, classType);
        if (contextKey) {
            decodeObject[contextKey] = object;
        }
        // Walk the prototype chain, adding the constructor functions in reverse order
        const classConstructors = [];
        let prototype = classType.prototype;
        while (prototype !== Object.prototype) {
            if (!!Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, prototype.constructor)) {
                classConstructors.unshift(prototype.constructor);
            }
            prototype = Reflect.getPrototypeOf(prototype);
        }
        // Iterate through the class heirarchy
        for (const constructor of classConstructors) {
            // Check for a before decode function on a constructor function's prototype
            const decoder = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoder, constructor.prototype);
            if (decoder) {
                const alternativeDecodeObject = decoder.call(decodeObject, object);
                // Check for invalidation
                if (alternativeDecodeObject === null) {
                    return null;
                }
            }
            // Look up decoder map for the constructor function
            const decoderMap = decoder_map_1.decoderMapForTarget(constructor);
            for (const key in decoderMap) {
                const mapEntry = decoderMap[key];
                const value = evaluatePropertyValue(object, mapEntry, decodeObject);
                if (value !== undefined) {
                    decodeObject[key] = value;
                }
            }
        }
        // Iterate through the class heirarchy for prototype decoders, this time calling all the property notifiers
        // This is done after all mapped properties have been assigned
        for (const constructor of classConstructors) {
            const propertyNotifiers = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderNotifiers, constructor);
            if (propertyNotifiers) {
                for (const [key, handlers] of propertyNotifiers.entries()) {
                    for (const handler of handlers) {
                        const value = evaluatePropertyValue(object, {
                            key: handler.key,
                            type: handler.type
                        }, decodeObject);
                        if (value !== undefined) {
                            // TODO: Capture errors from handlers
                            handler.mapFunction.call(decodeObject, value, object);
                        }
                    }
                }
            }
        }
        // Iterate through the class heirarchy for prototype decoders, calling the decoder complete function
        // This done after all potential assigments
        for (const constructor of classConstructors) {
            // Check for a after decode prototype function
            const decoderComplete = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderCompleted, constructor.prototype);
            if (decoderComplete) {
                const completeObject = decoderComplete.call(decodeObject, object);
                // Check for invalidation
                if (completeObject === null) {
                    return null;
                }
                // Check for swapped decode object
                if (completeObject && completeObject !== decodeObject) {
                    decodeObject = completeObject;
                }
            }
        }
        return decodeObject;
    }
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param object
     * @return
     */
    static decodeArray(objectOrString, classType) {
        if (objectOrString === null || objectOrString === undefined) {
            return null;
        }
        let objects;
        if (typeof objectOrString === 'string') {
            objects = JSON.parse(objectOrString);
        }
        else if (Array.isArray(objectOrString)) {
            objects = objectOrString;
        }
        else {
            throw new TypeError('decode(object) should be an Array of Objects or a String');
        }
        return objects.map((object) => this.decode(object, classType)).filter((object) => !!object);
    }
}
exports.JsonDecoder = JsonDecoder;
//
// Private functions
//
/**
 * Creates a marshaller for a given type declaration to use for conversion
 *
 * @param type - desired conversion type
 * @return conversion function or undefined
 */
function createMarshaller(type) {
    if (decoder_declarations_1.isDecoderPrototypalCollectionTarget(type)) {
        let collectionMarshaller;
        if (Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, type.collection)) {
            collectionMarshaller = (value, strict) => {
                if (typeof value === 'boolean'
                    || typeof value === 'number'
                    || typeof value === 'string'
                    || (typeof value === 'object' && value !== null)) {
                    return JsonDecoder.decode(value, type.collection);
                }
                if (strict) {
                    throw new TypeError(`${typeof value} cannot be converted to ${type.collection.name}`);
                }
                return undefined;
            };
        }
        else {
            collectionMarshaller = marshallers_1.collectionMarshallerForType(type.collection);
        }
        if (!collectionMarshaller) {
            return undefined;
        }
        const elementMarshaller = createMarshaller(type.element);
        return (value, strict) => {
            return collectionMarshaller(value, elementMarshaller, strict);
        };
    }
    return marshallers_1.marshallerForType(type);
}
/**
 * Evaluates a property of an object (being decoded) based on a map entry for the decoder.
 *
 * @param object - object being decoded
 * @param mapEntry - decoder map entry
 * @param decodeObject - object being populated by the decoder
 * @param strict - when true, parsing is strict and throws a TypeError if the value cannot be converted
 * @returns evaluated property value
 *
 * @throws TypeError
 */
function evaluatePropertyValue(object, mapEntry, decodeObject, strict = false) {
    if (!object) {
        return undefined;
    }
    if (!mapEntry) {
        return undefined;
    }
    // Ensure consistent use of DecoderMapEntry
    let decoderMapEntry;
    if (typeof mapEntry === 'string') {
        decoderMapEntry = {
            key: mapEntry
        };
    }
    else {
        decoderMapEntry = mapEntry;
    }
    // Look up the property key path in the JSON object
    const keyPaths = decoderMapEntry.key.split(/@|\./);
    let value = object;
    do {
        const path = keyPaths.shift();
        if (!path) {
            continue;
        }
        // Can only inspect object values, fail if we cannot resolve the value
        if (typeof value !== 'object' && typeof value !== 'string' && !Array.isArray(value)) {
            // TODO: Throw error?
            return undefined;
        }
        value = Reflect.get(value, path);
    } while (keyPaths.length > 0 && value !== null && value !== undefined);
    // If there is an undefined value return it (do not return on null)
    if (value === undefined) {
        return undefined;
    }
    // Check any type conversion
    if (decoderMapEntry.type) {
        let marshaller = createMarshaller(decoderMapEntry.type);
        if (marshaller) {
            value = marshaller(value, strict);
        }
        else {
            if (strict) {
                const rootType = decoder_declarations_1.isDecoderPrototypalCollectionTarget(decoderMapEntry.type) ? decoderMapEntry.type.collection : decoderMapEntry.type;
                throw new TypeError(`${rootType.name} is not a JSON decodable type`);
            }
            return undefined;
        }
        // If there is no value, it should be skipped
        if (value === undefined) {
            return undefined;
        }
        if (decoderMapEntry.mapFunction) {
            value = decoderMapEntry.mapFunction.call(decodeObject, value, object);
        }
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOztBQUVILDRCQUF5QjtBQUV6Qix3Q0FBdUM7QUFDdkMsa0VBQTBMO0FBQzFMLGdEQUEyRjtBQUUzRiw0REFBMkY7QUFHM0YsZUFBZTtBQUNmLE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQXNCNUM7O0dBRUc7QUFDVSxRQUFBLHVCQUF1QixHQUFHO0lBQ25DOztPQUVHO0lBQ0gsTUFBTSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsb0JBQW9CLENBQUM7SUFFeEM7O09BRUc7SUFDSCxPQUFPLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxxQkFBcUIsQ0FBQztDQUM3QyxDQUFBO0FBRUQ7OztHQUdHO0FBQ0gsdUJBQThCLE9BQThCO0lBQ3hELE1BQU0sQ0FBQyxDQUFvQyxNQUFTLEVBQXVCLEVBQUU7UUFDekUsS0FBSyxDQUFDLEdBQUcsTUFBTSxDQUFDLElBQUksd0NBQXdDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3RGLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUVuRSxvQkFBb0I7UUFDcEIsTUFBTSxnQkFBZ0IsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLEVBQUUsRUFBRSxPQUFPLENBQUMsQ0FBQTtRQUNuRCxPQUFPLGdCQUFnQixDQUFDLE1BQU0sQ0FBQTtRQUM5QixPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLGdCQUFnQixFQUFFLGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBRXRGLGNBQWM7UUFDZCxFQUFFLENBQUMsQ0FBQyxPQUFPLElBQUksT0FBTyxDQUFDLE1BQU0s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