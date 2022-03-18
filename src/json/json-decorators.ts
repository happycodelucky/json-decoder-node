/**
 * Decorators to declare on JSON decodable classes, properties, and functions
 */

import 'reflect-metadata'

import * as createDebugLog from 'debug'

import { DecoderConstructableTarget, DecoderMetadataKeys, DecoderPrototypalTarget } from '../decoder/decoder-declarations'
import { DecoderPrototypalCollectionTarget, isDecoderPrototypalCollectionTarget } from '../decoder/decoder-declarations'
import { DecoderMapEntry, decoderMapEntryForTarget } from '../decoder/decoder-map'
import { JsonConvertable, JsonObject } from './json-decodable-types'
import { JsonDecoderMetadataKeys } from './json-symbols'

// Debug logger
const debug = createDebugLog('decoder:json')

//
// Class decorators
//

/**
 * Options provided to a `jsonDecodable` class
 */
export interface JsonDecodableOptions {
    /**
     * Strict mode
     */
    strict?: boolean

    /**
     * When true will call the constructor function (default)
     * If a constructor function is not then no TypeScript initialization of properties is performed
     */
    useConstructor?: boolean
}

/**
 * Declare a class as being decodable from a JSON object
 *
 * @param options - decoder options
 */
export function jsonDecodable(options?: JsonDecodableOptions) {
    return <T extends DecoderPrototypalTarget>(target: T): T & JsonConvertable => {
        debug(`${target.name} applying jsonDecodable with options ${JSON.stringify(options)}`)
        Reflect.defineMetadata(DecoderMetadataKeys.decodable, true, target)

        // Decodable options
        const decodableOptions: JsonDecodableOptions = {...options}
        Reflect.defineMetadata(DecoderMetadataKeys.decodableOptions, decodableOptions, target)

        // const map = decoderMapForTarget(target);
        // TODO: Output the decoder map for the target. Needs to be sanitize to output correctly

        return <T & JsonConvertable> target
    }
}

/**
 * Json schema as used by a JSON decodable object
 * TODO: Use an interface describing the supported schema version (not available in ajv)
 */
export interface JsonDecodableSchema extends Record<string, any> {
    $schema: string
    $id?: string
}

/**
 * Interface for schema metadata set on a target
 */
export interface JsonDecoderSchemaMetadata {
    schema: JsonDecodableSchema,
    references?: (JsonDecodableSchema | DecoderPrototypalTarget)[]
}

/**
 * An associated JSON schema to validate the JSON with before decoding
 * See http://json-schema.org/
 *
 * @param schema - JSON schema configuration
 * @param references - JSON decodable classes or schema references
 */
export function jsonSchema(schema: JsonDecodableSchema, ...references: (JsonDecodableSchema | DecoderPrototypalTarget)[]) {
    return <T extends DecoderPrototypalTarget>(target: T): T => {
        debug(`${target.name} applying jsonSchema`)
        const schemaMetadata: JsonDecoderSchemaMetadata = {
            schema,
            references,
        }
        Reflect.defineMetadata(JsonDecoderMetadataKeys.schema, schemaMetadata, target)

        return target
    }
}

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
export function jsonContext<T extends DecoderConstructableTarget & { toJSON(): JsonObject }>(target: T, key: string) {
    debug(`${target.constructor.name} applying jsonContext to ${key}`)
    Reflect.defineMetadata(JsonDecoderMetadataKeys.context, key, target.constructor)

    const descriptor = Reflect.getOwnPropertyDescriptor(target, key)
    Reflect.defineProperty(target, key, {
        configurable: true,
        writable: true,
        enumerable: false,
        value: !!descriptor ? descriptor.value : undefined,
    })

    // defined toJSON if not already defined
    if (!('toJSON' in target)) {
        target['toJSON'] = function toJSON() {
            return {...this[key]}
        }
    }
}

/**
 * Declares a JSON decodable property
 *
 * @example
 *   // Uses 'index' from JSON
 *   @jsonProperty()
 *   private index: number
 */
export function jsonProperty<T extends DecoderConstructableTarget>(target: T, key: string) {
    debug(`${target.constructor.name} applying jsonProperty to ${key}`)

    const decoderMap = decoderMapEntryForTarget(key, target.constructor);
    if (typeof decoderMap.key !== 'string' || decoderMap.key.length === 0) {
        decoderMap.key = key
    }
}

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
export function jsonPropertyAlias(keyPath: string) {
    if (typeof keyPath !== 'string' || keyPath.length === 0) {
        throw new TypeError('jsonProperty(keyPath) should be a non-empty String')
    }

    return (target: DecoderConstructableTarget, key: string) => {
        const decoderMap = decoderMapEntryForTarget(key, target.constructor)
        // TODO: Compile the path here instead of each decode
        decoderMap.key = keyPath
    }
}

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
export function jsonType(
    type: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget,
    mapFunction?: (value: any) => any,
) {
    if (Array.isArray(type) && type.length !== 1) {
        throw new TypeError('jsonType(type) should have exactly one element for Array types')
    }

    return (target: DecoderConstructableTarget, key: string) => {
        const decoderMapEntry = decoderMapEntryForTarget(key, target.constructor)

        const elementType = isDecoderPrototypalCollectionTarget(type) ? type.collection : type
        debug(`${target.constructor.name} applying jsonType to ${key}, marshalling using ${elementType.name}`)

        decoderMapEntry.type = type
        decoderMapEntry.mapFunction = mapFunction
    }
}

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
export function jsonDecoderFactory(target: DecoderPrototypalTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    debug(`${target.name} applying jsonDecoderFactory to ${key}`)
    Reflect.defineMetadata(DecoderMetadataKeys.decoderFactory, target[key], target)

    return descriptor
}

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
export function jsonDecoder(target: DecoderConstructableTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    debug(`${target.constructor.name} applying jsonDecoder to ${key}`)
    Reflect.defineMetadata(DecoderMetadataKeys.decoder, target[key], target)

    return descriptor
}

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
export function jsonDecoderCompleted(target: DecoderConstructableTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor {
    debug(`${target.constructor.name} applying jsonDecoderCompleted to ${key}`)
    Reflect.defineMetadata(DecoderMetadataKeys.decoderCompleted, target[key], target)

    return descriptor
}

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
export function jsonNotify(keyPath: string, type?: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget) {
    if (typeof keyPath !== 'string') {
        throw new TypeError('jsonPropertyHandler(keyPath) should be a non-empty String')
    }
    if (Array.isArray(type) && type.length !== 1) {
        throw new TypeError('jsonPropertyHandler(type) should have exactly one element for Array types')
    }

    return <T extends DecoderConstructableTarget>(target: T, key: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
        debug(`${target.constructor.name} applying jsonPropertyHandler ${keyPath} to ${key}`)

        let notifiers = Reflect.getOwnMetadata(
            DecoderMetadataKeys.decoderNotifiers,
            target.constructor,
        ) as Map<string, DecoderMapEntry[]> | undefined

        if (!notifiers) {
            notifiers = new Map()
            Reflect.defineMetadata(DecoderMetadataKeys.decoderNotifiers, notifiers, target.constructor)
        }
        let propertyNotifiers = notifiers.get(keyPath)
        if (!propertyNotifiers) {
            propertyNotifiers = []
            notifiers.set(keyPath, propertyNotifiers)
        }
        propertyNotifiers.push({
            key: keyPath,
            type,
            mapFunction: descriptor.value as ((value: any) => any) | undefined,
        })

        return descriptor
    }
}
