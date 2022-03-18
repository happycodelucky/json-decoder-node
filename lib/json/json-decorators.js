"use strict";
/**
 * Decorators to declare on JSON decodable classes, properties, and functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.jsonNotify = exports.jsonDecoderCompleted = exports.jsonDecoder = exports.jsonDecoderFactory = exports.jsonType = exports.jsonPropertyAlias = exports.jsonProperty = exports.jsonContext = exports.jsonSchema = exports.jsonDecodable = void 0;
require("reflect-metadata");
const createDebugLog = require("debug");
const decoder_declarations_1 = require("../decoder/decoder-declarations");
const decoder_declarations_2 = require("../decoder/decoder-declarations");
const decoder_map_1 = require("../decoder/decoder-map");
const json_symbols_1 = require("./json-symbols");
// Debug logger
const debug = createDebugLog('decoder:json');
/**
 * Declare a class as being decodable from a JSON object
 *
 * @param options - decoder options
 */
function jsonDecodable(options) {
    return (target) => {
        debug(`${target.name} applying jsonDecodable with options ${JSON.stringify(options)}`);
        Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, true, target);
        // Decodable options
        const decodableOptions = { ...options };
        Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decodableOptions, decodableOptions, target);
        // const map = decoderMapForTarget(target);
        // TODO: Output the decoder map for the target. Needs to be sanitize to output correctly
        return target;
    };
}
exports.jsonDecodable = jsonDecodable;
/**
 * An associated JSON schema to validate the JSON with before decoding
 * See http://json-schema.org/
 *
 * @param schema - JSON schema configuration
 * @param references - JSON decodable classes or schema references
 */
function jsonSchema(schema, ...references) {
    return (target) => {
        debug(`${target.name} applying jsonSchema`);
        const schemaMetadata = {
            schema,
            references,
        };
        Reflect.defineMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, schemaMetadata, target);
        return target;
    };
}
exports.jsonSchema = jsonSchema;
//
// Property decorators
//
/**
 * JSON context object (the origin JSON) assigned to decoding object
 * Also added `toJSON()` to return the decoded object back
 *
 * @example
 *   // Sets the origin JSON to a designated context property
 *   @jsonContext
 *   private json: JsonObject
 */
function jsonContext(target, key) {
    debug(`${target.constructor.name} applying jsonContext to ${key}`);
    Reflect.defineMetadata(json_symbols_1.JsonDecoderMetadataKeys.context, key, target.constructor);
    const descriptor = Reflect.getOwnPropertyDescriptor(target, key);
    Reflect.defineProperty(target, key, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: !!descriptor ? descriptor.value : undefined,
    });
    // defined toJSON if not already defined
    if (!('toJSON' in target)) {
        target['toJSON'] = function toJSON() {
            return { ...this[key] };
        };
    }
}
exports.jsonContext = jsonContext;
/**
 * Declares a JSON decodable property
 *
 * @example
 *   // Uses 'index' from JSON
 *   @jsonProperty()
 *   private index: number
 */
function jsonProperty(target, key) {
    debug(`${target.constructor.name} applying jsonProperty to ${key}`);
    const decoderMap = (0, decoder_map_1.decoderMapEntryForTarget)(key, target.constructor);
    if (typeof decoderMap.key !== 'string' || decoderMap.key.length === 0) {
        decoderMap.key = key;
    }
}
exports.jsonProperty = jsonProperty;
/**
 * Declares a JSON decodable property with optional key/key-path alias
 *
 * @example
 *   // Uses 'index' from JSON, assigned to '_index'
 *   @jsonPath('index')
 *   private _index: number
 *
 *   // Uses 'indexes' from JSON, taking the array value's 0 index
 *   @jsonPath('indexes[0]') - or - @jsonPath('indexes@0')
 *   private index: number
 *
 *   // Uses 'target: { index }' from JSON
 *   @jsonPath('target.index')
 *   private index: number
 *
 * @param keyPath - path to the property, or undefined to use property name
 */
function jsonPropertyAlias(keyPath) {
    if (typeof keyPath !== 'string' || keyPath.length === 0) {
        throw new TypeError('jsonProperty(keyPath) should be a non-empty String');
    }
    return (target, key) => {
        const decoderMap = (0, decoder_map_1.decoderMapEntryForTarget)(key, target.constructor);
        // TODO: Compile the path here instead of each decode
        decoderMap.key = keyPath;
    };
}
exports.jsonPropertyAlias = jsonPropertyAlias;
/**
 * Automatically maps (marshals) a value from a JSON property value into a desired type
 *
 * @example
 *   // Ensures a Number value will be assigned to 'index', mapped appropriately
 *   @jsonProperty()
 *   @jsonType(Number)
 *   private index: number
 *
 *   // Ensures a URL value will be assigned to 'endpoint', marshalled from a string appropriately
 *   @jsonProperty()
 *   @jsonType(URL)
 *   private index: URL
 *
 *   // Ensures the decoded value will be a string, and uses the string with a custom map function
 *   @jsonProperty()
 *   @jsonType(String, (value: string) => new RegEx.compile(value))
 *   private pattern: RegEx
 *
 * @param type - marshallable type
 * @param [mapFunction] - optional function taking an instance of `type`
 */
function jsonType(type, mapFunction) {
    if (Array.isArray(type) && type.length !== 1) {
        throw new TypeError('jsonType(type) should have exactly one element for Array types');
    }
    return (target, key) => {
        const decoderMapEntry = (0, decoder_map_1.decoderMapEntryForTarget)(key, target.constructor);
        const elementType = (0, decoder_declarations_2.isDecoderPrototypalCollectionTarget)(type) ? type.collection : type;
        debug(`${target.constructor.name} applying jsonType to ${key}, marshalling using ${elementType.name}`);
        decoderMapEntry.type = type;
        decoderMapEntry.mapFunction = mapFunction;
    };
}
exports.jsonType = jsonType;
//
// Function decorators
//
/**
 * Declares a function as being the decoder class factory, returning the class to instantiate with the JSON decoder
 *
 * @example
 *   @jsonDecoderFactory
 *   static decoderClassFactory(json: JsonObject) {
 *       // If 'type' is 'special' in our JSON object, return MySpecialClass to decode
 *       if ('type' in json && json.type === 'special') {
 *           return new MySpecialClass()
 *       }
 *
 *       return MyClass()
 *   }
 */
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
 * null will invalidate the decoding.
 *
 * Errors thrown here will be propagated
 *
 * @example
 *   @jsonDecoder
 *   public decoder(json: Object): MyClass | null { ... }
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
 * Associates a function to be called when a JSON property of a given key path is found.
 *
 * @example
 *   jsonNotify('index', Number)
 *   private onIndex(index: number, json: JsonObject) {
 *     // Do something with index
 *     // 'this' is set to the object being coded
 *   }
 *
 * @param keyPath - key path to the property from the root for the JSON
 * @param [type=undefined] - type declaration similar to jsonType to automatically map the property to
 */
function jsonNotify(keyPath, type) {
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
            mapFunction: descriptor.value,
        });
        return descriptor;
    };
}
exports.jsonNotify = jsonNotify;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvcmF0b3JzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvcmF0b3JzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsNEJBQXlCO0FBRXpCLHdDQUF1QztBQUV2QywwRUFBMEg7QUFDMUgsMEVBQXdIO0FBQ3hILHdEQUFrRjtBQUVsRixpREFBd0Q7QUFFeEQsZUFBZTtBQUNmLE1BQU0sS0FBSyxHQUFHLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQTtBQXNCNUM7Ozs7R0FJRztBQUNILFNBQWdCLGFBQWEsQ0FBQyxPQUE4QjtJQUN4RCxPQUFPLENBQW9DLE1BQVMsRUFBdUIsRUFBRTtRQUN6RSxLQUFLLENBQUMsR0FBRyxNQUFNLENBQUMsSUFBSSx3Q0FBd0MsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDdEYsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBRW5FLG9CQUFvQjtRQUNwQixNQUFNLGdCQUFnQixHQUF5QixFQUFDLEdBQUcsT0FBTyxFQUFDLENBQUE7UUFDM0QsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV0RiwyQ0FBMkM7UUFDM0Msd0ZBQXdGO1FBRXhGLE9BQTZCLE1BQU0sQ0FBQTtJQUN2QyxDQUFDLENBQUE7QUFDTCxDQUFDO0FBZEQsc0NBY0M7QUFtQkQ7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsVUFBVSxDQUFDLE1BQTJCLEVBQUUsR0FBRyxVQUE2RDtJQUNwSCxPQUFPLENBQW9DLE1BQVMsRUFBSyxFQUFFO1FBQ3ZELEtBQUssQ0FBQyxHQUFHLE1BQU0sQ0FBQyxJQUFJLHNCQUFzQixDQUFDLENBQUE7UUFDM0MsTUFBTSxjQUFjLEdBQThC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