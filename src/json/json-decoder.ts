/**
 * JSON specific decoder and decorators
 */

import 'reflect-metadata'

import * as ajv from 'ajv'
// @ts-ignore
import * as ajvErrors from 'ajv-errors'

import { ErrorObject, RequiredParams, ValidateFunction, AdditionalPropertiesParams } from 'ajv'

import { DecoderMetadataKeys, DecoderPrototypalTarget } from '../decoder/decoder-declarations'
import { DecoderPrototypalCollectionTarget, isDecoderPrototypalCollectionTarget } from '../decoder/decoder-declarations'
import { DecoderMap, DecoderMapEntry, decoderMapForTarget } from '../decoder/decoder-map'

import { CollectionMarshallerFunction, MarshallerFunction } from '../marshallers/marshallers'
import { collectionMarshallerForType, marshallerForType } from '../marshallers/marshallers'

import { JsonObject } from './json-decodable-types'
import { JsonDecoderValidationError } from './json-decoder-errors'
import { JsonDecodableOptions, JsonDecodableSchema, JsonDecoderSchemaMetadata } from './json-decorators'
import { JsonDecoderMetadataKeys } from './json-symbols'
import { JsonValidationError, JsonValidatorPropertyMissingError, JsonValidatorPropertyValueError, JsonValidatorPropertyUnsupportedError } from './json-validation-errors'

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
            // Will throw an exception if the JSON has a syntax error
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
            const options = Reflect.getOwnMetadata(DecoderMetadataKeys.decodableOptions, classType) as JsonDecodableOptions | undefined
            if (options && options.useConstructor) {
                const constructable = classType as ObjectConstructor
                decodeObject = new constructable()
            } else {
                // Instantiate the object, without calling the constructor
                decodeObject = Object.create(classType.prototype) as T
            }
        }

        // Validate the JSON
        // This will throw an exception if not valid
        validatedSourceJson(classType, object)

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
    } else if (Reflect.getMetadata(DecoderMetadataKeys.decodable, type)) {
        return (value: any, strict?: boolean) => {
            return JsonDecoder.decode<typeof type>(value, type)
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

/**
 * Validates a schema defined on a target against the source JSON.
 * If the JSON is not valid then a JsonDecoderValidatorError exception is thrown
 *
 * @param target - target class to take defined schema from
 * @param json - JSON object
 * @returns true if the schema was valid (JsonDecoderValidatorError exception thrown otherwise)
 */
function validatedSourceJson(target: DecoderPrototypalTarget, json: JsonObject): boolean {
    // If there is nothing to validate then it's valid
    if (!Reflect.hasMetadata(JsonDecoderMetadataKeys.schema, target)) {
        return true
    }

    // Fetch an existing validator
    let validator = Reflect.getMetadata(JsonDecoderMetadataKeys.schemaValidator, target) as ValidateFunction | undefined
    // Create a new validator if one has not already been created
    if (!validator) {
        validator = createSchemaValidator(target)
        if (validator) {
            Reflect.defineMetadata(JsonDecoderMetadataKeys.schemaValidator, validator, target)
        }
    }

    // No validator (should not happen)
    if (!validator) {
        return true
    }

    // Attempt validation and report errors
    const validatorResult = validator(json)
    if (typeof validatorResult === 'boolean') {
        if (!validatorResult) {
            // Collect the errors produced by the validator
            const errors = validator.errors
            const validationErrors: JsonValidationError[] = []
            if (errors) {
                errors.map((error: ErrorObject) => {
                    let ajvError: ErrorObject | undefined = error

                    // Check for explicit error messages
                    let templateErrorMessage: string
                    let propertyPath: string
                    let formatErrorMessage = false
                    if (error.keyword === 'errorMessage') {
                        const params: any = error.params

                        // tslint:disable-next-line:prefer-conditional-expression
                        if ('errors' in params && Array.isArray(params.errors) && params.errors.length > 0) {
                            ajvError = params.errors[0]
                            propertyPath = convertJsonPointerToKeyPath(ajvError!.dataPath)
                            templateErrorMessage = error.message!

                            // Should format the error messages
                            formatErrorMessage = true
                        } else {
                            ajvError = undefined
                            propertyPath = '???'
                            templateErrorMessage = error.message!
                        }
                    } else {
                        propertyPath = convertJsonPointerToKeyPath(error.dataPath)
                        templateErrorMessage = propertyPath
                            ? `'${propertyPath}' ${error.message}`
                            : templateErrorMessage = `Root object ${error.message}`
                    }

                    if (ajvError) {
                        // It's possible for the error parameter to be an array.
                        // To play it safe, ensure we have an array to iterate over
                        const errorParams: any[] = [].concat(ajvError.params as any)
                        errorParams.forEach(errorParam => {
                            if (!ajvError) {
                                return
                            }

                            if (ajvError.keyword === 'dependencies') {
                                // @ts-ignore
                                propertyPath = propertyPath ? `${propertyPath}.${errorParam.property}` : errorParam.property
                            }
                            // Hack to ensure there is always a property path variable
                            // @ts-ignore
                            errorParam.propertyPath = propertyPath

                            let errorMessage = String(templateErrorMessage)
                            if (formatErrorMessage) {
                                const templateRegEx = /({{([a-z0-9\-_]+)}})/gi
                                let match = templateRegEx.exec(errorMessage)
                                while (match) {
                                    const property = match[2]
                                    if (property in errorParam) {
                                        let value
                                        if (property === 'propertyPath') {
                                            // @ts-ignore
                                            if (!errorParam[property]) {
                                                value = 'root object'
                                            }
                                        }
                                        if (!value) {
                                            // @ts-ignore
                                            value = `'${errorParam[property]}'`
                                        }
                                        errorMessage = `${errorMessage.slice(0, match.index)}` +
                                        `${value}` +
                                        `${errorMessage.slice(templateRegEx.lastIndex)}`
                                    }

                                    match = templateRegEx.exec(errorMessage)
                                }
                            }

                            if (ajvError.keyword === 'required' || ajvError.keyword === 'dependencies') {
                                validationErrors.push(
                                    new JsonValidatorPropertyMissingError(
                                        propertyPath,
                                        (errorParam as RequiredParams).missingProperty,
                                        errorMessage))
                            }else if (ajvError.keyword === 'additionalProperties') {
                                validationErrors.push(
                                    new JsonValidatorPropertyUnsupportedError(
                                        propertyPath,
                                        // @ts-ignore
                                        (errorParam as AdditionalPropertiesParams).additionalProperty,
                                        errorMessage))
                            } else {
                                validationErrors.push(
                                    new JsonValidatorPropertyValueError(
                                        propertyPath,
                                        valueFromJsonPointer(ajvError!.dataPath, json),
                                        errorMessage))
                            }
                        })
                    }
                })
            }

            // Throw a single error with all the specific validation
            throw new JsonDecoderValidationError(validationErrors, json)
        }
    } else {
        throw TypeError('Async schema validation not supported')
    }

    return true
}

/**
 * Create a new schema validator for a target. If the target does not support JSON schema no validator function will be returned
 *
 * @param target - target class to take defined schema, and schema references from
 * @returns
 */
function createSchemaValidator(target: DecoderPrototypalTarget): ajv.ValidateFunction | undefined {
    const metadataSchema: JsonDecoderSchemaMetadata = Reflect.getMetadata(JsonDecoderMetadataKeys.schema, target)
    if (!metadataSchema) {
        return undefined
    }

    // Schema options
    const schemaCompiler = ajv({
        allErrors: true,
        async: false,
        verbose: true,
        format: 'full',
        jsonPointers: true, // Required for ajvErrors
    })
    ajvErrors(schemaCompiler)

    // Flatten all the references and ensure there is only one version of each
    const referenceSchemas = flattenSchemaReferences(target).reduce((result, reference) => {
        if (!result.has(reference.$id!)) {
            result.set(reference.$id!, reference)
        }

        return result
    }, new Map<string, JsonDecodableSchema>())

    // Add all references and compile
    for (const referenceSchema of referenceSchemas.values()) {
        schemaCompiler.addSchema(referenceSchema)
    }
    const validator = schemaCompiler.compile(metadataSchema.schema)

    return validator
}

/**
 * Flattens all schema references from the target down
 *
 * @param target - target class to take defined schema references from
 * @param [includeRootSchema=false] - Used for recursion
 * @returns Flattened schemas to add as reference definitions
 */
function flattenSchemaReferences(
    target: DecoderPrototypalTarget | JsonDecodableSchema,
    includeRootSchema: boolean = false): JsonDecodableSchema[]
{
    const schemas: JsonDecodableSchema[] = []

    const metadataSchema: JsonDecoderSchemaMetadata = Reflect.getMetadata(JsonDecoderMetadataKeys.schema, target)
    if (metadataSchema) {
        if (!('$schema' in metadataSchema.schema)) {
            throw new TypeError(`Missing '$schema' declaration in ${target.name || target.$id} schema`)
        }

        if (includeRootSchema) {
            const mutableSchema: JsonDecodableSchema = {...metadataSchema.schema}
            if (!mutableSchema.$id) {
                // Use the target name as the ID
                mutableSchema.$id = `#/${target.name}`
            }
            schemas.push(mutableSchema)
        }

        // Flatten reference schemas.
        // These could be class declarations with schemas attached or schemas themselves
        if (metadataSchema.references && Array.isArray(metadataSchema.references)) {
            metadataSchema.references.forEach(reference => {
                if (!!Reflect.getMetadata(JsonDecoderMetadataKeys.schema, reference)) {
                    schemas.push(...flattenSchemaReferences(reference, true))
                } else if ('$schema' in reference) {
                    schemas.push(reference as JsonDecodableSchema)
                } else {
                    throw new TypeError(`Missing '$schema' declaration in schema references for ${target.name}`)
                }
            })
        }

        // Enumeration the decoder map to automatically inject schema references
        const decoderMap = Reflect.getMetadata(DecoderMetadataKeys.decoderMap, target) as DecoderMap | undefined
        if (decoderMap) {
            for (const key of Reflect.ownKeys(decoderMap)) {
                const mapEnty = decoderMap[key]
                if (mapEnty && mapEnty.type && Reflect.hasMetadata(JsonDecoderMetadataKeys.schema, mapEnty.type)) {
                    schemas.push(...flattenSchemaReferences(mapEnty.type as DecoderPrototypalTarget, true))
                }
            }
        }
    }

    return schemas
}

/**
 * Extracts the value from a json object based on a JSON pointer path
 *
 * @param pointer - pointer path
 * @param json - source JSON object
 * @returns a value, or undefined if not available
 */
function valueFromJsonPointer(pointer: string, json: JsonObject): any {
    const keys = pointer.split('/').filter(part => !!part)

    let value = json
    while (keys.length > 0) {
        const key = keys.shift()!
        if (!(key in value)) {
            return undefined
        }

        value = value[key]
    }

    return value
}

/**
 * Converts a JSON pointer path to a key path that is more human friendly
 *
 * @param pointer - pointer path
 * @param otherKeys - other keys to append to the result key path
 * @returns JSON key path
 */
function convertJsonPointerToKeyPath(pointer: string, ...otherKeys: string[]): string {
    const parts = pointer.split('/').filter(part => !!part)
    if (otherKeys && otherKeys.length > 0) {
        parts.push(...otherKeys)
    }

    let dotPath = ''
    while (parts.length > 0) {
        const part = parts.shift()!
        if (/^[0-9]+$/.test(part)) {
            dotPath += `[${part}]`
        } else {
            if (dotPath.length > 0) {
                dotPath += '.'
            }
            dotPath += part
        }
    }

    return dotPath
}