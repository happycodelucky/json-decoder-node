"use strict";
/**
 * @module json-decoder
 *
 * JSON specific decoder and decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const decoder_declarations_1 = require("../decoder-declarations");
const decoder_map_1 = require("../decoder-map");
const url_1 = require("url");
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
    context: Symbol.for('jsonDecoder.context'),
};
/**
 *
 * @param options
 */
function jsonDecodable(options) {
    return (target) => {
        console.log(`Applying jsonDecodable for ${target.name}`);
        Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, true, target);
        const map = decoder_map_1.decoderMapForTarget(target);
        target.fromJSON = () => { };
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
    console.log(`Applying jsonSchema for ${target.name}`);
    Reflect.defineMetadata(exports.JsonDecoderMetadataKeys.schema, true, target);
    return target;
}
exports.jsonSchema = jsonSchema;
/**
 * JSON context object assigned to decoding object
 * Also addes `toJSON()` to return the decoded object back
 */
function jsonContext(target, key) {
    console.log(`Applying jsonContext for ${target.constructor.name}.${key}`);
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
    console.log(`Applying jsonProperty for ${target.constructor.name}.${key}`);
    const map = decoder_map_1.decoderMapForTarget(target.constructor);
    map[key] = {
        key,
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
        console.log(`Applying jsonPropertyAlias for ${target.constructor.name}.${key}`);
        const map = decoder_map_1.decoderMapForTarget(target.constructor);
        // Assign the property to the map
        if (type !== undefined) {
            map[key] = {
                key: keyPath || key,
                type,
                mapFunction,
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
        console.log(`Applying jsonPropertyHandler for ${target.constructor.name}.${key}`);
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
    console.log(`Applying jsonDecoder for ${target[key].name}`);
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
    console.log(`Applying jsonDecoder for ${target[key].name}`);
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
    console.log(`Applying jsonDecoderCompleted for ${target[key].name}`);
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
     * @param object
     * @return
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
        const objectFactory = Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decoder, classType);
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
            // Instantiate the object, without calling the constructor
            decodeObject = Object.create(classType.prototype);
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
                // // Check for swapped decode object
                // if (alternativeDecodeObject && alternativeDecodeObject !== decodeObject) {
                //     decodeObject = alternativeDecodeObject
                // }
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
                            type: handler.type,
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
        return objects.map(object => this.decode(object, classType)).filter(object => !!object);
    }
}
exports.JsonDecoder = JsonDecoder;
//
// Private functions
//
function evaluatePropertyValue(object, mapEntry, decodeObject) {
    if (!object) {
        return undefined;
    }
    if (!mapEntry) {
        return undefined;
    }
    let decoderMapEntry;
    if (typeof mapEntry === 'string') {
        decoderMapEntry = {
            key: mapEntry,
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
        const elementType = Array.isArray(decoderMapEntry.type) ? decoderMapEntry.type[0] : decoderMapEntry.type;
        let conversionFunction;
        if (elementType === Array) {
            conversionFunction = toArray;
        }
        else if (elementType === Boolean) {
            conversionFunction = toBoolean;
        }
        else if (elementType === Number) {
            conversionFunction = toNumber;
        }
        else if (elementType === String) {
            conversionFunction = toString;
        }
        else if (elementType === Object) {
            conversionFunction = toObject;
        }
        else if (elementType === url_1.URL) {
            conversionFunction = toURL;
        }
        else if (Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, elementType)) {
            // Element type might be decodable, so decode it
            conversionFunction = (value) => {
                if (typeof value === 'string' || (typeof value === 'object' && value !== null)) {
                    return JsonDecoder.decode(value, elementType);
                }
                return undefined;
            };
        }
        else {
            // TODO: Strict should assert?
            return undefined;
        }
        if (conversionFunction) {
            if (Array.isArray(decoderMapEntry.type)) {
                // Handle array conversion
                value = toArray(value).map(conversionFunction);
            }
            else if (Array.isArray(value)) {
                // Handle reverse array conversion
                if (value.length === 0) {
                    return undefined;
                }
                value = value[0];
                if (value === undefined) {
                    return undefined;
                }
                value = conversionFunction(value);
            }
            else {
                // Handle basic conversion
                value = conversionFunction(value);
            }
        }
        // If there is no value, it should be skipped
        // TODO: Strict should assert?
        if (value === undefined) {
            return undefined;
        }
        if (decoderMapEntry.mapFunction) {
            value = decoderMapEntry.mapFunction.call(decodeObject, value, object);
        }
        // No need to check for undefined, it's a user function and the user is in control
    }
    return value;
}
/**
 * Converts a value to a simple array
 * @param value - value to convert to an array
 */
function toArray(value) {
    if (value === undefined) {
        return [];
    }
    if (Array.isArray(value)) {
        return value;
    }
    return [value];
}
/**
 * Converts a JSON value to a Boolean, if possible
 *
 * @param value - value to conver to a number
 * @param strict - when true, parsing is strict and returns undefined if not able to be parsed
 *
 * @return parsed boolean or undefined
 */
function toBoolean(value, strict = false) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        if (/$[ \t]*(true|yes|1)[ \t]*^/i.test(value)) {
            return true;
        }
        else if (strict) {
            // Strict requires exact match to false
            if (/$[ \t]*(false|no|0)[ \t]*^/i.test(value)) {
                return false;
            }
        }
        else {
            // Non-strict
            return false;
        }
    }
    else if (typeof value === 'number') {
        if (!strict) {
            return value !== 0;
        }
        // Non-strict
        if (value === 0) {
            return false;
        }
        else if (value === 1) {
            return true;
        }
    }
    return undefined;
}
/**
 * Converts a JSON value to a Number, if possible
 *
 * @param value - value to conver to a number
 *
 * @return parsed number, NaN, or undefined
 */
function toNumber(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    else if (typeof value === 'string') {
        let trimmedValue = value.trim();
        const prefixMatch = /^([-+])?[ \t]*/.exec(trimmedValue);
        const factor = (prefixMatch && prefixMatch[1] === '-') ? -1 : 1;
        if (trimmedValue.startsWith('0x') || trimmedValue.startsWith('0X')) {
            const matches = /^[0-9A-F]+$/.exec(trimmedValue.slice(2));
            if (!matches) {
                return undefined;
            }
            return Number.parseInt(matches[0], 16) * factor;
        }
        else if (trimmedValue.startsWith('0b')) {
            const matches = /^[01]+$/.exec(trimmedValue.slice(2));
            if (!matches) {
                return undefined;
            }
            return Number.parseInt(matches[0], 2) * factor;
        }
        else {
            const matches = /^[0-9,]*([\.][0-9]+([Ee][+-][0-9]+)?)?$/.exec(trimmedValue);
            if (!matches) {
                return undefined;
            }
            const matchedValue = matches[0].replace(',', '');
            if (matches.length > 1) {
                return Number.parseFloat(matches[0]) * factor;
            }
            else {
                return Number.parseInt(matches[0], 10) * factor;
            }
        }
    }
    return Number.NaN;
}
/**
 * Converts a value to a String
 * @param value - a value
 */
function toString(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'string') {
        return value;
    }
    return value.toString();
}
/**
 * Converts a value to an Object
 * @param value - a value
 */
function toObject(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value === 'object') {
        return value;
    }
    return { value };
}
/**
 * Converts a string to a URL
 * @param value - only can use String values
 */
function toURL(value) {
    if (value === undefined) {
        return undefined;
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    return new url_1.URL(value);
}
//# sourceMappingURL=json-decoder.js.map