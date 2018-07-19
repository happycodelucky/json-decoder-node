"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const ajv = require("ajv");
const ajvErrors = require("ajv-errors");
const decoder_declarations_1 = require("../decoder/decoder-declarations");
const decoder_declarations_2 = require("../decoder/decoder-declarations");
const decoder_map_1 = require("../decoder/decoder-map");
const marshallers_1 = require("../marshallers/marshallers");
const json_decoder_errors_1 = require("./json-decoder-errors");
const json_symbols_1 = require("./json-symbols");
const json_validation_errors_1 = require("./json-validation-errors");
const json_validation_errors_2 = require("./json-validation-errors");
class JsonDecoder {
    static decode(objectOrString, classType) {
        if (objectOrString === null || objectOrString === undefined) {
            return null;
        }
        let object;
        if (typeof objectOrString === 'string') {
            object = JSON.parse(objectOrString);
        }
        else if (Array.isArray(objectOrString) || typeof objectOrString === 'object') {
            object = objectOrString;
        }
        else {
            throw new TypeError('decode(object) should be an Object or a String');
        }
        let decodeObject;
        const objectFactory = Reflect.getMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderFactory, classType);
        if (objectFactory) {
            decodeObject = objectFactory.call(classType, object);
            if (decodeObject === null) {
                return null;
            }
            if (decodeObject !== undefined) {
                classType = decodeObject.constructor;
            }
        }
        if (!decodeObject) {
            const options = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodableOptions, classType);
            if (options && options.useConstructor) {
                const constructable = classType;
                decodeObject = new constructable();
            }
            else {
                decodeObject = Object.create(classType.prototype);
            }
        }
        validatedSourceJson(classType, object);
        const contextKey = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.context, classType);
        if (contextKey) {
            Reflect.defineProperty(decodeObject, contextKey, {
                value: object,
                enumerable: false,
                writable: false,
            });
        }
        const classConstructors = [];
        let prototype = classType.prototype;
        while (prototype !== Object.prototype) {
            if (!!Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decodable, prototype.constructor)) {
                classConstructors.unshift(prototype.constructor);
            }
            prototype = Reflect.getPrototypeOf(prototype);
        }
        for (const constructor of classConstructors) {
            const decoder = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoder, constructor.prototype);
            if (decoder) {
                const alternativeDecodeObject = decoder.call(decodeObject, object);
                if (alternativeDecodeObject === null) {
                    return null;
                }
            }
            const decoderMap = decoder_map_1.decoderMapForTarget(constructor);
            for (const key of Reflect.ownKeys(decoderMap)) {
                const mapEntry = Reflect.get(decoderMap, key);
                const value = evaluatePropertyValue(object, mapEntry, decodeObject);
                if (value !== undefined) {
                    decodeObject[key] = value;
                }
            }
        }
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
                            handler.mapFunction.call(decodeObject, value, object);
                        }
                    }
                }
            }
        }
        for (const constructor of classConstructors) {
            const decoderComplete = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderCompleted, constructor.prototype);
            if (decoderComplete) {
                try {
                    const completeObject = decoderComplete.call(decodeObject, object);
                    if (completeObject === null || completeObject === false) {
                        return null;
                    }
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
function createMarshaller(type) {
    if (decoder_declarations_2.isDecoderPrototypalCollectionTarget(type)) {
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
            collectionMarshaller = marshallers_1.collectionMarshallerForType(type.collection);
        }
        if (!collectionMarshaller) {
            return undefined;
        }
        let elementMarshaller = createMarshaller(type.element);
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
    return marshallers_1.marshallerForType(type);
}
function evaluatePropertyValue(object, mapEntry, decodeObject, strict = false) {
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
    const keyPaths = decoderMapEntry.key.split(/@|\./);
    let value = object;
    do {
        const path = keyPaths.shift();
        if (!path) {
            continue;
        }
        if (typeof value !== 'object' && typeof value !== 'string' && !Array.isArray(value)) {
            return undefined;
        }
        value = Reflect.get(value, path);
    } while (keyPaths.length > 0 && value !== null && value !== undefined);
    if (value === undefined) {
        return undefined;
    }
    if (decoderMapEntry.type) {
        const marshaller = createMarshaller(decoderMapEntry.type);
        if (marshaller) {
            value = marshaller(value, strict);
        }
        else {
            if (strict) {
                const rootType = decoder_declarations_2.isDecoderPrototypalCollectionTarget(decoderMapEntry.type) ? decoderMapEntry.type.collection : decoderMapEntry.type;
                throw new TypeError(`${rootType.name} is not a JSON decodable type`);
            }
            return undefined;
        }
        if (value === undefined) {
            return undefined;
        }
        if (decoderMapEntry.mapFunction) {
            value = decoderMapEntry.mapFunction.call(decodeObject, value, object);
        }
    }
    return value;
}
function validatedSourceJson(target, json) {
    if (!Reflect.hasMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target)) {
        return true;
    }
    let validator = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schemaValidator, target);
    if (!validator) {
        validator = createSchemaValidator(target);
        if (validator) {
            Reflect.defineMetadata(json_symbols_1.JsonDecoderMetadataKeys.schemaValidator, validator, target);
        }
    }
    if (!validator) {
        return true;
    }
    const validatorResult = validator(json);
    if (typeof validatorResult === 'boolean') {
        if (!validatorResult) {
            const errors = validator.errors;
            const validationErrors = [];
            if (errors) {
                errors.map((error) => {
                    let ajvError = error;
                    let templateErrorMessage;
                    let propertyPath;
                    let formatErrorMessage = false;
                    if (error.keyword === 'errorMessage') {
                        const params = error.params;
                        if ('errors' in params && Array.isArray(params.errors) && params.errors.length > 0) {
                            ajvError = params.errors[0];
                            propertyPath = convertJsonPointerToKeyPath(ajvError.dataPath);
                            templateErrorMessage = error.message;
                            formatErrorMessage = true;
                        }
                        else {
                            ajvError = undefined;
                            propertyPath = '???';
                            templateErrorMessage = error.message;
                        }
                    }
                    else {
                        propertyPath = convertJsonPointerToKeyPath(error.dataPath);
                        templateErrorMessage = propertyPath
                            ? `'${propertyPath}' ${error.message}`
                            : templateErrorMessage = `Object ${error.message}`;
                    }
                    if (ajvError) {
                        const errorParams = [].concat(ajvError.params);
                        errorParams.forEach(errorParam => {
                            if (!ajvError) {
                                return;
                            }
                            if (ajvError.keyword === 'dependencies') {
                                propertyPath = propertyPath ? `${propertyPath}.${errorParam.property}` : errorParam.property;
                            }
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
                                            if (!errorParam[property]) {
                                                value = 'object';
                                            }
                                        }
                                        if (!value) {
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
                                validationErrors.push(new json_validation_errors_1.JsonValidatorPropertyValueError(propertyPath, valueFromJsonPointer(ajvError.dataPath, json), errorMessage));
                            }
                        });
                    }
                });
            }
            throw new json_decoder_errors_1.JsonDecoderValidationError(validationErrors, json);
        }
    }
    else {
        throw TypeError('Async schema validation not supported');
    }
    return true;
}
function createSchemaValidator(target) {
    const metadataSchema = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target);
    if (!metadataSchema) {
        return undefined;
    }
    const schemaCompiler = ajv({
        allErrors: true,
        async: false,
        verbose: true,
        format: 'full',
        jsonPointers: true,
    });
    ajvErrors(schemaCompiler);
    const referenceSchemas = flattenSchemaReferences(target).reduce((result, reference) => {
        if (!result.has(reference.$id)) {
            result.set(reference.$id, reference);
        }
        return result;
    }, new Map());
    for (const referenceSchema of referenceSchemas.values()) {
        schemaCompiler.addSchema(referenceSchema);
    }
    const validator = schemaCompiler.compile(metadataSchema.schema);
    return validator;
}
function flattenSchemaReferences(target, includeRootSchema = false) {
    const schemas = [];
    const metadataSchema = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.schema, target);
    if (metadataSchema) {
        if (!('$schema' in metadataSchema.schema)) {
            throw new TypeError(`Missing '$schema' declaration in ${target.name || target.$id} schema`);
        }
        if (includeRootSchema) {
            const mutableSchema = Object.assign({}, metadataSchema.schema);
            if (!mutableSchema.$id) {
                mutableSchema.$id = `#/${target.name}`;
            }
            schemas.push(mutableSchema);
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsNEJBQXlCO0FBRXpCLDJCQUEwQjtBQUUxQix3Q0FBdUM7QUFJdkMsMEVBQThGO0FBQzlGLDBFQUF3SDtBQUN4SCx3REFBeUY7QUFHekYsNERBQTJGO0FBRzNGLCtEQUFrRTtBQUVsRSxpREFBd0Q7QUFDeEQscUVBQStGO0FBQy9GLHFFQUFtSDtBQU1uSDtJQU9JLE1BQU0sQ0FBQyxNQUFNLENBQW1CLGNBQW1DLEVBQUUsU0FBa0M7UUFDbkcsSUFBSSxjQUFjLEtBQUssSUFBSSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUdELElBQUksTUFBYyxDQUFBO1FBQ2xCLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBRXBDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1NBQ3RDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUU1RSxNQUFNLEdBQUcsY0FBYyxDQUFBO1NBQzFCO2FBQU07WUFDSCxNQUFNLElBQUksU0FBUyxDQUFDLGdEQUFnRCxDQUFDLENBQUE7U0FDeEU7UUFFRCxJQUFJLFlBQVksQ0FBQTtRQUdoQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLDBDQUFtQixDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUN4RixJQUFJLGFBQWEsRUFBRTtZQUNmLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUdwRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFBO2FBQ2Q7WUFH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Ii8qKlxuICogSlNPTiBzcGVjaWZpYyBkZWNvZGVyIGFuZCBkZWNvcmF0b3JzXG4gKi9cblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJ1xuXG5pbXBvcnQgKiBhcyBhanYgZnJvbSAnYWp2J1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICogYXMgYWp2RXJyb3JzIGZyb20gJ2Fqdi1lcnJvcnMnXG5cbmltcG9ydCB7IEFkZGl0aW9uYWxQcm9wZXJ0aWVzUGFyYW1zLCBFcnJvck9iamVjdCwgUmVxdWlyZWRQYXJhbXMsIFZhbGlkYXRlRnVuY3Rpb24gfSBmcm9tICdhanYnXG5cbmltcG9ydCB7IERlY29kZXJNZXRhZGF0YUtleXMsIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLWRlY2xhcmF0aW9ucydcbmltcG9ydCB7IERlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCwgaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItZGVjbGFyYXRpb25zJ1xuaW1wb3J0IHsgRGVjb2Rlck1hcCwgRGVjb2Rlck1hcEVudHJ5LCBkZWNvZGVyTWFwRm9yVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLW1hcCdcblxuaW1wb3J0IHsgQ29sbGVjdGlvbk1hcnNoYWxsZXJGdW5jdGlvbiwgTWFyc2hhbGxlckZ1bmN0aW9uIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWFyc2hhbGxlckZvclR5cGUsIG1hcnNoYWxsZXJGb3JUeXBlIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5cbmltcG9ydCB7IEpzb25PYmplY3QgfSBmcm9tICcuL2pzb24tZGVjb2RhYmxlLXR5cGVzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuL2pzb24tZGVjb2Rlci1lcnJvcnMnXG5pbXBvcnQgeyBKc29uRGVjb2RhYmxlT3B0aW9ucywgSnNvbkRlY29kYWJsZVNjaGVtYSwgSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSB9IGZyb20gJy4vanNvbi1kZWNvcmF0b3JzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJNZXRhZGF0YUtleXMgfSBmcm9tICcuL2pzb24tc3ltYm9scydcbmltcG9ydCB7IEpzb25WYWxpZGF0aW9uRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVZhbHVlRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5pbXBvcnQgeyBKc29uVmFsaWRhdG9yUHJvcGVydHlNaXNzaW5nRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVVuc3VwcG9ydGVkRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5cbi8qKlxuICogSlNPTiBkZWNvZGVyIGZvciBKU09OIGRlY29kYWJsZSBjbGFzc2VzXG4gKi9cbi8vIHRzbGludDpkaXNhYmxlOm5vLXVubmVjZXNzYXJ5LWNsYXNzXG5leHBvcnQgY2xhc3MgSnNvbkRlY29kZXIge1xuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBKU09OIG9iamVjdCBvciBTdHJpbmcgcmV0dXJuaW5nIGJhY2sgdGhlIG9iamVjdCBpZiBpdCB3YXMgYWJsZSB0byBiZSBkZWNvZGVkXG4gICAgICogQHBhcmFtIG9iamVjdE9yU3RyaW5nIC0gYXJyYXkgb3Igc3RyaW5nIChjb250YWluIEpTT04gb2JqZWN0KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlIC0gZGVjb2RhYmxlIHR5cGUgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYSBkZWNvZGVkIG9iamVjdCBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGU8VCBleHRlbmRzIG9iamVjdD4ob2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3QsIGNsYXNzVHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpOiBUIHwgbnVsbCB7XG4gICAgICAgIGlmIChvYmplY3RPclN0cmluZyA9PT0gbnVsbCB8fCBvYmplY3RPclN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXh0cmFjdCBvdXIgSlNPTiBvYmplY3RcbiAgICAgICAgbGV0IG9iamVjdDogb2JqZWN0XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBXaWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgSlNPTiBoYXMgYSBzeW50YXggZXJyb3JcbiAgICAgICAgICAgIG9iamVjdCA9IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvYmplY3RPclN0cmluZykgfHwgdHlwZW9mIG9iamVjdE9yU3RyaW5nID09PSAnb2JqZWN0Jykge1xuICAgICAgICAgICAgLy8gQXJyYXlzIGFyZSBvYmplY3RzIHRvbywgYW5kIGNhbiBiZSBxdWVyaWVkIHdpdGggQDAudmFsdWVcbiAgICAgICAgICAgIG9iamVjdCA9IG9iamVjdE9yU3RyaW5nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdkZWNvZGUob2JqZWN0KSBzaG91bGQgYmUgYW4gT2JqZWN0IG9yIGEgU3RyaW5nJylcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBkZWNvZGVPYmplY3RcblxuICAgICAgICAvLyBDcmVhdGUgb3VyIGRlY29kaW5nIG9iamVjdCB1c2luZyBhIGRlY29kZXIgZnVuY3Rpb24gaWYgcmVnaXN0ZXJlZFxuICAgICAgICBjb25zdCBvYmplY3RGYWN0b3J5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJGYWN0b3J5LCBjbGFzc1R5cGUpXG4gICAgICAgIGlmIChvYmplY3RGYWN0b3J5KSB7XG4gICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBvYmplY3RGYWN0b3J5LmNhbGwoY2xhc3NUeXBlLCBvYmplY3QpXG5cbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgIGlmIChkZWNvZGVPYmplY3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBXaXRoIGEgbmV3IG9iamVjdCBjYW4gY29tZSBhIG5ldyBkZWNvZGVyIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgICAgIGlmIChkZWNvZGVPYmplY3QgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIGNsYXNzVHlwZSA9IGRlY29kZU9iamVjdC5jb25zdHJ1Y3RvclxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghZGVjb2RlT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZU9wdGlvbnMsIGNsYXNzVHlwZSkgYXMgSnNvbkRlY29kYWJsZU9wdGlvbnMgfCB1bmRlZmluZWRcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIG9wdGlvbnMudXNlQ29uc3RydWN0b3IpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25zdHJ1Y3RhYmxlID0gY2xhc3NUeXBlIGFzIE9iamVjdENvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0ID0gbmV3IGNvbnN0cnVjdGFibGUoKVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbnN0YW50aWF0ZSB0aGUgb2JqZWN0LCB3aXRob3V0IGNhbGxpbmcgdGhlIGNvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0ID0gT2JqZWN0LmNyZWF0ZShjbGFzc1R5cGUucHJvdG90eXBlKSBhcyBUXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBWYWxpZGF0ZSB0aGUgSlNPTlxuICAgICAgICAvLyBUaGlzIHdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIG5vdCB2YWxpZFxuICAgICAgICB2YWxpZGF0ZWRTb3VyY2VKc29uKGNsYXNzVHlwZSwgb2JqZWN0KVxuXG4gICAgICAgIC8vIENoZWNrIGlmIGEgY29udGV4dCBuZWVkcyB0byBiZSBzZXRcbiAgICAgICAgY29uc3QgY29udGV4dEtleSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuY29udGV4dCwgY2xhc3NUeXBlKVxuICAgICAgICBpZiAoY29udGV4dEtleSkge1xuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShkZWNvZGVPYmplY3QsIGNvbnRleHRLZXksIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogb2JqZWN0LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW4sIGFkZGluZyB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb25zIGluIHJldmVyc2Ugb3JkZXJcbiAgICAgICAgY29uc3QgY2xhc3NDb25zdHJ1Y3RvcnM6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0W10gPSBbXVxuICAgICAgICBsZXQgcHJvdG90eXBlID0gY2xhc3NUeXBlLnByb3RvdHlwZVxuICAgICAgICB3aGlsZSAocHJvdG90eXBlICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICAgICAgICBpZiAoISFSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCBwcm90b3R5cGUuY29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NDb25zdHJ1Y3RvcnMudW5zaGlmdChwcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm90b3R5cGUgPSBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5XG4gICAgICAgIGZvciAoY29uc3QgY29uc3RydWN0b3Igb2YgY2xhc3NDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBhIGJlZm9yZSBkZWNvZGUgZnVuY3Rpb24gb24gYSBjb25zdHJ1Y3RvciBmdW5jdGlvbidzIHByb3RvdHlwZVxuICAgICAgICAgICAgY29uc3QgZGVjb2RlciA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyLCBjb25zdHJ1Y3Rvci5wcm90b3R5cGUpXG4gICAgICAgICAgICBpZiAoZGVjb2Rlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsdGVybmF0aXZlRGVjb2RlT2JqZWN0ID0gZGVjb2Rlci5jYWxsKGRlY29kZU9iamVjdCwgb2JqZWN0KVxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoYWx0ZXJuYXRpdmVEZWNvZGVPYmplY3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvb2sgdXAgZGVjb2RlciBtYXAgZm9yIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgICAgICAgICAgY29uc3QgZGVjb2Rlck1hcCA9IGRlY29kZXJNYXBGb3JUYXJnZXQoY29uc3RydWN0b3IpXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoZGVjb2Rlck1hcCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXBFbnRyeSA9IFJlZmxlY3QuZ2V0KGRlY29kZXJNYXAsIGtleSkgYXMgRGVjb2Rlck1hcEVudHJ5XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZVByb3BlcnR5VmFsdWUob2JqZWN0LCBtYXBFbnRyeSwgZGVjb2RlT2JqZWN0KVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlY29kZU9iamVjdFtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGNsYXNzIGhlaXJhcmNoeSBmb3IgcHJvdG90eXBlIGRlY29kZXJzLCB0aGlzIHRpbWUgY2FsbGluZyBhbGwgdGhlIHByb3BlcnR5IG5vdGlmaWVyc1xuICAgICAgICAvLyBUaGlzIGlzIGRvbmUgYWZ0ZXIgYWxsIG1hcHBlZCBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZFxuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdG9yIG9mIGNsYXNzQ29uc3RydWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5vdGlmaWVyczogTWFwPHN0cmluZywgRGVjb2Rlck1hcEVudHJ5W10+ID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcbiAgICAgICAgICAgICAgICBEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJOb3RpZmllcnMsXG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3IsXG4gICAgICAgICAgICApXG4gICAgICAgICAgICBpZiAocHJvcGVydHlOb3RpZmllcnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJzIG9mIHByb3BlcnR5Tm90aWZpZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBoYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZVByb3BlcnR5VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBoYW5kbGVyLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGFuZGxlci50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBDYXB0dXJlIGVycm9ycyBmcm9tIGhhbmRsZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5tYXBGdW5jdGlvbiEuY2FsbChkZWNvZGVPYmplY3QsIHZhbHVlLCBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGNsYXNzIGhlaXJhcmNoeSBmb3IgcHJvdG90eXBlIGRlY29kZXJzLCBjYWxsaW5nIHRoZSBkZWNvZGVyIGNvbXBsZXRlIGZ1bmN0aW9uXG4gICAgICAgIC8vIFRoaXMgZG9uZSBhZnRlciBhbGwgcG90ZW50aWFsIGFzc2lnbWVudHNcbiAgICAgICAgZm9yIChjb25zdCBjb25zdHJ1Y3RvciBvZiBjbGFzc0NvbnN0cnVjdG9ycykge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGEgYWZ0ZXIgZGVjb2RlIHByb3RvdHlwZSBmdW5jdGlvblxuICAgICAgICAgICAgY29uc3QgZGVjb2RlckNvbXBsZXRlID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJDb21wbGV0ZWQsIGNvbnN0cnVjdG9yLnByb3RvdHlwZSlcbiAgICAgICAgICAgIGlmIChkZWNvZGVyQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZU9iamVjdDogYW55ID0gZGVjb2RlckNvbXBsZXRlLmNhbGwoZGVjb2RlT2JqZWN0LCBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlT2JqZWN0ID09PSBudWxsIHx8IGNvbXBsZXRlT2JqZWN0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3Igc3dhcHBlZCBkZWNvZGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZU9iamVjdCAmJiBjb21wbGV0ZU9iamVjdCAhPT0gZGVjb2RlT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBjb21wbGV0ZU9iamVjdFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBKc29uVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3IgPSBuZXcgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IoW2Vycl0sIG9iamVjdCwgJ0pTT04gdmFsaWRhdGlvbiBmYWlsZWQgcG9zdCBkZWNvZGUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgdmFsaWRhdGlvbkVycm9yXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVjb2RlT2JqZWN0XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhIEpTT04gb2JqZWN0IG9yIFN0cmluZyByZXR1cm5pbmcgYmFjayB0aGUgb2JqZWN0IGlmIGl0IHdhcyBhYmxlIHRvIGJlIGRlY29kZWRcbiAgICAgKiBAcGFyYW0gb2JqZWN0T3JTdHJpbmcgLSBhcnJheSBvciBzdHJpbmcgKGNvbnRhaW4gSlNPTiBhcnJheSkgdG8gZGVjb2RlXG4gICAgICogQHBhcmFtIGNsYXNzVHlwZSAtIGRlY29kYWJsZSB0eXBlIHRvIGRlY29kZSBKU09OIGludG9cbiAgICAgKiBAcmV0dXJuIGFuIGFycmF5IG9mIGRlY29kZWQgb2JqZWN0cyBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGVBcnJheTxUIGV4dGVuZHMgb2JqZWN0PihcbiAgICAgICAgb2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3RbXSxcbiAgICAgICAgY2xhc3NUeXBlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCxcbiAgICApOiBbVF0gfCBudWxsIHtcbiAgICAgICAgaWYgKG9iamVjdE9yU3RyaW5nID09PSBudWxsIHx8IG9iamVjdE9yU3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb2JqZWN0czogb2JqZWN0W11cbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RPclN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBKU09OLnBhcnNlKG9iamVjdE9yU3RyaW5nKVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0T3JTdHJpbmcpKSB7XG4gICAgICAgICAgICBvYmplY3RzID0gb2JqZWN0T3JTdHJpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RlY29kZShvYmplY3QpIHNob3VsZCBiZSBhbiBBcnJheSBvZiBPYmplY3RzIG9yIGEgU3RyaW5nJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvYmplY3RzLm1hcDxUIHwgbnVsbD4oKG9iamVjdCkgPT4gdGhpcy5kZWNvZGU8VD4ob2JqZWN0LCBjbGFzc1R5cGUpKS5maWx0ZXIoKG9iamVjdCkgPT4gISFvYmplY3QpIGFzIFtUXVxuICAgIH1cbn1cblxuLy9cbi8vIFByaXZhdGUgZnVuY3Rpb25zXG4vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXJzaGFsbGVyIGZvciBhIGdpdmVuIHR5cGUgZGVjbGFyYXRpb24gdG8gdXNlIGZvciBjb252ZXJzaW9uXG4gKlxuICogQHBhcmFtIHR5cGUgLSBkZXNpcmVkIGNvbnZlcnNpb24gdHlwZVxuICogQHJldHVybiBjb252ZXJzaW9uIGZ1bmN0aW9uIG9yIHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBjcmVhdGVNYXJzaGFsbGVyKHR5cGU6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IHwgRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0KTpcbiAgICAoKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IGFueSkgfCB1bmRlZmluZWRcbntcbiAgICBpZiAoaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQodHlwZSkpIHtcbiAgICAgICAgbGV0IGNvbGxlY3Rpb25NYXJzaGFsbGVyOiBDb2xsZWN0aW9uTWFyc2hhbGxlckZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCB0eXBlLmNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uTWFyc2hhbGxlciA9ICh2YWx1ZTogYW55LCBpdGVtTWFyaHNhbGxlcj86IE1hcnNoYWxsZXJGdW5jdGlvbiwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgfHwgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKc29uRGVjb2Rlci5kZWNvZGUodmFsdWUsIHR5cGUuY29sbGVjdGlvbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3R5cGVvZiB2YWx1ZX0gY2Fubm90IGJlIGNvbnZlcnRlZCB0byAke3R5cGUuY29sbGVjdGlvbi5uYW1lfWApXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sbGVjdGlvbk1hcnNoYWxsZXIgPSBjb2xsZWN0aW9uTWFyc2hhbGxlckZvclR5cGUodHlwZS5jb2xsZWN0aW9uKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uTWFyc2hhbGxlcikge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlbGVtZW50TWFyc2hhbGxlciA9IGNyZWF0ZU1hcnNoYWxsZXIodHlwZS5lbGVtZW50KVxuXG4gICAgICAgIC8vIElmIHRoZSBlbGVtZW50IHR5cGUgaXMgZGVjb2RhYmxlXG4gICAgICAgIGlmICghZWxlbWVudE1hcnNoYWxsZXIgJiYgUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZSwgdHlwZS5lbGVtZW50KSkge1xuICAgICAgICAgICAgZWxlbWVudE1hcnNoYWxsZXIgPSAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBKc29uRGVjb2Rlci5kZWNvZGU8dHlwZW9mIHR5cGU+KHZhbHVlLCB0eXBlLmVsZW1lbnQgYXMgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uTWFyc2hhbGxlciEodmFsdWUsIGVsZW1lbnRNYXJzaGFsbGVyLCBzdHJpY3QpXG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFJlZmxlY3QuZ2V0TWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHR5cGUpKSB7XG4gICAgICAgIHJldHVybiAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZTx0eXBlb2YgdHlwZT4odmFsdWUsIHR5cGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWFyc2hhbGxlckZvclR5cGUodHlwZSlcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgYSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgKGJlaW5nIGRlY29kZWQpIGJhc2VkIG9uIGEgbWFwIGVudHJ5IGZvciB0aGUgZGVjb2Rlci5cbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gb2JqZWN0IGJlaW5nIGRlY29kZWRcbiAqIEBwYXJhbSBtYXBFbnRyeSAtIGRlY29kZXIgbWFwIGVudHJ5XG4gKiBAcGFyYW0gZGVjb2RlT2JqZWN0IC0gb2JqZWN0IGJlaW5nIHBvcHVsYXRlZCBieSB0aGUgZGVjb2RlclxuICogQHBhcmFtIHN0cmljdCAtIHdoZW4gdHJ1ZSwgcGFyc2luZyBpcyBzdHJpY3QgYW5kIHRocm93cyBhIFR5cGVFcnJvciBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZFxuICogQHJldHVybnMgZXZhbHVhdGVkIHByb3BlcnR5IHZhbHVlXG4gKlxuICogQHRocm93cyBUeXBlRXJyb3JcbiAqL1xuZnVuY3Rpb24gZXZhbHVhdGVQcm9wZXJ0eVZhbHVlKFxuICAgIG9iamVjdDogb2JqZWN0LFxuICAgIG1hcEVudHJ5OiBEZWNvZGVyTWFwRW50cnksXG4gICAgZGVjb2RlT2JqZWN0OiBvYmplY3QsXG4gICAgc3RyaWN0OiBib29sZWFuID0gZmFsc2UsXG4pOiBhbnkge1xuICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgaWYgKCFtYXBFbnRyeSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIGNvbnNpc3RlbnQgdXNlIG9mIERlY29kZXJNYXBFbnRyeVxuICAgIGxldCBkZWNvZGVyTWFwRW50cnk6IERlY29kZXJNYXBFbnRyeVxuICAgIGlmICh0eXBlb2YgbWFwRW50cnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGRlY29kZXJNYXBFbnRyeSA9IHtcbiAgICAgICAgICAgIGtleTogbWFwRW50cnksXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWNvZGVyTWFwRW50cnkgPSBtYXBFbnRyeVxuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIHByb3BlcnR5IGtleSBwYXRoIGluIHRoZSBKU09OIG9iamVjdFxuICAgIGNvbnN0IGtleVBhdGhzID0gZGVjb2Rlck1hcEVudHJ5LmtleS5zcGxpdCgvQHxcXC4vKVxuICAgIGxldCB2YWx1ZTogYW55ID0gb2JqZWN0XG4gICAgZG8ge1xuICAgICAgICBjb25zdCBwYXRoID0ga2V5UGF0aHMuc2hpZnQoKSFcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuIG9ubHkgaW5zcGVjdCBvYmplY3QgdmFsdWVzLCBmYWlsIGlmIHdlIGNhbm5vdCByZXNvbHZlIHRoZSB2YWx1ZVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gVE9ETzogVGhyb3cgZXJyb3I/XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSBSZWZsZWN0LmdldCh2YWx1ZSwgcGF0aClcbiAgICB9IHdoaWxlIChrZXlQYXRocy5sZW5ndGggPiAwICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhbiB1bmRlZmluZWQgdmFsdWUgcmV0dXJuIGl0IChkbyBub3QgcmV0dXJuIG9uIG51bGwpXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIC8vIENoZWNrIGFueSB0eXBlIGNvbnZlcnNpb25cbiAgICBpZiAoZGVjb2Rlck1hcEVudHJ5LnR5cGUpIHtcbiAgICAgICAgY29uc3QgbWFyc2hhbGxlciA9IGNyZWF0ZU1hcnNoYWxsZXIoZGVjb2Rlck1hcEVudHJ5LnR5cGUpXG4gICAgICAgIGlmIChtYXJzaGFsbGVyKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG1hcnNoYWxsZXIodmFsdWUsIHN0cmljdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb290VHlwZSA9XG4gICAgICAgICAgICAgICAgICAgIGlzRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0KGRlY29kZXJNYXBFbnRyeS50eXBlKSA/IGRlY29kZXJNYXBFbnRyeS50eXBlLmNvbGxlY3Rpb24gOiBkZWNvZGVyTWFwRW50cnkudHlwZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7cm9vdFR5cGUubmFtZX0gaXMgbm90IGEgSlNPTiBkZWNvZGFibGUgdHlwZWApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHZhbHVlLCBpdCBzaG91bGQgYmUgc2tpcHBlZFxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlY29kZXJNYXBFbnRyeS5tYXBGdW5jdGlvbikge1xuICAgICAgICAgICAgdmFsdWUgPSBkZWNvZGVyTWFwRW50cnkubWFwRnVuY3Rpb24uY2FsbChkZWNvZGVPYmplY3QsIHZhbHVlLCBvYmplY3QpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYSBzY2hlbWEgZGVmaW5lZCBvbiBhIHRhcmdldCBhZ2FpbnN0IHRoZSBzb3VyY2UgSlNPTi5cbiAqIElmIHRoZSBKU09OIGlzIG5vdCB2YWxpZCB0aGVuIGEgSnNvbkRlY29kZXJWYWxpZGF0b3JFcnJvciBleGNlcHRpb24gaXMgdGhyb3duXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hIGZyb21cbiAqIEBwYXJhbSBqc29uIC0gSlNPTiBvYmplY3RcbiAqIEByZXR1cm5zIHRydWUgaWYgdGhlIHNjaGVtYSB3YXMgdmFsaWQgKEpzb25EZWNvZGVyVmFsaWRhdG9yRXJyb3IgZXhjZXB0aW9uIHRocm93biBvdGhlcndpc2UpXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlZFNvdXJjZUpzb24odGFyZ2V0OiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCwganNvbjogSnNvbk9iamVjdCk6IGJvb2xlYW4ge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gdmFsaWRhdGUgdGhlbiBpdCdzIHZhbGlkXG4gICAgaWYgKCFSZWZsZWN0Lmhhc01ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIEZldGNoIGFuIGV4aXN0aW5nIHZhbGlkYXRvclxuICAgIGxldCB2YWxpZGF0b3IgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYVZhbGlkYXRvciwgdGFyZ2V0KSBhcyBWYWxpZGF0ZUZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgLy8gQ3JlYXRlIGEgbmV3IHZhbGlkYXRvciBpZiBvbmUgaGFzIG5vdCBhbHJlYWR5IGJlZW4gY3JlYXRlZFxuICAgIGlmICghdmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvciA9IGNyZWF0ZVNjaGVtYVZhbGlkYXRvcih0YXJnZXQpXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hVmFsaWRhdG9yLCB2YWxpZGF0b3IsIHRhcmdldClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vIHZhbGlkYXRvciAoc2hvdWxkIG5vdCBoYXBwZW4pXG4gICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBBdHRlbXB0IHZhbGlkYXRpb24gYW5kIHJlcG9ydCBlcnJvcnNcbiAgICBjb25zdCB2YWxpZGF0b3JSZXN1bHQgPSB2YWxpZGF0b3IoanNvbilcbiAgICBpZiAodHlwZW9mIHZhbGlkYXRvclJlc3VsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIGlmICghdmFsaWRhdG9yUmVzdWx0KSB7XG4gICAgICAgICAgICAvLyBDb2xsZWN0IHRoZSBlcnJvcnMgcHJvZHVjZWQgYnkgdGhlIHZhbGlkYXRvclxuICAgICAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvbkVycm9yczogSnNvblZhbGlkYXRpb25FcnJvcltdID0gW11cbiAgICAgICAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMubWFwKChlcnJvcjogRXJyb3JPYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFqdkVycm9yOiBFcnJvck9iamVjdCB8IHVuZGVmaW5lZCA9IGVycm9yXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGV4cGxpY2l0IGVycm9yIG1lc3NhZ2VzXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUVycm9yTWVzc2FnZTogc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eVBhdGg6IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm9ybWF0RXJyb3JNZXNzYWdlID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLmtleXdvcmQgPT09ICdlcnJvck1lc3NhZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IGVycm9yLnBhcmFtc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cHJlZmVyLWNvbmRpdGlvbmFsLWV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnZXJyb3JzJyBpbiBwYXJhbXMgJiYgQXJyYXkuaXNBcnJheShwYXJhbXMuZXJyb3JzKSAmJiBwYXJhbXMuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhanZFcnJvciA9IHBhcmFtcy5lcnJvcnNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgoYWp2RXJyb3IhLmRhdGFQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZSFcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNob3VsZCBmb3JtYXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0RXJyb3JNZXNzYWdlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhanZFcnJvciA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gY29udmVydEpzb25Qb2ludGVyVG9LZXlQYXRoKGVycm9yLmRhdGFQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBwcm9wZXJ0eVBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGAnJHtwcm9wZXJ0eVBhdGh9JyAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBgT2JqZWN0ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSBlcnJvciBwYXJhbWV0ZXIgdG8gYmUgYW4gYXJyYXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBwbGF5IGl0IHNhZmUsIGVuc3VyZSB3ZSBoYXZlIGFuIGFycmF5IHRvIGl0ZXJhdGUgb3ZlclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JQYXJhbXM6IGFueVtdID0gW10uY29uY2F0KGFqdkVycm9yLnBhcmFtcyBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBhcmFtcy5mb3JFYWNoKGVycm9yUGFyYW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWp2RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFqdkVycm9yLmtleXdvcmQgPT09ICdkZXBlbmRlbmNpZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gcHJvcGVydHlQYXRoID8gYCR7cHJvcGVydHlQYXRofS4ke2Vycm9yUGFyYW0ucHJvcGVydHl9YCA6IGVycm9yUGFyYW0ucHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhlcmUgaXMgYWx3YXlzIGEgcHJvcGVydHkgcGF0aCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBhcmFtLnByb3BlcnR5UGF0aCA9IHByb3BlcnR5UGF0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IFN0cmluZyh0ZW1wbGF0ZUVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybWF0RXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlUmVnRXggPSAvKHt7KFthLXowLTlcXC1fXSspfX0pL2dpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaCA9IHRlbXBsYXRlUmVnRXguZXhlYyhlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5IGluIGVycm9yUGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdwcm9wZXJ0eVBhdGgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnJvclBhcmFtW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGAnJHtlcnJvclBhcmFtW3Byb3BlcnR5XX0nYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBgJHtlcnJvck1lc3NhZ2Uuc2xpY2UoMCwgbWF0Y2guaW5kZXgpfWAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3ZhbHVlfWAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2Vycm9yTWVzc2FnZS5zbGljZSh0ZW1wbGF0ZVJlZ0V4Lmxhc3RJbmRleCl9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHRlbXBsYXRlUmVnRXguZXhlYyhlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ3JlcXVpcmVkJyB8fCBhanZFcnJvci5rZXl3b3JkID09PSAnZGVwZW5kZW5jaWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5TWlzc2luZ0Vycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3JQYXJhbSBhcyBSZXF1aXJlZFBhcmFtcykubWlzc2luZ1Byb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKGFqdkVycm9yLmtleXdvcmQgPT09ICdhZGRpdGlvbmFsUHJvcGVydGllcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEpzb25WYWxpZGF0b3JQcm9wZXJ0eVVuc3VwcG9ydGVkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3JQYXJhbSBhcyBBZGRpdGlvbmFsUHJvcGVydGllc1BhcmFtcykuYWRkaXRpb25hbFByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEpzb25WYWxpZGF0b3JQcm9wZXJ0eVZhbHVlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlRnJvbUpzb25Qb2ludGVyKGFqdkVycm9yIS5kYXRhUGF0aCwganNvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhyb3cgYSBzaW5nbGUgZXJyb3Igd2l0aCBhbGwgdGhlIHNwZWNpZmljIHZhbGlkYXRpb25cbiAgICAgICAgICAgIHRocm93IG5ldyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvcih2YWxpZGF0aW9uRXJyb3JzLCBqc29uKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdBc3luYyBzY2hlbWEgdmFsaWRhdGlvbiBub3Qgc3VwcG9ydGVkJylcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBzY2hlbWEgdmFsaWRhdG9yIGZvciBhIHRhcmdldC4gSWYgdGhlIHRhcmdldCBkb2VzIG5vdCBzdXBwb3J0IEpTT04gc2NoZW1hIG5vIHZhbGlkYXRvciBmdW5jdGlvbiB3aWxsIGJlIHJldHVybmVkXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hLCBhbmQgc2NoZW1hIHJlZmVyZW5jZXMgZnJvbVxuICogQHJldHVybnMgdmFsaWRhdG9yIGZ1bmN0aW9uIHRvIHZhbGlkYXRlIHNjaGVtYXMgd2l0aCwgb3IgdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIHZhbGlkYXRpb24gbmVlZGVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNjaGVtYVZhbGlkYXRvcih0YXJnZXQ6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0KTogYWp2LlZhbGlkYXRlRnVuY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGFkYXRhU2NoZW1hOiBKc29uRGVjb2RlclNjaGVtYU1ldGFkYXRhID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHRhcmdldClcbiAgICBpZiAoIW1ldGFkYXRhU2NoZW1hKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICAvLyBTY2hlbWEgb3B0aW9uc1xuICAgIGNvbnN0IHNjaGVtYUNvbXBpbGVyID0gYWp2KHtcbiAgICAgICAgYWxsRXJyb3JzOiB0cnVlLFxuICAgICAgICBhc3luYzogZmFsc2UsXG4gICAgICAgIHZlcmJvc2U6IHRydWUsXG4gICAgICAgIGZvcm1hdDogJ2Z1bGwnLFxuICAgICAgICBqc29uUG9pbnRlcnM6IHRydWUsIC8vIFJlcXVpcmVkIGZvciBhanZFcnJvcnNcbiAgICB9KVxuICAgIGFqdkVycm9ycyhzY2hlbWFDb21waWxlcilcblxuICAgIC8vIEZsYXR0ZW4gYWxsIHRoZSByZWZlcmVuY2VzIGFuZCBlbnN1cmUgdGhlcmUgaXMgb25seSBvbmUgdmVyc2lvbiBvZiBlYWNoXG4gICAgY29uc3QgcmVmZXJlbmNlU2NoZW1hcyA9IGZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKHRhcmdldCkucmVkdWNlKChyZXN1bHQsIHJlZmVyZW5jZSkgPT4ge1xuICAgICAgICBpZiAoIXJlc3VsdC5oYXMocmVmZXJlbmNlLiRpZCEpKSB7XG4gICAgICAgICAgICByZXN1bHQuc2V0KHJlZmVyZW5jZS4kaWQhLCByZWZlcmVuY2UpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSwgbmV3IE1hcDxzdHJpbmcsIEpzb25EZWNvZGFibGVTY2hlbWE+KCkpXG5cbiAgICAvLyBBZGQgYWxsIHJlZmVyZW5jZXMgYW5kIGNvbXBpbGVcbiAgICBmb3IgKGNvbnN0IHJlZmVyZW5jZVNjaGVtYSBvZiByZWZlcmVuY2VTY2hlbWFzLnZhbHVlcygpKSB7XG4gICAgICAgIHNjaGVtYUNvbXBpbGVyLmFkZFNjaGVtYShyZWZlcmVuY2VTY2hlbWEpXG4gICAgfVxuICAgIGNvbnN0IHZhbGlkYXRvciA9IHNjaGVtYUNvbXBpbGVyLmNvbXBpbGUobWV0YWRhdGFTY2hlbWEuc2NoZW1hKVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvclxufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFsbCBzY2hlbWEgcmVmZXJlbmNlcyBmcm9tIHRoZSB0YXJnZXQgZG93blxuICpcbiAqIEBwYXJhbSB0YXJnZXQgLSB0YXJnZXQgY2xhc3MgdG8gdGFrZSBkZWZpbmVkIHNjaGVtYSByZWZlcmVuY2VzIGZyb21cbiAqIEBwYXJhbSBbaW5jbHVkZVJvb3RTY2hlbWE9ZmFsc2VdIC0gVXNlZCBmb3IgcmVjdXJzaW9uXG4gKiBAcmV0dXJucyBGbGF0dGVuZWQgc2NoZW1hcyB0byBhZGQgYXMgcmVmZXJlbmNlIGRlZmluaXRpb25zXG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKFxuICAgIHRhcmdldDogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfCBKc29uRGVjb2RhYmxlU2NoZW1hLFxuICAgIGluY2x1ZGVSb290U2NoZW1hOiBib29sZWFuID0gZmFsc2UpOiBKc29uRGVjb2RhYmxlU2NoZW1hW11cbntcbiAgICBjb25zdCBzY2hlbWFzOiBKc29uRGVjb2RhYmxlU2NoZW1hW10gPSBbXVxuXG4gICAgY29uc3QgbWV0YWRhdGFTY2hlbWE6IEpzb25EZWNvZGVyU2NoZW1hTWV0YWRhdGEgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KVxuICAgIGlmIChtZXRhZGF0YVNjaGVtYSkge1xuICAgICAgICBpZiAoISgnJHNjaGVtYScgaW4gbWV0YWRhdGFTY2hlbWEuc2NoZW1hKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgTWlzc2luZyAnJHNjaGVtYScgZGVjbGFyYXRpb24gaW4gJHt0YXJnZXQubmFtZSB8fCB0YXJnZXQuJGlkfSBzY2hlbWFgKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluY2x1ZGVSb290U2NoZW1hKSB7XG4gICAgICAgICAgICBjb25zdCBtdXRhYmxlU2NoZW1hOiBKc29uRGVjb2RhYmxlU2NoZW1hID0gey4uLm1ldGFkYXRhU2NoZW1hLnNjaGVtYX1cbiAgICAgICAgICAgIGlmICghbXV0YWJsZVNjaGVtYS4kaWQpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHRhcmdldCBuYW1lIGFzIHRoZSBJRFxuICAgICAgICAgICAgICAgIG11dGFibGVTY2hlbWEuJGlkID0gYCMvJHt0YXJnZXQubmFtZX1gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY2hlbWFzLnB1c2gobXV0YWJsZVNjaGVtYSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZsYXR0ZW4gcmVmZXJlbmNlIHNjaGVtYXMuXG4gICAgICAgIC8vIFRoZXNlIGNvdWxkIGJlIGNsYXNzIGRlY2xhcmF0aW9ucyB3aXRoIHNjaGVtYXMgYXR0YWNoZWQgb3Igc2NoZW1hcyB0aGVtc2VsdmVzXG4gICAgICAgIGlmIChtZXRhZGF0YVNjaGVtYS5yZWZlcmVuY2VzICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGFTY2hlbWEucmVmZXJlbmNlcykpIHtcbiAgICAgICAgICAgIG1ldGFkYXRhU2NoZW1hLnJlZmVyZW5jZXMuZm9yRWFjaChyZWZlcmVuY2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghIVJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaCguLi5mbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyhyZWZlcmVuY2UsIHRydWUpKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJyRzY2hlbWEnIGluIHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWFzLnB1c2gocmVmZXJlbmNlIGFzIEpzb25EZWNvZGFibGVTY2hlbWEpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgTWlzc2luZyAnJHNjaGVtYScgZGVjbGFyYXRpb24gaW4gc2NoZW1hIHJlZmVyZW5jZXMgZm9yICR7dGFyZ2V0Lm5hbWV9YClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW51bWVyYXRpb24gdGhlIGRlY29kZXIgbWFwIHRvIGF1dG9tYXRpY2FsbHkgaW5qZWN0IHNjaGVtYSByZWZlcmVuY2VzXG4gICAgICAgIGNvbnN0IGRlY29kZXJNYXAgPSBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2Rlck1hcCwgdGFyZ2V0KSBhcyBEZWNvZGVyTWFwIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChkZWNvZGVyTWFwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoZGVjb2Rlck1hcCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXBFbnR5ID0gUmVmbGVjdC5nZXQoZGVjb2Rlck1hcCwga2V5KVxuICAgICAgICAgICAgICAgIGlmIChtYXBFbnR5ICYmIG1hcEVudHkudHlwZSAmJiBSZWZsZWN0Lmhhc01ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgbWFwRW50eS50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWFzLnB1c2goLi4uZmxhdHRlblNjaGVtYVJlZmVyZW5jZXMobWFwRW50eS50eXBlIGFzIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LCB0cnVlKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2NoZW1hc1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSB2YWx1ZSBmcm9tIGEganNvbiBvYmplY3QgYmFzZWQgb24gYSBKU09OIHBvaW50ZXIgcGF0aFxuICpcbiAqIEBwYXJhbSBwb2ludGVyIC0gcG9pbnRlciBwYXRoXG4gKiBAcGFyYW0ganNvbiAtIHNvdXJjZSBKU09OIG9iamVjdFxuICogQHJldHVybnMgYSB2YWx1ZSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAqL1xuZnVuY3Rpb24gdmFsdWVGcm9tSnNvblBvaW50ZXIocG9pbnRlcjogc3RyaW5nLCBqc29uOiBKc29uT2JqZWN0KTogYW55IHtcbiAgICBjb25zdCBrZXlzID0gcG9pbnRlci5zcGxpdCgnLycpLmZpbHRlcihwYXJ0ID0+ICEhcGFydClcblxuICAgIGxldCB2YWx1ZSA9IGpzb25cbiAgICB3aGlsZSAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXMuc2hpZnQoKSFcbiAgICAgICAgaWYgKCEoa2V5IGluIHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtrZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQ29udmVydHMgYSBKU09OIHBvaW50ZXIgcGF0aCB0byBhIGtleSBwYXRoIHRoYXQgaXMgbW9yZSBodW1hbiBmcmllbmRseVxuICpcbiAqIEBwYXJhbSBwb2ludGVyIC0gcG9pbnRlciBwYXRoXG4gKiBAcGFyYW0gb3RoZXJLZXlzIC0gb3RoZXIga2V5cyB0byBhcHBlbmQgdG8gdGhlIHJlc3VsdCBrZXkgcGF0aFxuICogQHJldHVybnMgSlNPTiBrZXkgcGF0aFxuICovXG5mdW5jdGlvbiBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgocG9pbnRlcjogc3RyaW5nLCAuLi5vdGhlcktleXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJ0cyA9IHBvaW50ZXIuc3BsaXQoJy8nKS5maWx0ZXIocGFydCA9PiAhIXBhcnQpXG4gICAgaWYgKG90aGVyS2V5cyAmJiBvdGhlcktleXMubGVuZ3RoID4gMCkge1xuICAgICAgICBwYXJ0cy5wdXNoKC4uLm90aGVyS2V5cylcbiAgICB9XG5cbiAgICBsZXQgZG90UGF0aCA9ICcnXG4gICAgd2hpbGUgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzLnNoaWZ0KCkhXG4gICAgICAgIGlmICgvXlswLTldKyQvLnRlc3QocGFydCkpIHtcbiAgICAgICAgICAgIGRvdFBhdGggKz0gYFske3BhcnR9XWBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkb3RQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBkb3RQYXRoICs9ICcuJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG90UGF0aCArPSBwYXJ0XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZG90UGF0aFxufSJdfQ==