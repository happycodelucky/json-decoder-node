"use strict";
/**
 * JSON specific decoder and decorators
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonDecoder = void 0;
require("reflect-metadata");
const ajv_1 = require("ajv");
const _2019_1 = require("ajv/dist/2019");
const _2020_1 = require("ajv/dist/2020");
// import * as ajv from 'ajv'
// @ts-ignore
const ajv_errors_1 = require("ajv-errors");
const decoder_declarations_1 = require("../decoder/decoder-declarations");
const decoder_declarations_2 = require("../decoder/decoder-declarations");
const decoder_map_1 = require("../decoder/decoder-map");
const marshallers_1 = require("../marshallers/marshallers");
const json_decoder_errors_1 = require("./json-decoder-errors");
const json_symbols_1 = require("./json-symbols");
const json_validation_errors_1 = require("./json-validation-errors");
const json_validation_errors_2 = require("./json-validation-errors");
const SCHEMA_DRAFT_2019 = 'https://json-schema.org/draft/2019-09/schema';
const SCHEMA_DRAFT_2020 = 'https://json-schema.org/draft/2020-12/schema';
/**
 * JSON decoder for JSON decodable classes
 */
// tslint:disable:no-unnecessary-class
class JsonDecoder {
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - array or string (contain JSON object) to decode
     * @param classType - decodable type to decode JSON into
     * @return a decoded object of `classType`
     */
    static decode(objectOrString, classType) {
        if (objectOrString === null || objectOrString === undefined) {
            return null;
        }
        // Extract our JSON object
        let object;
        if (typeof objectOrString === 'string') {
            // Will throw an exception if the JSON has a syntax error
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
            const options = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodableOptions, classType);
            if (options && (options.useConstructor ?? false)) {
                const constructable = classType;
                decodeObject = new constructable();
            }
            else {
                // Instantiate the object, without calling the constructor
                decodeObject = Object.create(classType.prototype);
            }
        }
        // Validate the JSON
        // This will throw an exception if not valid
        validatedSourceJson(classType, object);
        // Check if a context needs to be set
        const contextKey = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.context, classType);
        if (contextKey !== undefined && contextKey.length > 0) {
            Reflect.defineProperty(decodeObject, contextKey, {
                value: object,
                enumerable: false,
                writable: false,
            });
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
            const decoderMap = (0, decoder_map_1.decoderMapForTarget)(constructor);
            for (const key of Reflect.ownKeys(decoderMap)) {
                const mapEntry = Reflect.get(decoderMap, key);
                const value = evaluatePropertyValue(object, mapEntry, decodeObject);
                if (value !== undefined) {
                    Reflect.set(decodeObject, key, value);
                }
            }
        }
        // Iterate through the class heirarchy for prototype decoders, this time calling all the property notifiers
        // This is done after all mapped properties have been assigned
        for (const constructor of classConstructors) {
            const propertyNotifiers = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderNotifiers, constructor);
            if (propertyNotifiers) {
                for (const handlers of propertyNotifiers.values()) {
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
                try {
                    const completeObject = decoderComplete.call(decodeObject, object);
                    // Check for invalidation
                    if (completeObject === null || completeObject === false) {
                        return null;
                    }
                    // Check for swapped decode object
                    if (completeObject && completeObject !== decodeObject) {
                        decodeObject = completeObject;
                    }
                }
                catch (err) {
                    if (err instanceof json_validation_errors_1.JsonValidationError) {
                        const validationError = new json_decoder_errors_1.JsonDecoderValidationError([err], object, 'JSON validation failed post decode');
                        throw validationError;
                    }
                    throw err;
                }
            }
        }
        return decodeObject;
    }
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - array or string (contain JSON array) to decode
     * @param classType - decodable type to decode JSON into
     * @return an array of decoded objects of `classType`
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
    /**
     * Decodes a JSON object or String returning back a map with key as the
     * json key and value decoded to the decodable type passed in the input
     * @param objectOrString - array or string (contain JSON array) to decode
     * @param classTypeOfValue - decodable type of json values to decode JSON into
     * @return a Map with the value containing decoded objects of `classType`
     */
    static decodeMap(objectOrString, classTypeOfValue) {
        if (objectOrString === null || objectOrString === undefined) {
            return null;
        }
        const inputObject = (typeof (objectOrString) === 'string')
            ? JSON.parse(objectOrString)
            : objectOrString;
        const decodedMap = new Map();
        for (const key of Reflect.ownKeys(inputObject)) {
            const decodedValue = this.decode(inputObject[key.toString()], classTypeOfValue);
            if (decodedValue) {
                decodedMap.set(key.toString(), decodedValue);
            }
        }
        return decodedMap;
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
    if ((0, decoder_declarations_2.isDecoderPrototypalCollectionTarget)(type)) {
        let collectionMarshaller;
        if (Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, type.collection)) {
            collectionMarshaller = (value, itemMarhsaller, strict) => {
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
            collectionMarshaller = (0, marshallers_1.collectionMarshallerForType)(type.collection);
        }
        if (!collectionMarshaller) {
            return undefined;
        }
        let elementMarshaller = createMarshaller(type.element);
        // If the element type is decodable
        if (!elementMarshaller && Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, type.element)) {
            elementMarshaller = (value, strict) => {
                return JsonDecoder.decode(value, type.element);
            };
        }
        return (value, strict) => {
            return collectionMarshaller(value, elementMarshaller, strict);
        };
    }
    else if (Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, type)) {
        return (value, strict) => {
            return JsonDecoder.decode(value, type);
        };
    }
    return (0, marshallers_1.marshallerForType)(type);
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
        const marshaller = createMarshaller(decoderMapEntry.type);
        if (marshaller) {
            value = marshaller(value, strict);
        }
        else {
            if (strict) {
                const rootType = (0, decoder_declarations_2.isDecoderPrototypalCollectionTarget)(decoderMapEntry.type) ? decoderMapEntry.type.collection : decoderMapEntry.type;
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
/**
 * Validates a schema defined on a target against the source JSON.
 * If the JSON is not valid then a JsonDecoderValidatorError exception is thrown
 *
 * @param target - target class to take defined schema from
 * @param json - JSON object
 * @returns true if the schema was valid (JsonDecoderValidatorError exception thrown otherwise)
 */
function validatedSourceJson(target, json) {
    // If there is nothing to validate then it's valid
    if (!Reflect.hasMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target)) {
        return true;
    }
    // Fetch an existing validator
    let validator = Reflect.getOwnMetadata(json_symbols_1.JsonDecoderMetadataKeys.schemaValidator, target);
    // Create a new validator if one has not already been created
    if (!validator) {
        validator = createSchemaValidator(target);
        if (validator) {
            Reflect.defineMetadata(json_symbols_1.JsonDecoderMetadataKeys.schemaValidator, validator, target);
        }
    }
    // No validator (should not happen)
    if (!validator) {
        return true;
    }
    // Attempt validation and report errors
    const validatorResult = validator(json);
    if (typeof validatorResult === 'boolean') {
        if (!validatorResult) {
            // Collect the errors produced by the validator
            const errors = validator.errors;
            const validationErrors = [];
            if (errors) {
                errors.map((error) => {
                    let ajvError = error;
                    // Check for explicit error messages
                    let templateErrorMessage;
                    let propertyPath;
                    let formatErrorMessage = false;
                    if (error.keyword === 'errorMessage') {
                        const params = error.params;
                        // tslint:disable-next-line:prefer-conditional-expression
                        if ('errors' in params && Array.isArray(params.errors) && params.errors.length > 0) {
                            ajvError = params.errors[0];
                            propertyPath = convertJsonPointerToKeyPath(ajvError.instancePath);
                            templateErrorMessage = error.message;
                            // Should format the error messages
                            formatErrorMessage = true;
                        }
                        else {
                            ajvError = undefined;
                            propertyPath = '???';
                            templateErrorMessage = error.message;
                        }
                    }
                    else {
                        propertyPath = convertJsonPointerToKeyPath(error.instancePath);
                        templateErrorMessage = propertyPath
                            ? `'${propertyPath}' ${error.message}`
                            : templateErrorMessage = `Object ${error.message}`;
                    }
                    if (ajvError) {
                        // It's possible for the error parameter to be an array.
                        // To play it safe, ensure we have an array to iterate over
                        const errorParams = [].concat(ajvError.params);
                        errorParams.forEach(errorParam => {
                            if (!ajvError) {
                                return;
                            }
                            if (ajvError.keyword === 'dependencies') {
                                // @ts-ignore
                                propertyPath = propertyPath ? `${propertyPath}.${errorParam.property}` : errorParam.property;
                            }
                            // Hack to ensure there is always a property path variable
                            // @ts-ignore
                            errorParam.propertyPath = propertyPath;
                            let errorMessage = String(templateErrorMessage);
                            if (formatErrorMessage) {
                                const templateRegEx = /({{([a-z0-9\-_]+)}})/gi;
                                let match = templateRegEx.exec(errorMessage);
                                while (match) {
                                    const property = match[2];
                                    if (property in errorParam) {
                                        let value;
                                        if (property === 'propertyPath') {
                                            // @ts-ignore
                                            if (!errorParam[property]) {
                                                value = 'object';
                                            }
                                        }
                                        if (!value) {
                                            // @ts-ignore
                                            value = `'${errorParam[property]}'`;
                                        }
                                        errorMessage = `${errorMessage.slice(0, match.index)}` +
                                            `${value}` +
                                            `${errorMessage.slice(templateRegEx.lastIndex)}`;
                                    }
                                    match = templateRegEx.exec(errorMessage);
                                }
                            }
                            if (ajvError.keyword === 'required' || ajvError.keyword === 'dependencies') {
                                validationErrors.push(new json_validation_errors_2.JsonValidatorPropertyMissingError(propertyPath, errorParam.missingProperty, errorMessage));
                            }
                            else if (ajvError.keyword === 'additionalProperties') {
                                validationErrors.push(new json_validation_errors_2.JsonValidatorPropertyUnsupportedError(propertyPath, errorParam.additionalProperty, errorMessage));
                            }
                            else {
                                validationErrors.push(new json_validation_errors_1.JsonValidatorPropertyValueError(propertyPath, valueFromJsonPointer(ajvError.instancePath, json), errorMessage));
                            }
                        });
                    }
                });
            }
            // Throw a single error with all the specific validation
            throw new json_decoder_errors_1.JsonDecoderValidationError(validationErrors, json);
        }
    }
    else {
        throw TypeError('Async schema validation not supported');
    }
    return true;
}
/**
 * Create a new schema validator for a target. If the target does not support JSON schema no validator function will be returned
 *
 * @param target - target class to take defined schema, and schema references from
 * @returns validator function to validate schemas with, or undefined if there is no validation needed
 */
function createSchemaValidator(target) {
    const metadataSchema = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target);
    if (!metadataSchema) {
        return undefined;
    }
    const schemaVersion = metadataSchema.schema.$schema;
    const schemaCompiler = schemaVersion.startsWith(SCHEMA_DRAFT_2019)
        ? new _2019_1.default()
        : schemaVersion.startsWith(SCHEMA_DRAFT_2020)
            ? new _2020_1.default()
            : new ajv_1.default();
    // AJV Options
    schemaCompiler.opts = {
        ...schemaCompiler.opts,
        allErrors: true,
        verbose: true,
        validateFormats: true,
    };
    (0, ajv_errors_1.default)(schemaCompiler);
    // Flatten all the references and ensure there is only one version of each
    const referenceSchemas = flattenSchemaReferences(target).reduce((result, reference) => {
        if (!result.has(reference.$id)) {
            result.set(reference.$id, reference);
        }
        return result;
    }, new Map());
    // Add all references and compile
    for (const referenceSchema of referenceSchemas.values()) {
        schemaCompiler.addSchema(referenceSchema);
    }
    const validator = schemaCompiler.compile(metadataSchema.schema);
    return validator;
}
/**
 * Flattens all schema references from the target down
 *
 * @param target - target class to take defined schema references from
 * @param [includeRootSchema=false] - Used for recursion
 * @returns Flattened schemas to add as reference definitions
 */
function flattenSchemaReferences(target, includeRootSchema = false) {
    const schemas = [];
    const metadataSchema = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target);
    if (metadataSchema) {
        if (!('$schema' in metadataSchema.schema)) {
            throw new TypeError(`Missing '$schema' declaration in ${target.name || target.$id} schema`);
        }
        if (includeRootSchema) {
            const mutableSchema = { ...metadataSchema.schema };
            if (!mutableSchema.$id) {
                // Use the target name as the ID
                mutableSchema.$id = `#/${target.name}`;
            }
            schemas.push(mutableSchema);
        }
        // Flatten reference schemas.
        // These could be class declarations with schemas attached or schemas themselves
        if (metadataSchema.references && Array.isArray(metadataSchema.references)) {
            metadataSchema.references.forEach(reference => {
                if (!!Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, reference)) {
                    schemas.push(...flattenSchemaReferences(reference, true));
                }
                else if ('$schema' in reference) {
                    schemas.push(reference);
                }
                else {
                    throw new TypeError(`Missing '$schema' declaration in schema references for ${target.name}`);
                }
            });
        }
        // Enumeration the decoder map to automatically inject schema references
        const decoderMap = Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target);
        if (decoderMap) {
            for (const key of Reflect.ownKeys(decoderMap)) {
                const mapEnty = Reflect.get(decoderMap, key);
                if (mapEnty && mapEnty.type && Reflect.hasMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, mapEnty.type)) {
                    schemas.push(...flattenSchemaReferences(mapEnty.type, true));
                }
            }
        }
    }
    return schemas;
}
/**
 * Extracts the value from a json object based on a JSON pointer path
 *
 * @param pointer - pointer path
 * @param json - source JSON object
 * @returns a value, or undefined if not available
 */
function valueFromJsonPointer(pointer, json) {
    const keys = pointer.split('/').filter(part => !!part);
    let value = json;
    while (keys.length > 0) {
        const key = keys.shift();
        if (!(key in value)) {
            return undefined;
        }
        value = value[key];
    }
    return value;
}
/**
 * Converts a JSON pointer path to a key path that is more human friendly
 *
 * @param pointer - pointer path
 * @param otherKeys - other keys to append to the result key path
 * @returns JSON key path
 */
function convertJsonPointerToKeyPath(pointer, ...otherKeys) {
    const parts = pointer.split('/').filter(part => !!part);
    if (otherKeys && otherKeys.length > 0) {
        parts.push(...otherKeys);
    }
    let dotPath = '';
    while (parts.length > 0) {
        const part = parts.shift();
        if (/^[0-9]+$/.test(part)) {
            dotPath += `[${part}]`;
        }
        else {
            if (dotPath.length > 0) {
                dotPath += '.';
            }
            dotPath += part;
        }
    }
    return dotPath;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7R0FFRzs7O0FBRUgsNEJBQXlCO0FBQ3pCLDZCQUE0QjtBQUM1Qix5Q0FBbUM7QUFDbkMseUNBQW1DO0FBRW5DLDZCQUE2QjtBQUM3QixhQUFhO0FBQ2IsMkNBQWtDO0FBSWxDLDBFQUE4RjtBQUM5RiwwRUFBd0g7QUFDeEgsd0RBQXlGO0FBR3pGLDREQUEyRjtBQUczRiwrREFBa0U7QUFFbEUsaURBQXdEO0FBQ3hELHFFQUErRjtBQUMvRixxRUFBbUg7QUFFbkgsTUFBTSxpQkFBaUIsR0FBRyw4Q0FBOEMsQ0FBQTtBQUN4RSxNQUFNLGlCQUFpQixHQUFFLDhDQUE4QyxDQUFBO0FBRXZFOztHQUVHO0FBQ0gsc0NBQXNDO0FBQ3RDLE1BQWEsV0FBVztJQUNwQjs7Ozs7T0FLRztJQUNILE1BQU0sQ0FBQyxNQUFNLENBQW1CLGNBQW1DLEVBQUUsU0FBa0M7UUFDbkcsSUFBSSxjQUFjLEtBQUssSUFBSSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUVELDBCQUEwQjtRQUMxQixJQUFJLE1BQWMsQ0FBQTtRQUNsQixJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUNwQyx5REFBeUQ7WUFDekQsTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFlLENBQUE7U0FDcEQ7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBQzVFLDJEQUEyRDtZQUMzRCxNQUFNLEdBQUcsY0FBYyxDQUFBO1NBQzFCO2FBQU07WUFDSCxNQUFNLElBQUksU0FBUyxDQUFDLGdEQUFnRCxDQUFDLENBQUE7U0FDeEU7UUFFRCxJQUFJLFlBQWtDLENBQUE7UUFFdEMsb0VBQW9FO1FBQ3BFLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsMENBQW1CLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBeUIsQ0FBQTtRQUNoSCxJQUFJLGFBQWEsRUFBRTtZQUNmLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQU0sQ0FBQTtZQUV6RCx5QkFBeUI7WUFDekIsSUFBSSxZQUFZLEtBQUssSUFBSSxFQUFFO2dCQUN2QixPQUFPLElBQUksQ0FBQTthQUNkO1lBRUQseURBQXlEO1lBQ3pELElBQUksWUFBWSxLQUFLLFNBQVMsRUFBRTtnQkFDNUIsU0FBUyxHQUFHLFlBQVksQ0FBQyxXQUFXLENBQUE7YUFDdkM7U0FDSjtRQUVELElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDZixNQUFNLE9BQU8sR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLGdCQUFnQixFQUFFLFNBQVMsQ0FBcUMsQ0FBQTtZQUMzSCxJQUFJLE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjLElBQUksS0FBSyxDQUFDLEVBQUU7Z0JBQzlDLE1BQU0sYUFBYSxHQUFHLFNBQThCLENBQUE7Z0JBQ3BELFlBQVksR0FBRyxJQUFJLGFBQWEsRUFBTyxDQUFBO2FBQzFDO2lCQUFNO2dCQUNILDBEQUEwRDtnQkFDMUQsWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBTSxDQUFBO2FBQ3pEO1NBQ0o7UUFFRCxvQkFBb0I7UUFDcEIsNENBQTRDO1FBQzVDLG1CQUFtQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUV0QyxxQ0FBcUM7UUFDckMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUF1QixDQUFBO1FBQ3hHLElBQUksVUFBVSxLQUFLLFNBQVMsSUFBSSxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtZQUNuRCxPQUFPLENBQUMsY0FBYyxDQUFDLFlBQVksRUFBRSxVQUFVLEVBQUU7Z0JBQzdDLEtBQUssRUFBRSxNQUFNO2dCQUNiLFVBQVUsRUFBRSxLQUFLO2dCQUNqQixRQUFRLEVBQUUsS0FBSzthQUNsQixDQUFDLENBQUE7U0FDTDtRQUVELDhFQUE4RTtRQUM5RSxNQUFNLGlCQUFpQixHQUE4QixFQUFFLENBQUE7UUFDdkQsSUFBSSxTQUFTLEdBQUcsU0FBUyxDQUFDLFNBQVMsQ0FBQTtRQUNuQyxPQUFPLFNBQVMsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFO1lBQ25DLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsU0FBUyxFQUFFLFNBQVMsQ0FBQyxXQUFXLENBQUMsRUFBRTtnQkFDaEYsaUJBQWlCLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQUMsQ0FBQTthQUNuRDtZQUNELFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBRSxDQUFBO1NBQ2pEO1FBRUQsc0NBQXNDO1FBQ3RDLEtBQUssTUFBTSxXQUFXLElBQUksaUJBQWlCLEVBQUU7WUFDekMsMkVBQTJFO1lBQzNFLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxTQUFTLENBQWEsQ0FBQTtZQUN0RyxJQUFJLE9BQU8sRUFBRTtnQkFDVCxNQUFNLHVCQUF1QixHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFBO2dCQUNsRSx5QkFBeUI7Z0JBQ3pCLElBQUksdUJBQXVCLEtBQUssSUFBSSxFQUFFO29CQUNsQyxPQUFPLElBQUksQ0FBQTtpQkFDZDthQUNKO1lBRUQsbURBQW1EO1lBQ25ELE1BQU0sVUFBVSxHQUFHLElBQUEsaUNBQW1CLEVBQUMsV0FBVyxDQUFDLENBQUE7WUFDbkQsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQW9CLENBQUE7Z0JBQ2hFLE1BQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQ25FLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtvQkFDckIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxZQUFZLEVBQUUsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFBO2lCQUN4QzthQUNKO1NBQ0o7UUFFRCwyR0FBMkc7UUFDM0csOERBQThEO1FBQzlELEtBQUssTUFBTSxXQUFXLElBQUksaUJBQWlCLEVBQUU7WUFDekMsTUFBTSxpQkFBaUIsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUM1QywwQ0FBbUIsQ0FBQyxnQkFBZ0IsRUFDcEMsV0FBVyxDQUNnQyxDQUFBO1lBRS9DLElBQUksaUJBQWlCLEVBQUU7Z0JBQ25CLEtBQUssTUFBTSxRQUFRLElBQUksaUJBQWlCLENBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQy9DLEtBQUssTUFBTSxPQUFPLElBQUksUUFBUSxFQUFFO3dCQUM1QixNQUFNLEtBQUssR0FBRyxxQkFBcUIsQ0FDL0IsTUFBTSxFQUNOOzRCQUNJLEdBQUcsRUFBRSxPQUFPLENBQUMsR0FBRzs0QkFDaEIsSUFBSSxFQUFFLE9BQU8sQ0FBQyxJQUFJO3lCQUNyQixFQUNELFlBQVksQ0FDZixDQUFBO3dCQUNELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTs0QkFDckIscUNBQXFDOzRCQUNyQyxPQUFPLENBQUMsV0FBWSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsS0FBSyxFQUFFLE1BQU0sQ0FBQyxDQUFBO3lCQUN6RDtxQkFDSjtpQkFDSjthQUNKO1NBQ0o7UUFFRCxvR0FBb0c7UUFDcEcsMkNBQTJDO1FBQzNDLEtBQUssTUFBTSxXQUFXLElBQUksaUJBQWlCLEVBQUU7WUFDekMsOENBQThDO1lBQzlDLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsZ0JBQWdCLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQzNHLElBQUksZUFBZSxFQUFFO2dCQUNqQixJQUFJO29CQUNBLE1BQU0sY0FBYyxHQUFRLGVBQWUsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFBO29CQUN0RSx5QkFBeUI7b0JBQ3pCLElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssS0FBSyxFQUFFO3dCQUNyRCxPQUFPLElBQUksQ0FBQTtxQkFDZDtvQkFDRCxrQ0FBa0M7b0JBQ2xDLElBQUksY0FBYyxJQUFJLGNBQWMsS0FBSyxZQUFZLEVBQUU7d0JBQ25ELFlBQVksR0FBRyxjQUFjLENBQUE7cUJBQ2hDO2lCQUNKO2dCQUFDLE9BQU8sR0FBRyxFQUFFO29CQUNWLElBQUksR0FBRyxZQUFZLDRDQUFtQixFQUFFO3dCQUNwQyxNQUFNLGVBQWUsR0FBRyxJQUFJLGdEQUEwQixDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsTUFBTSxFQUFFLG9DQUFvQyxDQUFDLENBQUE7d0JBQzNHLE1BQU0sZUFBZSxDQUFBO3FCQUN4QjtvQkFFRCxNQUFNLEdBQUcsQ0FBQTtpQkFDWjthQUNKO1NBQ0o7UUFFRCxPQUFPLFlBQWEsQ0FBQTtJQUN4QixDQUFDO0lBRUQ7Ozs7O09BS0c7SUFDSCxNQUFNLENBQUMsV0FBVyxDQUNkLGNBQXFDLEVBQ3JDLFNBQWtDO1FBRWxDLElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFBO1NBQ2Q7UUFFRCxJQUFJLE9BQWlCLENBQUE7UUFDckIsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUU7WUFDcEMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUE7U0FDdkM7YUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEVBQUU7WUFDdEMsT0FBTyxHQUFHLGNBQWMsQ0FBQTtTQUMzQjthQUFNO1lBQ0gsTUFBTSxJQUFJLFNBQVMsQ0FBQywwREFBMEQsQ0FBQyxDQUFBO1NBQ2xGO1FBRUQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFXLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFJLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBUSxDQUFBO0lBQ25ILENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxNQUFNLENBQUMsU0FBUyxDQUNaLGNBQW1DLEVBQ25DLGdCQUF5QztRQUV6QyxJQUFJLGNBQWMsS0FBSyxJQUFJLElBQUksY0FBYyxLQUFLLFNBQVMsRUFBRTtZQUN6RCxPQUFPLElBQUksQ0FBQTtTQUNkO1FBRUQsTUFBTSxXQUFXLEdBQWUsQ0FBQyxPQUFNLENBQUMsY0FBYyxDQUFDLEtBQUssUUFBUSxDQUFDO1lBQ2pFLENBQUMsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQztZQUM1QixDQUFDLENBQUMsY0FBYyxDQUFBO1FBRXBCLE1BQU0sVUFBVSxHQUFvQixJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQzdDLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRTtZQUM1QyxNQUFNLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFJLFdBQVcsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUMsRUFBRSxnQkFBZ0IsQ0FBQyxDQUFBO1lBQ2xGLElBQUksWUFBWSxFQUFFO2dCQUNkLFVBQVUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLFFBQVEsRUFBRSxFQUFFLFlBQVksQ0FBQyxDQUFBO2FBQy9DO1NBQ0o7UUFFRCxPQUFPLFVBQVUsQ0FBQTtJQUNyQixDQUFDO0NBQ0o7QUFyTkQsa0NBcU5DO0FBSUQsRUFBRTtBQUNGLG9CQUFvQjtBQUNwQixFQUFFO0FBRUY7Ozs7O0dBS0c7QUFDSCxTQUFTLGdCQUFnQixDQUFDLElBQWlFO0lBR3ZGLElBQUksSUFBQSwwREFBbUMsRUFBQyxJQUFJLENBQUMsRUFBRTtRQUMzQyxJQUFJLG9CQUE4RCxDQUFBO1FBQ2xFLElBQUksT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3hFLG9CQUFvQixHQUFHLENBQUMsS0FBVSxFQUFFLGNBQW1DLEVBQUUsTUFBZ0IsRUFBRSxFQUFFO2dCQUN6RixJQUFJLE9BQU8sS0FBSyxLQUFLLFNBQVM7dUJBQ3ZCLE9BQU8sS0FBSyxLQUFLLFFBQVE7dUJBQ3pCLE9BQU8sS0FBSyxLQUFLLFFBQVE7dUJBQ3pCLENBQUMsT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLEtBQUssS0FBSyxJQUFJLENBQUMsRUFBRTtvQkFDbEQsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUE7aUJBQ3BEO2dCQUNELElBQUksTUFBTSxFQUFFO29CQUNSLE1BQU0sSUFBSSxTQUFTLENBQUMsR0FBRyxPQUFPLEtBQUssMkJBQTJCLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtpQkFDeEY7Z0JBRUQsT0FBTyxTQUFTLENBQUE7WUFDcEIsQ0FBQyxDQUFBO1NBQ0o7YUFBTTtZQUNILG9CQUFvQixHQUFHLElBQUEseUNBQTJCLEVBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQ3RFO1FBRUQsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQ3ZCLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBRUQsSUFBSSxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFFdEQsbUNBQW1DO1FBQ25DLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLDBDQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUU7WUFDeEYsaUJBQWlCLEdBQUcsQ0FBQyxLQUFVLEVBQUUsTUFBZ0IsRUFBRSxFQUFFO2dCQUNqRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQWMsS0FBSyxFQUFFLElBQUksQ0FBQyxPQUFrQyxDQUFDLENBQUE7WUFDMUYsQ0FBQyxDQUFBO1NBQ0o7UUFFRCxPQUFPLENBQUMsS0FBVSxFQUFFLE1BQWdCLEVBQUUsRUFBRTtZQUNwQyxPQUFPLG9CQUFxQixDQUFDLEtBQUssRUFBRSxpQkFBaUIsRUFBRSxNQUFNLENBQUMsQ0FBQTtRQUNsRSxDQUFDLENBQUE7S0FDSjtTQUFNLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQywwQ0FBbUIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLEVBQUU7UUFDakUsT0FBTyxDQUFDLEtBQVUsRUFBRSxNQUFnQixFQUFFLEVBQUU7WUFDcEMsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFjLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQTtRQUN2RCxDQUFDLENBQUE7S0FDSjtJQUVELE9BQU8sSUFBQSwrQkFBaUIsRUFBQyxJQUFJLENBQUMsQ0FBQTtBQUNsQyxDQUFDO0FBRUQ7Ozs7Ozs7Ozs7R0FVRztBQUNILFNBQVMscUJBQXFCLENBQzFCLE1BQWMsRUFDZCxRQUF5QixFQUN6QixZQUFvQixFQUNwQixTQUFrQixLQUFLO0lBRXZCLElBQUksQ0FBQyxNQUFNLEVBQUU7UUFDVCxPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUNELElBQUksQ0FBQyxRQUFRLEVBQUU7UUFDWCxPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELDJDQUEyQztJQUMzQyxJQUFJLGVBQWdDLENBQUE7SUFDcEMsSUFBSSxPQUFPLFFBQVEsS0FBSyxRQUFRLEVBQUU7UUFDOUIsZUFBZSxHQUFHO1lBQ2QsR0FBRyxFQUFFLFFBQVE7U0FDaEIsQ0FBQTtLQUNKO1NBQU07UUFDSCxlQUFlLEdBQUcsUUFBUSxDQUFBO0tBQzdCO0lBRUQsbURBQW1EO0lBQ25ELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2xELElBQUksS0FBSyxHQUFRLE1BQU0sQ0FBQTtJQUN2QixHQUFHO1FBQ0MsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQzlCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxTQUFRO1NBQ1g7UUFFRCxzRUFBc0U7UUFDdEUsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksT0FBTyxLQUFLLEtBQUssUUFBUSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRTtZQUNqRixxQkFBcUI7WUFDckIsT0FBTyxTQUFTLENBQUE7U0FDbkI7UUFDRCxLQUFLLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUE7S0FDbkMsUUFBUSxRQUFRLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxLQUFLLEtBQUssSUFBSSxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUM7SUFFdEUsbUVBQW1FO0lBQ25FLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUNyQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELDRCQUE0QjtJQUM1QixJQUFJLGVBQWUsQ0FBQyxJQUFJLEVBQUU7UUFDdEIsTUFBTSxVQUFVLEdBQUcsZ0JBQWdCLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFBO1FBQ3pELElBQUksVUFBVSxFQUFFO1lBQ1osS0FBSyxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDcEM7YUFBTTtZQUNILElBQUksTUFBTSxFQUFFO2dCQUNSLE1BQU0sUUFBUSxHQUNWLElBQUEsMERBQW1DLEVBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQTtnQkFDdEgsTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLCtCQUErQixDQUFDLENBQUE7YUFDdkU7WUFFRCxPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELDZDQUE2QztRQUM3QyxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7WUFDckIsT0FBTyxTQUFTLENBQUE7U0FDbkI7UUFFRCxJQUFJLGVBQWUsQ0FBQyxXQUFXLEVBQUU7WUFDN0IsS0FBSyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDeEU7S0FDSjtJQUVELE9BQU8sS0FBSyxDQUFBO0FBQ2hCLENBQUM7QUFFRDs7Ozs7OztHQU9HO0FBQ0gsU0FBUyxtQkFBbUIsQ0FBQyxNQUErQixFQUFFLElBQWdCO0lBQzFFLGtEQUFrRDtJQUNsRCxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLEVBQUU7UUFDOUQsT0FBTyxJQUFJLENBQUE7S0FDZDtJQUVELDhCQUE4QjtJQUM5QixJQUFJLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLHNDQUF1QixDQUFDLGVBQWUsRUFBRSxNQUFNLENBQWlDLENBQUE7SUFDdkgsNkRBQTZEO0lBQzdELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDWixTQUFTLEdBQUcscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDekMsSUFBSSxTQUFTLEVBQUU7WUFDWCxPQUFPLENBQUMsY0FBYyxDQUFDLHNDQUF1QixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDckY7S0FDSjtJQUVELG1DQUFtQztJQUNuQyxJQUFJLENBQUMsU0FBUyxFQUFFO1FBQ1osT0FBTyxJQUFJLENBQUE7S0FDZDtJQUVELHVDQUF1QztJQUN2QyxNQUFNLGVBQWUsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUE7SUFDdkMsSUFBSSxPQUFPLGVBQWUsS0FBSyxTQUFTLEVBQUU7UUFDdEMsSUFBSSxDQUFDLGVBQWUsRUFBRTtZQUNsQiwrQ0FBK0M7WUFDL0MsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtZQUMvQixNQUFNLGdCQUFnQixHQUEwQixFQUFFLENBQUE7WUFDbEQsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQWtCLEVBQUUsRUFBRTtvQkFDOUIsSUFBSSxRQUFRLEdBQTRCLEtBQUssQ0FBQTtvQkFFN0Msb0NBQW9DO29CQUNwQyxJQUFJLG9CQUE0QixDQUFBO29CQUNoQyxJQUFJLFlBQW9CLENBQUE7b0JBQ3hCLElBQUksa0JBQWtCLEdBQUcsS0FBSyxDQUFBO29CQUM5QixJQUFJLEtBQUssQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFO3dCQUNsQyxNQUFNLE1BQU0sR0FBUSxLQUFLLENBQUMsTUFBTSxDQUFBO3dCQUVoQyx5REFBeUQ7d0JBQ3pELElBQUksUUFBUSxJQUFJLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxNQUFNLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7NEJBQ2hGLFFBQVEsR0FBRyxNQUFNLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFBOzRCQUMzQixZQUFZLEdBQUcsMkJBQTJCLENBQUMsUUFBUyxDQUFDLFlBQVksQ0FBQyxDQUFBOzRCQUNsRSxvQkFBb0IsR0FBRyxLQUFLLENBQUMsT0FBUSxDQUFBOzRCQUVyQyxtQ0FBbUM7NEJBQ25DLGtCQUFrQixHQUFHLElBQUksQ0FBQTt5QkFDNUI7NkJBQU07NEJBQ0gsUUFBUSxHQUFHLFNBQVMsQ0FBQTs0QkFDcEIsWUFBWSxHQUFHLEtBQUssQ0FBQTs0QkFDcEIsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLE9BQVEsQ0FBQTt5QkFDeEM7cUJBQ0o7eUJBQU07d0JBQ0gsWUFBWSxHQUFHLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQTt3QkFDOUQsb0JBQW9CLEdBQUcsWUFBWTs0QkFDL0IsQ0FBQyxDQUFDLElBQUksWUFBWSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7NEJBQ3RDLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtxQkFDekQ7b0JBRUQsSUFBSSxRQUFRLEVBQUU7d0JBQ1Ysd0RBQXdEO3dCQUN4RCwyREFBMkQ7d0JBQzNELE1BQU0sV0FBVyxHQUFVLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQWEsQ0FBQyxDQUFBO3dCQUM1RCxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFOzRCQUM3QixJQUFJLENBQUMsUUFBUSxFQUFFO2dDQUNYLE9BQU07NkJBQ1Q7NEJBRUQsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLGNBQWMsRUFBRTtnQ0FDckMsYUFBYTtnQ0FDYixZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUE7NkJBQy9GOzRCQUNELDBEQUEwRDs0QkFDMUQsYUFBYTs0QkFDYixVQUFVLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQTs0QkFFdEMsSUFBSSxZQUFZLEdBQUcsTUFBTSxDQUFDLG9CQUFvQixDQUFDLENBQUE7NEJBQy9DLElBQUksa0JBQWtCLEVBQUU7Z0NBQ3BCLE1BQU0sYUFBYSxHQUFHLHdCQUF3QixDQUFBO2dDQUM5QyxJQUFJLEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO2dDQUM1QyxPQUFPLEtBQUssRUFBRTtvQ0FDVixNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUE7b0NBQ3pCLElBQUksUUFBUSxJQUFJLFVBQVUsRUFBRTt3Q0FDeEIsSUFBSSxLQUFLLENBQUE7d0NBQ1QsSUFBSSxRQUFRLEtBQUssY0FBYyxFQUFFOzRDQUM3QixhQUFhOzRDQUNiLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0RBQ3ZCLEtBQUssR0FBRyxRQUFRLENBQUE7NkNBQ25CO3lDQUNKO3dDQUNELElBQUksQ0FBQyxLQUFLLEVBQUU7NENBQ1IsYUFBYTs0Q0FDYixLQUFLLEdBQUcsSUFBSSxVQUFVLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQTt5Q0FDdEM7d0NBQ0QsWUFBWSxHQUFHLEdBQUcsWUFBWSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFOzRDQUN0RCxHQUFHLEtBQUssRUFBRTs0Q0FDVixHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUE7cUNBQ25EO29DQUVELEtBQUssR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFBO2lDQUMzQzs2QkFDSjs0QkFFRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssVUFBVSxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFO2dDQUN4RSxnQkFBZ0IsQ0FBQyxJQUFJLENBQ2pCLElBQUksMERBQWlDLENBQ2pDLFlBQVksRUFDWixVQUFVLENBQUMsZUFBZSxFQUMxQixZQUFZLENBQUMsQ0FBQyxDQUFBOzZCQUN6QjtpQ0FBSyxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssc0JBQXNCLEVBQUU7Z0NBQ25ELGdCQUFnQixDQUFDLElBQUksQ0FDakIsSUFBSSw4REFBcUMsQ0FDckMsWUFBWSxFQUNaLFVBQVUsQ0FBQyxrQkFBa0IsRUFDN0IsWUFBWSxDQUFDLENBQUMsQ0FBQTs2QkFDekI7aUNBQU07Z0NBQ0gsZ0JBQWdCLENBQUMsSUFBSSxDQUNqQixJQUFJLHdEQUErQixDQUMvQixZQUFZLEVBQ1osb0JBQW9CLENBQUMsUUFBUyxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsRUFDbEQsWUFBWSxDQUFDLENBQUMsQ0FBQTs2QkFDekI7d0JBQ0wsQ0FBQyxDQUFDLENBQUE7cUJBQ0w7Z0JBQ0wsQ0FBQyxDQUFDLENBQUE7YUFDTDtZQUVELHdEQUF3RDtZQUN4RCxNQUFNLElBQUksZ0RBQTBCLENBQUMsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLENBQUE7U0FDL0Q7S0FDSjtTQUFNO1FBQ0gsTUFBTSxTQUFTLENBQUMsdUNBQXVDLENBQUMsQ0FBQTtLQUMzRDtJQUVELE9BQU8sSUFBSSxDQUFBO0FBQ2YsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBUyxxQkFBcUIsQ0FBQyxNQUErQjtJQUMxRCxNQUFNLGNBQWMsR0FBOEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDN0csSUFBSSxDQUFDLGNBQWMsRUFBRTtRQUNqQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUVELE1BQU0sYUFBYSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFBO0lBRW5ELE1BQU0sY0FBYyxHQUFHLGFBQWEsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7UUFDOUQsQ0FBQyxDQUFDLElBQUksZUFBTyxFQUFFO1FBQ2YsQ0FBQyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsaUJBQWlCLENBQUM7WUFDekMsQ0FBQyxDQUFDLElBQUksZUFBTyxFQUFFO1lBQ2YsQ0FBQyxDQUFDLElBQUksYUFBVSxFQUFFLENBQUE7SUFFMUIsY0FBYztJQUNkLGNBQWMsQ0FBQyxJQUFJLEdBQUc7UUFDbEIsR0FBRyxjQUFjLENBQUMsSUFBSTtRQUN0QixTQUFTLEVBQUUsSUFBSTtRQUNmLE9BQU8sRUFBRSxJQUFJO1FBQ2IsZUFBZSxFQUFFLElBQUk7S0FDeEIsQ0FBQTtJQUVELElBQUEsb0JBQVMsRUFBQyxjQUFjLENBQUMsQ0FBQTtJQUV6QiwwRUFBMEU7SUFDMUUsTUFBTSxnQkFBZ0IsR0FBRyx1QkFBdUIsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFDbEYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUksQ0FBQyxFQUFFO1lBQzdCLE1BQU0sQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLEdBQUksRUFBRSxTQUFTLENBQUMsQ0FBQTtTQUN4QztRQUVELE9BQU8sTUFBTSxDQUFBO0lBQ2pCLENBQUMsRUFBRSxJQUFJLEdBQUcsRUFBK0IsQ0FBQyxDQUFBO0lBRTFDLGlDQUFpQztJQUNqQyxLQUFLLE1BQU0sZUFBZSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ3JELGNBQWMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7S0FDNUM7SUFDRCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUUvRCxPQUFPLFNBQVMsQ0FBQTtBQUNwQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyx1QkFBdUIsQ0FDNUIsTUFBcUQsRUFDckQsb0JBQTZCLEtBQUs7SUFFbEMsTUFBTSxPQUFPLEdBQTBCLEVBQUUsQ0FBQTtJQUV6QyxNQUFNLGNBQWMsR0FBOEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDN0csSUFBSSxjQUFjLEVBQUU7UUFDaEIsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN2QyxNQUFNLElBQUksU0FBUyxDQUFDLG9DQUFvQyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFBO1NBQzlGO1FBRUQsSUFBSSxpQkFBaUIsRUFBRTtZQUNuQixNQUFNLGFBQWEsR0FBd0IsRUFBQyxHQUFHLGNBQWMsQ0FBQyxNQUFNLEVBQUMsQ0FBQTtZQUNyRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFDcEIsZ0NBQWdDO2dCQUNoQyxhQUFhLENBQUMsR0FBRyxHQUFHLEtBQUssTUFBTSxDQUFDLElBQUksRUFBRSxDQUFBO2FBQ3pDO1lBQ0QsT0FBTyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsQ0FBQTtTQUM5QjtRQUVELDZCQUE2QjtRQUM3QixnRkFBZ0Y7UUFDaEYsSUFBSSxjQUFjLENBQUMsVUFBVSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxFQUFFO1lBQ3ZFLGNBQWMsQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO2dCQUMxQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLHNDQUF1QixDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsRUFBRTtvQkFDbEUsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLHVCQUF1QixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFBO2lCQUM1RDtxQkFBTSxJQUFJLFNBQVMsSUFBSSxTQUFTLEVBQUU7b0JBQy9CLE9BQU8sQ0FBQyxJQUFJLENBQUMsU0FBZ0MsQ0FBQyxDQUFBO2lCQUNqRDtxQkFBTTtvQkFDSCxNQUFNLElBQUksU0FBUyxDQUFDLDBEQUEwRCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQTtpQkFDL0Y7WUFDTCxDQUFDLENBQUMsQ0FBQTtTQUNMO1FBRUQsd0VBQXdFO1FBQ3hFLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsMENBQW1CLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBMkIsQ0FBQTtRQUN4RyxJQUFJLFVBQVUsRUFBRTtZQUNaLEtBQUssTUFBTSxHQUFHLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsRUFBRTtnQkFDM0MsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLENBQUE7Z0JBQzVDLElBQUksT0FBTyxJQUFJLE9BQU8sQ0FBQyxJQUFJLElBQUksT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsT0FBTyxDQUFDLElBQUksQ0FBQyxFQUFFO29CQUM5RixPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsdUJBQXVCLENBQUMsT0FBTyxDQUFDLElBQStCLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQTtpQkFDMUY7YUFDSjtTQUNKO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNsQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUyxvQkFBb0IsQ0FBQyxPQUFlLEVBQUUsSUFBZ0I7SUFDM0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFdEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFBO0lBQ2hCLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNqQixPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDckI7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNoQixDQUFDO0FBRUQ7Ozs7OztHQU1HO0FBQ0gsU0FBUywyQkFBMkIsQ0FBQyxPQUFlLEVBQUUsR0FBRyxTQUFtQjtJQUN4RSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2RCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUE7S0FDM0I7SUFFRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFDaEIsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNyQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFHLENBQUE7UUFDM0IsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBO1NBQ3pCO2FBQU07WUFDSCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixPQUFPLElBQUksR0FBRyxDQUFBO2FBQ2pCO1lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQTtTQUNsQjtLQUNKO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQyJ9