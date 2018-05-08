/**
 * JSON specific decoder and decorators
 */

import 'reflect-metadata'

import { DecoderMetadataKeys, DecoderPrototypalTarget } from '../decoder/decoder-declarations'
import { DecoderPrototypalCollectionTarget, isDecoderPrototypalCollectionTarget } from '../decoder/decoder-declarations'
import { DecoderMapEntry, decoderMapForTarget } from '../decoder/decoder-map'

import { CollectionMarshallerFunction, MarshallerFunction } from '../marshallers/marshallers'
import { collectionMarshallerForType, marshallerForType } from '../marshallers/marshallers'

import { JsonObject } from './json-decodable-types'
import { JsonDecodableOptions } from './json-decorators'
import { JsonDecoderMetadataKeys } from './json-symbols'

/**
 * JSON decoder for JSON decodable classes
 */
// tslint:disable:no-unnecessary-class
export class JsonDecoder {
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - JSON object or string to decode
     * @param classType - Decodeable class type
     * @return results of the decoding
     */
    static decode<T extends object>(objectOrString: string | JsonObject, classType: DecoderPrototypalTarget): T | null {
        if (objectOrString === null || objectOrString === undefined) {
            return null
        }

        // Extract our JSON object
        let object: object
        if (typeof objectOrString === 'string') {
            object = JSON.parse(objectOrString)
        } else if (Array.isArray(objectOrString) || typeof objectOrString === 'object') {
            // Arrays are objects too, and can be queried with @0.value
            object = objectOrString
        } else {
            throw new TypeError('decode(object) should be an Object or a String')
        }

        let decodeObject

        // Create our decoding object using a decoder function if registered
        const objectFactory = Reflect.getMetadata(DecoderMetadataKeys.decoderFactory, classType)
        if (objectFactory) {
            decodeObject = objectFactory.call(classType, object)

            // Check for invalidation
            if (decodeObject === null) {
                return null
            }

            // With a new object can come a new decoder configuration
            if (decodeObject !== undefined) {
                classType = decodeObject.constructor
            }
        }
        if (!decodeObject) {
            const options = <JsonDecodableOptions> Reflect.getOwnMetadata(DecoderMetadataKeys.decodableOptions, classType)
            if (options && options.useConstructor) {
                const constructable = classType as ObjectConstructor
                decodeObject = new constructable()
            } else {
                // Instantiate the object, without calling the constructor
                decodeObject = Object.create(classType.prototype) as T
            }
        }

        // Check if a context needs to be set
        const contextKey = Reflect.getMetadata(JsonDecoderMetadataKeys.context, classType)
        if (contextKey) {
            decodeObject[contextKey] = object
        }

        // Walk the prototype chain, adding the constructor functions in reverse order
        const classConstructors: DecoderPrototypalTarget[] = []
        let prototype = classType.prototype
        while (prototype !== Object.prototype) {
            if (!!Reflect.getOwnMetadata(DecoderMetadataKeys.decodable, prototype.constructor)) {
                classConstructors.unshift(prototype.constructor)
            }
            prototype = Reflect.getPrototypeOf(prototype)
        }

        // Iterate through the class heirarchy
        for (const constructor of classConstructors) {
            // Check for a before decode function on a constructor function's prototype
            const decoder = Reflect.getOwnMetadata(DecoderMetadataKeys.decoder, constructor.prototype)
            if (decoder) {
                const alternativeDecodeObject = decoder.call(decodeObject, object)
                // Check for invalidation
                if (alternativeDecodeObject === null) {
                    return null
                }
            }

            // Look up decoder map for the constructor function
            const decoderMap = decoderMapForTarget(constructor)
            for (const key of Reflect.ownKeys(decoderMap)) {
                const mapEntry = decoderMap[key] as DecoderMapEntry
                const value = evaluatePropertyValue(object, mapEntry, decodeObject)
                if (value !== undefined) {
                    decodeObject[key] = value
                }
            }
        }

        // Iterate through the class heirarchy for prototype decoders, this time calling all the property notifiers
        // This is done after all mapped properties have been assigned
        for (const constructor of classConstructors) {
            const propertyNotifiers: Map<string, DecoderMapEntry[]> = Reflect.getOwnMetadata(
                DecoderMetadataKeys.decoderNotifiers,
                constructor,
            )
            if (propertyNotifiers) {
                for (const handlers of propertyNotifiers.values()) {
                    for (const handler of handlers) {
                        const value = evaluatePropertyValue(
                            object,
                            {
                                key: handler.key,
                                type: handler.type,
                            },
                            decodeObject,
                        )
                        if (value !== undefined) {
                            // TODO: Capture errors from handlers
                            handler.mapFunction!.call(decodeObject, value, object)
                        }
                    }
                }
            }
        }

        // Iterate through the class heirarchy for prototype decoders, calling the decoder complete function
        // This done after all potential assigments
        for (const constructor of classConstructors) {
            // Check for a after decode prototype function
            const decoderComplete = Reflect.getOwnMetadata(DecoderMetadataKeys.decoderCompleted, constructor.prototype)
            if (decoderComplete) {
                const completeObject: any = decoderComplete.call(decodeObject, object)
                // Check for invalidation
                if (completeObject === null) {
                    return null
                }
                // Check for swapped decode object
                if (completeObject && completeObject !== decodeObject) {
                    decodeObject = completeObject
                }
            }
        }

        return decodeObject
    }

    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param object
     * @return
     */
    static decodeArray<T extends object>(
        objectOrString: string | JsonObject[],
        classType: DecoderPrototypalTarget,
    ): [T] | null {
        if (objectOrString === null || objectOrString === undefined) {
            return null
        }

        let objects: object[]
        if (typeof objectOrString === 'string') {
            objects = JSON.parse(objectOrString)
        } else if (Array.isArray(objectOrString)) {
            objects = objectOrString
        } else {
            throw new TypeError('decode(object) should be an Array of Objects or a String')
        }

        return objects.map<T | null>((object) => this.decode<T>(object, classType)).filter((object) => !!object) as [T]
    }
}

//
// Private functions
//

/**
 * Creates a marshaller for a given type declaration to use for conversion
 *
 * @param type - desired conversion type
 * @return conversion function or undefined
 */
function createMarshaller(type: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget):
    ((value: any, strict?: boolean) => any) | undefined
{
    if (isDecoderPrototypalCollectionTarget(type)) {
        let collectionMarshaller: CollectionMarshallerFunction | undefined
        if (Reflect.getOwnMetadata(DecoderMetadataKeys.decodable, type.collection)) {
            collectionMarshaller = (value: any, itemMarhsaller?: MarshallerFunction, strict?: boolean) => {
                if (typeof value === 'boolean'
                    || typeof value === 'number'
                    || typeof value === 'string'
                    || (typeof value === 'object' && value !== null)) {
                    return JsonDecoder.decode(value, type.collection)
                }
                if (strict) {
                    throw new TypeError(`${typeof value} cannot be converted to ${type.collection.name}`)
                }

                return undefined
            }
        } else {
            collectionMarshaller = collectionMarshallerForType(type.collection)
        }

        if (!collectionMarshaller) {
            return undefined;
        }

        const elementMarshaller = createMarshaller(type.element)

        return (value: any, strict?: boolean) => {
            return collectionMarshaller!(value, elementMarshaller, strict)
        }
    }

    return marshallerForType(type)
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
function evaluatePropertyValue(
    object: object,
    mapEntry: DecoderMapEntry,
    decodeObject: object,
    strict: boolean = false,
): any {
    if (!object) {
        return undefined
    }
    if (!mapEntry) {
        return undefined
    }

    // Ensure consistent use of DecoderMapEntry
    let decoderMapEntry: DecoderMapEntry
    if (typeof mapEntry === 'string') {
        decoderMapEntry = {
            key: mapEntry,
        }
    } else {
        decoderMapEntry = mapEntry
    }

    // Look up the property key path in the JSON object
    const keyPaths = decoderMapEntry.key.split(/@|\./)
    let value: any = object
    do {
        const path = keyPaths.shift()!
        if (!path) {
            continue
        }

        // Can only inspect object values, fail if we cannot resolve the value
        if (typeof value !== 'object' && typeof value !== 'string' && !Array.isArray(value)) {
            // TODO: Throw error?
            return undefined
        }
        value = Reflect.get(value, path)
    } while (keyPaths.length > 0 && value !== null && value !== undefined)

    // If there is an undefined value return it (do not return on null)
    if (value === undefined) {
        return undefined
    }

    // Check any type conversion
    if (decoderMapEntry.type) {
        const marshaller = createMarshaller(decoderMapEntry.type)
        if (marshaller) {
            value = marshaller(value, strict)
        } else {
            if (strict) {
                const rootType =
                    isDecoderPrototypalCollectionTarget(decoderMapEntry.type) ? decoderMapEntry.type.collection : decoderMapEntry.type
                throw new TypeError(`${rootType.name} is not a JSON decodable type`)
            }

            return undefined
        }

        // If there is no value, it should be skipped
        if (value === undefined) {
            return undefined
        }

        if (decoderMapEntry.mapFunction) {
            value = decoderMapEntry.mapFunction.call(decodeObject, value, object)
        }
    }

    return value
}
