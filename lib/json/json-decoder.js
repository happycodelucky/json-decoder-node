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
            decodeObject[contextKey] = object;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsNEJBQXlCO0FBRXpCLDJCQUEwQjtBQUUxQix3Q0FBdUM7QUFJdkMsMEVBQThGO0FBQzlGLDBFQUF3SDtBQUN4SCx3REFBeUY7QUFHekYsNERBQTJGO0FBRzNGLCtEQUFrRTtBQUVsRSxpREFBd0Q7QUFDeEQscUVBQStGO0FBQy9GLHFFQUFtSDtBQU1uSDtJQU9JLE1BQU0sQ0FBQyxNQUFNLENBQW1CLGNBQW1DLEVBQUUsU0FBa0M7UUFDbkcsSUFBSSxjQUFjLEtBQUssSUFBSSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUdELElBQUksTUFBYyxDQUFBO1FBQ2xCLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBRXBDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBQyxDQUFBO1NBQ3RDO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUU1RSxNQUFNLEdBQUcsY0FBYyxDQUFBO1NBQzFCO2FBQU07WUFDSCxNQUFNLElBQUksU0FBUyxDQUFDLGdEQUFnRCxDQUFDLENBQUE7U0FDeEU7UUFFRCxJQUFJLFlBQVksQ0FBQTtRQUdoQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLDBDQUFtQixDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQTtRQUN4RixJQUFJLGFBQWEsRUFBRTtZQUNmLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQTtZQUdwRCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE9BQU8sSUFBSSxDQUFBO2FBQ2Q7WUFHRCxJQUFJLFlBQVksS0FBSyxTQUFTLEVBQUU7Z0JBQzVCLFNBQVMsR0FBRyxZQUFZLENBQUMsV0FBVyxDQUFBO2FBQ3ZDO1NBQ0o7UUFDRCxJQUFJLENBQUMsWUFBWSxFQUFFO1lBQ2YsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxTQUFTLENBQXFDLENBQUE7WUFDM0gsSUFBSSxPQUFPLElBQUksT0FBTyxDQUFDLGNBQWMsRUFBRTtnQkFDbkMsTUFBTSxhQUFhLEdBQUcsU0FBOEIsQ0FBQTtnQkFDcEQsWUFBWSxHQUFHLElBQUksYUFBYSxFQUFFLENBQUE7YUFDckM7aUJBQU07Z0JBRUgsWUFBWSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBTSxDQUFBO2FBQ3pEO1NBQ0o7UUFJRCxtQkFBbUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFHdEMsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxPQUFPLEVBQUUsU0FBUyxDQUFDLENBQUE7UUFDbEYsSUFBSSxVQUFVLEVBQUU7WUFDWixZQUFZLENBQUMsVUFBVSxDQUFDLEdBQUcsTUFBTSxDQUFBO1NBQ3BDO1FBR0QsTUFBTSxpQkFBaUIsR0FBOEIsRUFBRSxDQUFBO1FBQ3ZELElBQUksU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLENBQUE7UUFDbkMsT0FBTyxTQUFTLEtBQUssTUFBTSxDQUFDLFNBQVMsRUFBRTtZQUNuQyxJQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLFNBQVMsRUFBRSxTQUFTLENBQUMsV0FBVyxDQUFDLEVBQUU7Z0JBQ2hGLGlCQUFpQixDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsV0FBVyxDQUFDLENBQUE7YUFDbkQ7WUFDRCxTQUFTLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQTtTQUNoRDtRQUdELEtBQUssTUFBTSxXQUFXLElBQUksaUJBQWlCLEVBQUU7WUFFekMsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFBO1lBQzFGLElBQUksT0FBTyxFQUFFO2dCQUNULE1BQU0sdUJBQXVCLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7Z0JBRWxFLElBQUksdUJBQXVCLEtBQUssSUFBSSxFQUFFO29CQUNsQyxPQUFPLElBQUksQ0FBQTtpQkFDZDthQUNKO1lBR0QsTUFBTSxVQUFVLEdBQUcsaUNBQW1CLENBQUMsV0FBVyxDQUFDLENBQUE7WUFDbkQsS0FBSyxNQUFNLEdBQUcsSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxFQUFFO2dCQUMzQyxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQW9CLENBQUE7Z0JBQ2hFLE1BQU0sS0FBSyxHQUFHLHFCQUFxQixDQUFDLE1BQU0sRUFBRSxRQUFRLEVBQUUsWUFBWSxDQUFDLENBQUE7Z0JBQ25FLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtvQkFDckIsWUFBWSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtpQkFDNUI7YUFDSjtTQUNKO1FBSUQsS0FBSyxNQUFNLFdBQVcsSUFBSSxpQkFBaUIsRUFBRTtZQUN6QyxNQUFNLGlCQUFpQixHQUFtQyxPQUFPLENBQUMsY0FBYyxDQUM1RSwwQ0FBbUIsQ0FBQyxnQkFBZ0IsRUFDcEMsV0FBVyxDQUNkLENBQUE7WUFDRCxJQUFJLGlCQUFpQixFQUFFO2dCQUNuQixLQUFLLE1BQU0sUUFBUSxJQUFJLGlCQUFpQixDQUFDLE1BQU0sRUFBRSxFQUFFO29CQUMvQyxLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTt3QkFDNUIsTUFBTSxLQUFLLEdBQUcscUJBQXFCLENBQy9CLE1BQU0sRUFDTjs0QkFDSSxHQUFHLEVBQUUsT0FBTyxDQUFDLEdBQUc7NEJBQ2hCLElBQUksRUFBRSxPQUFPLENBQUMsSUFBSTt5QkFDckIsRUFDRCxZQUFZLENBQ2YsQ0FBQTt3QkFDRCxJQUFJLEtBQUssS0FBSyxTQUFTLEVBQUU7NEJBRXJCLE9BQU8sQ0FBQyxXQUFZLENBQUMsSUFBSSxDQUFDLFlBQVksRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLENBQUE7eUJBQ3pEO3FCQUNKO2lCQUNKO2FBQ0o7U0FDSjtRQUlELEtBQUssTUFBTSxXQUFXLElBQUksaUJBQWlCLEVBQUU7WUFFekMsTUFBTSxlQUFlLEdBQUcsT0FBTyxDQUFDLGNBQWMsQ0FBQywwQ0FBbUIsQ0FBQyxnQkFBZ0IsRUFBRSxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUE7WUFDM0csSUFBSSxlQUFlLEVBQUU7Z0JBQ2pCLElBQUk7b0JBQ0EsTUFBTSxjQUFjLEdBQVEsZUFBZSxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUE7b0JBRXRFLElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssS0FBSyxFQUFFO3dCQUNyRCxPQUFPLElBQUksQ0FBQTtxQkFDZDtvQkFFRCxJQUFJLGNBQWMsSUFBSSxjQUFjLEtBQUssWUFBWSxFQUFFO3dCQUNuRCxZQUFZLEdBQUcsY0FBYyxDQUFBO3FCQUNoQztpQkFDSjtnQkFBQyxPQUFPLEdBQUcsRUFBRTtvQkFDVixJQUFJLEdBQUcsWUFBWSw0Q0FBbUIsRUFBRTt3QkFDcEMsTUFBTSxlQUFlLEdBQUcsSUFBSSxnREFBMEIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxvQ0FBb0MsQ0FBQyxDQUFBO3dCQUMzRyxNQUFNLGVBQWUsQ0FBQTtxQkFDeEI7b0JBRUQsTUFBTSxHQUFHLENBQUE7aUJBQ1o7YUFDSjtTQUNKO1FBRUQsT0FBTyxZQUFZLENBQUE7SUFDdkIsQ0FBQztJQVFELE1BQU0sQ0FBQyxXQUFXLENBQ2QsY0FBcUMsRUFDckMsU0FBa0M7UUFFbEMsSUFBSSxjQUFjLEtBQUssSUFBSSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUVELElBQUksT0FBaUIsQ0FBQTtRQUNyQixJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUNwQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQUMsQ0FBQTtTQUN2QzthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRTtZQUN0QyxPQUFPLEdBQUcsY0FBYyxDQUFBO1NBQzNCO2FBQU07WUFDSCxNQUFNLElBQUksU0FBUyxDQUFDLDBEQUEwRCxDQUFDLENBQUE7U0FDbEY7UUFFRCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQVcsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUksTUFBTSxFQUFFLFNBQVMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFRLENBQUE7SUFDbkgsQ0FBQztDQUNKO0FBakxELGtDQWlMQztBQVlELDBCQUEwQixJQUFpRTtJQUd2RixJQUFJLDBEQUFtQyxDQUFDLElBQUksQ0FBQyxFQUFFO1FBQzNDLElBQUksb0JBQThELENBQUE7UUFDbEUsSUFBSSxPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDeEUsb0JBQW9CLEdBQUcsQ0FBQyxLQUFVLEVBQUUsY0FBbUMsRUFBRSxNQUFnQixFQUFFLEVBQUU7Z0JBQ3pGLElBQUksT0FBTyxLQUFLLEtBQUssU0FBUzt1QkFDdkIsT0FBTyxLQUFLLEtBQUssUUFBUTt1QkFDekIsT0FBTyxLQUFLLEtBQUssUUFBUTt1QkFDekIsQ0FBQyxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksS0FBSyxLQUFLLElBQUksQ0FBQyxFQUFFO29CQUNsRCxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQTtpQkFDcEQ7Z0JBQ0QsSUFBSSxNQUFNLEVBQUU7b0JBQ1IsTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLE9BQU8sS0FBSywyQkFBMkIsSUFBSSxDQUFDLFVBQVUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO2lCQUN4RjtnQkFFRCxPQUFPLFNBQVMsQ0FBQTtZQUNwQixDQUFDLENBQUE7U0FDSjthQUFNO1lBQ0gsb0JBQW9CLEdBQUcseUNBQTJCLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFBO1NBQ3RFO1FBRUQsSUFBSSxDQUFDLG9CQUFvQixFQUFFO1lBQ3ZCLE9BQU8sU0FBUyxDQUFDO1NBQ3BCO1FBRUQsSUFBSSxpQkFBaUIsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7UUFHdEQsSUFBSSxDQUFDLGlCQUFpQixJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsMENBQW1CLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsRUFBRTtZQUN4RixpQkFBaUIsR0FBRyxDQUFDLEtBQVUsRUFBRSxNQUFnQixFQUFFLEVBQUU7Z0JBQ2pELE9BQU8sV0FBVyxDQUFDLE1BQU0sQ0FBYyxLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQWtDLENBQUMsQ0FBQTtZQUMxRixDQUFDLENBQUE7U0FDSjtRQUVELE9BQU8sQ0FBQyxLQUFVLEVBQUUsTUFBZ0IsRUFBRSxFQUFFO1lBQ3BDLE9BQU8sb0JBQXFCLENBQUMsS0FBSyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBQ2xFLENBQUMsQ0FBQTtLQUNKO1NBQU0sSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLDBDQUFtQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRTtRQUNqRSxPQUFPLENBQUMsS0FBVSxFQUFFLE1BQWdCLEVBQUUsRUFBRTtZQUNwQyxPQUFPLFdBQVcsQ0FBQyxNQUFNLENBQWMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO1FBQ3ZELENBQUMsQ0FBQTtLQUNKO0lBRUQsT0FBTywrQkFBaUIsQ0FBQyxJQUFJLENBQUMsQ0FBQTtBQUNsQyxDQUFDO0FBYUQsK0JBQ0ksTUFBYyxFQUNkLFFBQXlCLEVBQ3pCLFlBQW9CLEVBQ3BCLFNBQWtCLEtBQUs7SUFFdkIsSUFBSSxDQUFDLE1BQU0sRUFBRTtRQUNULE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBQ0QsSUFBSSxDQUFDLFFBQVEsRUFBRTtRQUNYLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBR0QsSUFBSSxlQUFnQyxDQUFBO0lBQ3BDLElBQUksT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFFO1FBQzlCLGVBQWUsR0FBRztZQUNkLEdBQUcsRUFBRSxRQUFRO1NBQ2hCLENBQUE7S0FDSjtTQUFNO1FBQ0gsZUFBZSxHQUFHLFFBQVEsQ0FBQTtLQUM3QjtJQUdELE1BQU0sUUFBUSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO0lBQ2xELElBQUksS0FBSyxHQUFRLE1BQU0sQ0FBQTtJQUN2QixHQUFHO1FBQ0MsTUFBTSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQzlCLElBQUksQ0FBQyxJQUFJLEVBQUU7WUFDUCxTQUFRO1NBQ1g7UUFHRCxJQUFJLE9BQU8sS0FBSyxLQUFLLFFBQVEsSUFBSSxPQUFPLEtBQUssS0FBSyxRQUFRLElBQUksQ0FBQyxLQUFLLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO1lBRWpGLE9BQU8sU0FBUyxDQUFBO1NBQ25CO1FBQ0QsS0FBSyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFBO0tBQ25DLFFBQVEsUUFBUSxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFDO0lBR3RFLElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtRQUNyQixPQUFPLFNBQVMsQ0FBQTtLQUNuQjtJQUdELElBQUksZUFBZSxDQUFDLElBQUksRUFBRTtRQUN0QixNQUFNLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLENBQUE7UUFDekQsSUFBSSxVQUFVLEVBQUU7WUFDWixLQUFLLEdBQUcsVUFBVSxDQUFDLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtTQUNwQzthQUFNO1lBQ0gsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsTUFBTSxRQUFRLEdBQ1YsMERBQW1DLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQTtnQkFDdEgsTUFBTSxJQUFJLFNBQVMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLCtCQUErQixDQUFDLENBQUE7YUFDdkU7WUFFRCxPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUdELElBQUksS0FBSyxLQUFLLFNBQVMsRUFBRTtZQUNyQixPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELElBQUksZUFBZSxDQUFDLFdBQVcsRUFBRTtZQUM3QixLQUFLLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsWUFBWSxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsQ0FBQTtTQUN4RTtLQUNKO0lBRUQsT0FBTyxLQUFLLENBQUE7QUFDaEIsQ0FBQztBQVVELDZCQUE2QixNQUErQixFQUFFLElBQWdCO0lBRTFFLElBQUksQ0FBQyxPQUFPLENBQUMsV0FBVyxDQUFDLHNDQUF1QixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsRUFBRTtRQUM5RCxPQUFPLElBQUksQ0FBQTtLQUNkO0lBR0QsSUFBSSxTQUFTLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxlQUFlLEVBQUUsTUFBTSxDQUFpQyxDQUFBO0lBRXBILElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDWixTQUFTLEdBQUcscUJBQXFCLENBQUMsTUFBTSxDQUFDLENBQUE7UUFDekMsSUFBSSxTQUFTLEVBQUU7WUFDWCxPQUFPLENBQUMsY0FBYyxDQUFDLHNDQUF1QixDQUFDLGVBQWUsRUFBRSxTQUFTLEVBQUUsTUFBTSxDQUFDLENBQUE7U0FDckY7S0FDSjtJQUdELElBQUksQ0FBQyxTQUFTLEVBQUU7UUFDWixPQUFPLElBQUksQ0FBQTtLQUNkO0lBR0QsTUFBTSxlQUFlLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZDLElBQUksT0FBTyxlQUFlLEtBQUssU0FBUyxFQUFFO1FBQ3RDLElBQUksQ0FBQyxlQUFlLEVBQUU7WUFFbEIsTUFBTSxNQUFNLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQTtZQUMvQixNQUFNLGdCQUFnQixHQUEwQixFQUFFLENBQUE7WUFDbEQsSUFBSSxNQUFNLEVBQUU7Z0JBQ1IsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQWtCLEVBQUUsRUFBRTtvQkFDOUIsSUFBSSxRQUFRLEdBQTRCLEtBQUssQ0FBQTtvQkFHN0MsSUFBSSxvQkFBNEIsQ0FBQTtvQkFDaEMsSUFBSSxZQUFvQixDQUFBO29CQUN4QixJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQTtvQkFDOUIsSUFBSSxLQUFLLENBQUMsT0FBTyxLQUFLLGNBQWMsRUFBRTt3QkFDbEMsTUFBTSxNQUFNLEdBQVEsS0FBSyxDQUFDLE1BQU0sQ0FBQTt3QkFHaEMsSUFBSSxRQUFRLElBQUksTUFBTSxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTs0QkFDaEYsUUFBUSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUE7NEJBQzNCLFlBQVksR0FBRywyQkFBMkIsQ0FBQyxRQUFTLENBQUMsUUFBUSxDQUFDLENBQUE7NEJBQzlELG9CQUFvQixHQUFHLEtBQUssQ0FBQyxPQUFRLENBQUE7NEJBR3JDLGtCQUFrQixHQUFHLElBQUksQ0FBQTt5QkFDNUI7NkJBQU07NEJBQ0gsUUFBUSxHQUFHLFNBQVMsQ0FBQTs0QkFDcEIsWUFBWSxHQUFHLEtBQUssQ0FBQTs0QkFDcEIsb0JBQW9CLEdBQUcsS0FBSyxDQUFDLE9BQVEsQ0FBQTt5QkFDeEM7cUJBQ0o7eUJBQU07d0JBQ0gsWUFBWSxHQUFHLDJCQUEyQixDQUFDLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQTt3QkFDMUQsb0JBQW9CLEdBQUcsWUFBWTs0QkFDL0IsQ0FBQyxDQUFDLElBQUksWUFBWSxLQUFLLEtBQUssQ0FBQyxPQUFPLEVBQUU7NEJBQ3RDLENBQUMsQ0FBQyxvQkFBb0IsR0FBRyxVQUFVLEtBQUssQ0FBQyxPQUFPLEVBQUUsQ0FBQTtxQkFDekQ7b0JBRUQsSUFBSSxRQUFRLEVBQUU7d0JBR1YsTUFBTSxXQUFXLEdBQVUsRUFBRSxDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsTUFBYSxDQUFDLENBQUE7d0JBQzVELFdBQVcsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7NEJBQzdCLElBQUksQ0FBQyxRQUFRLEVBQUU7Z0NBQ1gsT0FBTTs2QkFDVDs0QkFFRCxJQUFJLFFBQVEsQ0FBQyxPQUFPLEtBQUssY0FBYyxFQUFFO2dDQUVyQyxZQUFZLEdBQUcsWUFBWSxDQUFDLENBQUMsQ0FBQyxHQUFHLFlBQVksSUFBSSxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUE7NkJBQy9GOzRCQUdELFVBQVUsQ0FBQyxZQUFZLEdBQUcsWUFBWSxDQUFBOzRCQUV0QyxJQUFJLFlBQVksR0FBRyxNQUFNLENBQUMsb0JBQW9CLENBQUMsQ0FBQTs0QkFDL0MsSUFBSSxrQkFBa0IsRUFBRTtnQ0FDcEIsTUFBTSxhQUFhLEdBQUcsd0JBQXdCLENBQUE7Z0NBQzlDLElBQUksS0FBSyxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUE7Z0NBQzVDLE9BQU8sS0FBSyxFQUFFO29DQUNWLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQTtvQ0FDekIsSUFBSSxRQUFRLElBQUksVUFBVSxFQUFFO3dDQUN4QixJQUFJLEtBQUssQ0FBQTt3Q0FDVCxJQUFJLFFBQVEsS0FBSyxjQUFjLEVBQUU7NENBRTdCLElBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEVBQUU7Z0RBQ3ZCLEtBQUssR0FBRyxRQUFRLENBQUE7NkNBQ25CO3lDQUNKO3dDQUNELElBQUksQ0FBQyxLQUFLLEVBQUU7NENBRVIsS0FBSyxHQUFHLElBQUksVUFBVSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUE7eUNBQ3RDO3dDQUNELFlBQVksR0FBRyxHQUFHLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTs0Q0FDdEQsR0FBRyxLQUFLLEVBQUU7NENBQ1YsR0FBRyxZQUFZLENBQUMsS0FBSyxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUFBO3FDQUNuRDtvQ0FFRCxLQUFLLEdBQUcsYUFBYSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQTtpQ0FDM0M7NkJBQ0o7NEJBRUQsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLFVBQVUsSUFBSSxRQUFRLENBQUMsT0FBTyxLQUFLLGNBQWMsRUFBRTtnQ0FDeEUsZ0JBQWdCLENBQUMsSUFBSSxDQUNqQixJQUFJLDBEQUFpQyxDQUNqQyxZQUFZLEVBQ1gsVUFBNkIsQ0FBQyxlQUFlLEVBQzlDLFlBQVksQ0FBQyxDQUFDLENBQUE7NkJBQ3pCO2lDQUFLLElBQUksUUFBUSxDQUFDLE9BQU8sS0FBSyxzQkFBc0IsRUFBRTtnQ0FDbkQsZ0JBQWdCLENBQUMsSUFBSSxDQUNqQixJQUFJLDhEQUFxQyxDQUNyQyxZQUFZLEVBRVgsVUFBeUMsQ0FBQyxrQkFBa0IsRUFDN0QsWUFBWSxDQUFDLENBQUMsQ0FBQTs2QkFDekI7aUNBQU07Z0NBQ0gsZ0JBQWdCLENBQUMsSUFBSSxDQUNqQixJQUFJLHdEQUErQixDQUMvQixZQUFZLEVBQ1osb0JBQW9CLENBQUMsUUFBUyxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFDOUMsWUFBWSxDQUFDLENBQUMsQ0FBQTs2QkFDekI7d0JBQ0wsQ0FBQyxDQUFDLENBQUE7cUJBQ0w7Z0JBQ0wsQ0FBQyxDQUFDLENBQUE7YUFDTDtZQUdELE1BQU0sSUFBSSxnREFBMEIsQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsQ0FBQTtTQUMvRDtLQUNKO1NBQU07UUFDSCxNQUFNLFNBQVMsQ0FBQyx1Q0FBdUMsQ0FBQyxDQUFBO0tBQzNEO0lBRUQsT0FBTyxJQUFJLENBQUE7QUFDZixDQUFDO0FBUUQsK0JBQStCLE1BQStCO0lBQzFELE1BQU0sY0FBYyxHQUE4QixPQUFPLENBQUMsV0FBVyxDQUFDLHNDQUF1QixDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUM3RyxJQUFJLENBQUMsY0FBYyxFQUFFO1FBQ2pCLE9BQU8sU0FBUyxDQUFBO0tBQ25CO0lBR0QsTUFBTSxjQUFjLEdBQUcsR0FBRyxDQUFDO1FBQ3ZCLFNBQVMsRUFBRSxJQUFJO1FBQ2YsS0FBSyxFQUFFLEtBQUs7UUFDWixPQUFPLEVBQUUsSUFBSTtRQUNiLE1BQU0sRUFBRSxNQUFNO1FBQ2QsWUFBWSxFQUFFLElBQUk7S0FDckIsQ0FBQyxDQUFBO0lBQ0YsU0FBUyxDQUFDLGNBQWMsQ0FBQyxDQUFBO0lBR3pCLE1BQU0sZ0JBQWdCLEdBQUcsdUJBQXVCLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLFNBQVMsRUFBRSxFQUFFO1FBQ2xGLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFJLENBQUMsRUFBRTtZQUM3QixNQUFNLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUFJLEVBQUUsU0FBUyxDQUFDLENBQUE7U0FDeEM7UUFFRCxPQUFPLE1BQU0sQ0FBQTtJQUNqQixDQUFDLEVBQUUsSUFBSSxHQUFHLEVBQStCLENBQUMsQ0FBQTtJQUcxQyxLQUFLLE1BQU0sZUFBZSxJQUFJLGdCQUFnQixDQUFDLE1BQU0sRUFBRSxFQUFFO1FBQ3JELGNBQWMsQ0FBQyxTQUFTLENBQUMsZUFBZSxDQUFDLENBQUE7S0FDNUM7SUFDRCxNQUFNLFNBQVMsR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUUvRCxPQUFPLFNBQVMsQ0FBQTtBQUNwQixDQUFDO0FBU0QsaUNBQ0ksTUFBcUQsRUFDckQsb0JBQTZCLEtBQUs7SUFFbEMsTUFBTSxPQUFPLEdBQTBCLEVBQUUsQ0FBQTtJQUV6QyxNQUFNLGNBQWMsR0FBOEIsT0FBTyxDQUFDLFdBQVcsQ0FBQyxzQ0FBdUIsQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7SUFDN0csSUFBSSxjQUFjLEVBQUU7UUFDaEIsSUFBSSxDQUFDLENBQUMsU0FBUyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUN2QyxNQUFNLElBQUksU0FBUyxDQUFDLG9DQUFvQyxNQUFNLENBQUMsSUFBSSxJQUFJLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxDQUFBO1NBQzlGO1FBRUQsSUFBSSxpQkFBaUIsRUFBRTtZQUNuQixNQUFNLGFBQWEscUJBQTRCLGNBQWMsQ0FBQyxNQUFNLENBQUMsQ0FBQTtZQUNyRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsRUFBRTtnQkFFcEIsYUFBYSxDQUFDLEdBQUcsR0FBRyxLQUFLLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQTthQUN6QztZQUNELE9BQU8sQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLENBQUE7U0FDOUI7UUFJRCxJQUFJLGNBQWMsQ0FBQyxVQUFVLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEVBQUU7WUFDdkUsY0FBYyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLEVBQUU7Z0JBQzFDLElBQUksQ0FBQyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsc0NBQXVCLENBQUMsTUFBTSxFQUFFLFNBQVMsQ0FBQyxFQUFFO29CQUNsRSxPQUFPLENBQUMsSUFBSSxDQUFDLEdBQUcsdUJBQXVCLENBQUMsU0FBUyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7aUJBQzVEO3FCQUFNLElBQUksU0FBUyxJQUFJLFNBQVMsRUFBRTtvQkFDL0IsT0FBTyxDQUFDLElBQUksQ0FBQyxTQUFnQyxDQUFDLENBQUE7aUJBQ2pEO3FCQUFNO29CQUNILE1BQU0sSUFBSSxTQUFTLENBQUMsMERBQTBELE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFBO2lCQUMvRjtZQUNMLENBQUMsQ0FBQyxDQUFBO1NBQ0w7UUFHRCxNQUFNLFVBQVUsR0FBRyxPQUFPLENBQUMsV0FBVyxDQUFDLDBDQUFtQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQTJCLENBQUE7UUFDeEcsSUFBSSxVQUFVLEVBQUU7WUFDWixLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEVBQUU7Z0JBQzNDLE1BQU0sT0FBTyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFLEdBQUcsQ0FBQyxDQUFBO2dCQUM1QyxJQUFJLE9BQU8sSUFBSSxPQUFPLENBQUMsSUFBSSxJQUFJLE9BQU8sQ0FBQyxXQUFXLENBQUMsc0NBQXVCLENBQUMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtvQkFDOUYsT0FBTyxDQUFDLElBQUksQ0FBQyxHQUFHLHVCQUF1QixDQUFDLE9BQU8sQ0FBQyxJQUErQixFQUFFLElBQUksQ0FBQyxDQUFDLENBQUE7aUJBQzFGO2FBQ0o7U0FDSjtLQUNKO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQztBQVNELDhCQUE4QixPQUFlLEVBQUUsSUFBZ0I7SUFDM0QsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUE7SUFFdEQsSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFBO0lBQ2hCLE9BQU8sSUFBSSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7UUFDcEIsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRyxDQUFBO1FBQ3pCLElBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNqQixPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDckI7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNoQixDQUFDO0FBU0QscUNBQXFDLE9BQWUsRUFBRSxHQUFHLFNBQW1CO0lBQ3hFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZELElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQTtLQUMzQjtJQUVELElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUNoQixPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUcsQ0FBQTtRQUMzQixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsT0FBTyxJQUFJLElBQUksSUFBSSxHQUFHLENBQUE7U0FDekI7YUFBTTtZQUNILElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3BCLE9BQU8sSUFBSSxHQUFHLENBQUE7YUFDakI7WUFDRCxPQUFPLElBQUksSUFBSSxDQUFBO1NBQ2xCO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBKU09OIHNwZWNpZmljIGRlY29kZXIgYW5kIGRlY29yYXRvcnNcbiAqL1xuXG5pbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnXG5cbmltcG9ydCAqIGFzIGFqdiBmcm9tICdhanYnXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgKiBhcyBhanZFcnJvcnMgZnJvbSAnYWp2LWVycm9ycydcblxuaW1wb3J0IHsgQWRkaXRpb25hbFByb3BlcnRpZXNQYXJhbXMsIEVycm9yT2JqZWN0LCBSZXF1aXJlZFBhcmFtcywgVmFsaWRhdGVGdW5jdGlvbiB9IGZyb20gJ2FqdidcblxuaW1wb3J0IHsgRGVjb2Rlck1ldGFkYXRhS2V5cywgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItZGVjbGFyYXRpb25zJ1xuaW1wb3J0IHsgRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0LCBpc0RlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCB9IGZyb20gJy4uL2RlY29kZXIvZGVjb2Rlci1kZWNsYXJhdGlvbnMnXG5pbXBvcnQgeyBEZWNvZGVyTWFwLCBEZWNvZGVyTWFwRW50cnksIGRlY29kZXJNYXBGb3JUYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItbWFwJ1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uTWFyc2hhbGxlckZ1bmN0aW9uLCBNYXJzaGFsbGVyRnVuY3Rpb24gfSBmcm9tICcuLi9tYXJzaGFsbGVycy9tYXJzaGFsbGVycydcbmltcG9ydCB7IGNvbGxlY3Rpb25NYXJzaGFsbGVyRm9yVHlwZSwgbWFyc2hhbGxlckZvclR5cGUgfSBmcm9tICcuLi9tYXJzaGFsbGVycy9tYXJzaGFsbGVycydcblxuaW1wb3J0IHsgSnNvbk9iamVjdCB9IGZyb20gJy4vanNvbi1kZWNvZGFibGUtdHlwZXMnXG5pbXBvcnQgeyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4vanNvbi1kZWNvZGVyLWVycm9ycydcbmltcG9ydCB7IEpzb25EZWNvZGFibGVPcHRpb25zLCBKc29uRGVjb2RhYmxlU2NoZW1hLCBKc29uRGVjb2RlclNjaGVtYU1ldGFkYXRhIH0gZnJvbSAnLi9qc29uLWRlY29yYXRvcnMnXG5pbXBvcnQgeyBKc29uRGVjb2Rlck1ldGFkYXRhS2V5cyB9IGZyb20gJy4vanNvbi1zeW1ib2xzJ1xuaW1wb3J0IHsgSnNvblZhbGlkYXRpb25FcnJvciwgSnNvblZhbGlkYXRvclByb3BlcnR5VmFsdWVFcnJvciB9IGZyb20gJy4vanNvbi12YWxpZGF0aW9uLWVycm9ycydcbmltcG9ydCB7IEpzb25WYWxpZGF0b3JQcm9wZXJ0eU1pc3NpbmdFcnJvciwgSnNvblZhbGlkYXRvclByb3BlcnR5VW5zdXBwb3J0ZWRFcnJvciB9IGZyb20gJy4vanNvbi12YWxpZGF0aW9uLWVycm9ycydcblxuLyoqXG4gKiBKU09OIGRlY29kZXIgZm9yIEpTT04gZGVjb2RhYmxlIGNsYXNzZXNcbiAqL1xuLy8gdHNsaW50OmRpc2FibGU6bm8tdW5uZWNlc3NhcnktY2xhc3NcbmV4cG9ydCBjbGFzcyBKc29uRGVjb2RlciB7XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhIEpTT04gb2JqZWN0IG9yIFN0cmluZyByZXR1cm5pbmcgYmFjayB0aGUgb2JqZWN0IGlmIGl0IHdhcyBhYmxlIHRvIGJlIGRlY29kZWRcbiAgICAgKiBAcGFyYW0gb2JqZWN0T3JTdHJpbmcgLSBhcnJheSBvciBzdHJpbmcgKGNvbnRhaW4gSlNPTiBvYmplY3QpIHRvIGRlY29kZVxuICAgICAqIEBwYXJhbSBjbGFzc1R5cGUgLSBkZWNvZGFibGUgdHlwZSB0byBkZWNvZGUgSlNPTiBpbnRvXG4gICAgICogQHJldHVybiBhIGRlY29kZWQgb2JqZWN0IG9mIGBjbGFzc1R5cGVgXG4gICAgICovXG4gICAgc3RhdGljIGRlY29kZTxUIGV4dGVuZHMgb2JqZWN0PihvYmplY3RPclN0cmluZzogc3RyaW5nIHwgSnNvbk9iamVjdCwgY2xhc3NUeXBlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCk6IFQgfCBudWxsIHtcbiAgICAgICAgaWYgKG9iamVjdE9yU3RyaW5nID09PSBudWxsIHx8IG9iamVjdE9yU3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHRyYWN0IG91ciBKU09OIG9iamVjdFxuICAgICAgICBsZXQgb2JqZWN0OiBvYmplY3RcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RPclN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIHRoZSBKU09OIGhhcyBhIHN5bnRheCBlcnJvclxuICAgICAgICAgICAgb2JqZWN0ID0gSlNPTi5wYXJzZShvYmplY3RPclN0cmluZylcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iamVjdE9yU3RyaW5nKSB8fCB0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAvLyBBcnJheXMgYXJlIG9iamVjdHMgdG9vLCBhbmQgY2FuIGJlIHF1ZXJpZWQgd2l0aCBAMC52YWx1ZVxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0T3JTdHJpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RlY29kZShvYmplY3QpIHNob3VsZCBiZSBhbiBPYmplY3Qgb3IgYSBTdHJpbmcnKVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlY29kZU9iamVjdFxuXG4gICAgICAgIC8vIENyZWF0ZSBvdXIgZGVjb2Rpbmcgb2JqZWN0IHVzaW5nIGEgZGVjb2RlciBmdW5jdGlvbiBpZiByZWdpc3RlcmVkXG4gICAgICAgIGNvbnN0IG9iamVjdEZhY3RvcnkgPSBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RlckZhY3RvcnksIGNsYXNzVHlwZSlcbiAgICAgICAgaWYgKG9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgICAgIGRlY29kZU9iamVjdCA9IG9iamVjdEZhY3RvcnkuY2FsbChjbGFzc1R5cGUsIG9iamVjdClcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdpdGggYSBuZXcgb2JqZWN0IGNhbiBjb21lIGEgbmV3IGRlY29kZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NUeXBlID0gZGVjb2RlT2JqZWN0LmNvbnN0cnVjdG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCFkZWNvZGVPYmplY3QpIHtcbiAgICAgICAgICAgIGNvbnN0IG9wdGlvbnMgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlT3B0aW9ucywgY2xhc3NUeXBlKSBhcyBKc29uRGVjb2RhYmxlT3B0aW9ucyB8IHVuZGVmaW5lZFxuICAgICAgICAgICAgaWYgKG9wdGlvbnMgJiYgb3B0aW9ucy51c2VDb25zdHJ1Y3Rvcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cnVjdGFibGUgPSBjbGFzc1R5cGUgYXMgT2JqZWN0Q29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBuZXcgY29uc3RydWN0YWJsZSgpXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBvYmplY3QsIHdpdGhvdXQgY2FsbGluZyB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBPYmplY3QuY3JlYXRlKGNsYXNzVHlwZS5wcm90b3R5cGUpIGFzIFRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoZSBKU09OXG4gICAgICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgbm90IHZhbGlkXG4gICAgICAgIHZhbGlkYXRlZFNvdXJjZUpzb24oY2xhc3NUeXBlLCBvYmplY3QpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBjb250ZXh0IG5lZWRzIHRvIGJlIHNldFxuICAgICAgICBjb25zdCBjb250ZXh0S2V5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5jb250ZXh0LCBjbGFzc1R5cGUpXG4gICAgICAgIGlmIChjb250ZXh0S2V5KSB7XG4gICAgICAgICAgICBkZWNvZGVPYmplY3RbY29udGV4dEtleV0gPSBvYmplY3RcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhbGsgdGhlIHByb3RvdHlwZSBjaGFpbiwgYWRkaW5nIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbnMgaW4gcmV2ZXJzZSBvcmRlclxuICAgICAgICBjb25zdCBjbGFzc0NvbnN0cnVjdG9yczogRGVjb2RlclByb3RvdHlwYWxUYXJnZXRbXSA9IFtdXG4gICAgICAgIGxldCBwcm90b3R5cGUgPSBjbGFzc1R5cGUucHJvdG90eXBlXG4gICAgICAgIHdoaWxlIChwcm90b3R5cGUgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGlmICghIVJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHByb3RvdHlwZS5jb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgICAgICAgICBjbGFzc0NvbnN0cnVjdG9ycy51bnNoaWZ0KHByb3RvdHlwZS5jb25zdHJ1Y3RvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3RvdHlwZSA9IFJlZmxlY3QuZ2V0UHJvdG90eXBlT2YocHJvdG90eXBlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBjbGFzcyBoZWlyYXJjaHlcbiAgICAgICAgZm9yIChjb25zdCBjb25zdHJ1Y3RvciBvZiBjbGFzc0NvbnN0cnVjdG9ycykge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGEgYmVmb3JlIGRlY29kZSBmdW5jdGlvbiBvbiBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uJ3MgcHJvdG90eXBlXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXIsIGNvbnN0cnVjdG9yLnByb3RvdHlwZSlcbiAgICAgICAgICAgIGlmIChkZWNvZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWx0ZXJuYXRpdmVEZWNvZGVPYmplY3QgPSBkZWNvZGVyLmNhbGwoZGVjb2RlT2JqZWN0LCBvYmplY3QpXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgICAgIGlmIChhbHRlcm5hdGl2ZURlY29kZU9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB1cCBkZWNvZGVyIG1hcCBmb3IgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyTWFwID0gZGVjb2Rlck1hcEZvclRhcmdldChjb25zdHJ1Y3RvcilcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhkZWNvZGVyTWFwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcEVudHJ5ID0gUmVmbGVjdC5nZXQoZGVjb2Rlck1hcCwga2V5KSBhcyBEZWNvZGVyTWFwRW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlUHJvcGVydHlWYWx1ZShvYmplY3QsIG1hcEVudHJ5LCBkZWNvZGVPYmplY3QpXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0W2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5IGZvciBwcm90b3R5cGUgZGVjb2RlcnMsIHRoaXMgdGltZSBjYWxsaW5nIGFsbCB0aGUgcHJvcGVydHkgbm90aWZpZXJzXG4gICAgICAgIC8vIFRoaXMgaXMgZG9uZSBhZnRlciBhbGwgbWFwcGVkIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkXG4gICAgICAgIGZvciAoY29uc3QgY29uc3RydWN0b3Igb2YgY2xhc3NDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5Tm90aWZpZXJzOiBNYXA8c3RyaW5nLCBEZWNvZGVyTWFwRW50cnlbXT4gPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFxuICAgICAgICAgICAgICAgIERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2Rlck5vdGlmaWVycyxcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5vdGlmaWVycykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlcnMgb2YgcHJvcGVydHlOb3RpZmllcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlUHJvcGVydHlWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGhhbmRsZXIua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBoYW5kbGVyLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IENhcHR1cmUgZXJyb3JzIGZyb20gaGFuZGxlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLm1hcEZ1bmN0aW9uIS5jYWxsKGRlY29kZU9iamVjdCwgdmFsdWUsIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5IGZvciBwcm90b3R5cGUgZGVjb2RlcnMsIGNhbGxpbmcgdGhlIGRlY29kZXIgY29tcGxldGUgZnVuY3Rpb25cbiAgICAgICAgLy8gVGhpcyBkb25lIGFmdGVyIGFsbCBwb3RlbnRpYWwgYXNzaWdtZW50c1xuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdG9yIG9mIGNsYXNzQ29uc3RydWN0b3JzKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgYSBhZnRlciBkZWNvZGUgcHJvdG90eXBlIGZ1bmN0aW9uXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyQ29tcGxldGUgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RlckNvbXBsZXRlZCwgY29uc3RydWN0b3IucHJvdG90eXBlKVxuICAgICAgICAgICAgaWYgKGRlY29kZXJDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlT2JqZWN0OiBhbnkgPSBkZWNvZGVyQ29tcGxldGUuY2FsbChkZWNvZGVPYmplY3QsIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVPYmplY3QgPT09IG51bGwgfHwgY29tcGxldGVPYmplY3QgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBzd2FwcGVkIGRlY29kZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlT2JqZWN0ICYmIGNvbXBsZXRlT2JqZWN0ICE9PSBkZWNvZGVPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY29kZU9iamVjdCA9IGNvbXBsZXRlT2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEpzb25WYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25FcnJvciA9IG5ldyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvcihbZXJyXSwgb2JqZWN0LCAnSlNPTiB2YWxpZGF0aW9uIGZhaWxlZCBwb3N0IGRlY29kZScpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyB2YWxpZGF0aW9uRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWNvZGVPYmplY3RcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGEgSlNPTiBvYmplY3Qgb3IgU3RyaW5nIHJldHVybmluZyBiYWNrIHRoZSBvYmplY3QgaWYgaXQgd2FzIGFibGUgdG8gYmUgZGVjb2RlZFxuICAgICAqIEBwYXJhbSBvYmplY3RPclN0cmluZyAtIGFycmF5IG9yIHN0cmluZyAoY29udGFpbiBKU09OIGFycmF5KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlIC0gZGVjb2RhYmxlIHR5cGUgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYW4gYXJyYXkgb2YgZGVjb2RlZCBvYmplY3RzIG9mIGBjbGFzc1R5cGVgXG4gICAgICovXG4gICAgc3RhdGljIGRlY29kZUFycmF5PFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgICAgICBvYmplY3RPclN0cmluZzogc3RyaW5nIHwgSnNvbk9iamVjdFtdLFxuICAgICAgICBjbGFzc1R5cGU6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LFxuICAgICk6IFtUXSB8IG51bGwge1xuICAgICAgICBpZiAob2JqZWN0T3JTdHJpbmcgPT09IG51bGwgfHwgb2JqZWN0T3JTdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvYmplY3RzOiBvYmplY3RbXVxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdE9yU3RyaW5nID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb2JqZWN0cyA9IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvYmplY3RPclN0cmluZykpIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBvYmplY3RPclN0cmluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZGVjb2RlKG9iamVjdCkgc2hvdWxkIGJlIGFuIEFycmF5IG9mIE9iamVjdHMgb3IgYSBTdHJpbmcnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9iamVjdHMubWFwPFQgfCBudWxsPigob2JqZWN0KSA9PiB0aGlzLmRlY29kZTxUPihvYmplY3QsIGNsYXNzVHlwZSkpLmZpbHRlcigob2JqZWN0KSA9PiAhIW9iamVjdCkgYXMgW1RdXG4gICAgfVxufVxuXG4vL1xuLy8gUHJpdmF0ZSBmdW5jdGlvbnNcbi8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcnNoYWxsZXIgZm9yIGEgZ2l2ZW4gdHlwZSBkZWNsYXJhdGlvbiB0byB1c2UgZm9yIGNvbnZlcnNpb25cbiAqXG4gKiBAcGFyYW0gdHlwZSAtIGRlc2lyZWQgY29udmVyc2lvbiB0eXBlXG4gKiBAcmV0dXJuIGNvbnZlcnNpb24gZnVuY3Rpb24gb3IgdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU1hcnNoYWxsZXIodHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfCBEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQpOlxuICAgICgodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4gYW55KSB8IHVuZGVmaW5lZFxue1xuICAgIGlmIChpc0RlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCh0eXBlKSkge1xuICAgICAgICBsZXQgY29sbGVjdGlvbk1hcnNoYWxsZXI6IENvbGxlY3Rpb25NYXJzaGFsbGVyRnVuY3Rpb24gfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHR5cGUuY29sbGVjdGlvbikpIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25NYXJzaGFsbGVyID0gKHZhbHVlOiBhbnksIGl0ZW1NYXJoc2FsbGVyPzogTWFyc2hhbGxlckZ1bmN0aW9uLCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB8fCAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZSh2YWx1ZSwgdHlwZS5jb2xsZWN0aW9uKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dHlwZW9mIHZhbHVlfSBjYW5ub3QgYmUgY29udmVydGVkIHRvICR7dHlwZS5jb2xsZWN0aW9uLm5hbWV9YClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uTWFyc2hhbGxlciA9IGNvbGxlY3Rpb25NYXJzaGFsbGVyRm9yVHlwZSh0eXBlLmNvbGxlY3Rpb24pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbGxlY3Rpb25NYXJzaGFsbGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVsZW1lbnRNYXJzaGFsbGVyID0gY3JlYXRlTWFyc2hhbGxlcih0eXBlLmVsZW1lbnQpXG5cbiAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgdHlwZSBpcyBkZWNvZGFibGVcbiAgICAgICAgaWYgKCFlbGVtZW50TWFyc2hhbGxlciAmJiBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCB0eXBlLmVsZW1lbnQpKSB7XG4gICAgICAgICAgICBlbGVtZW50TWFyc2hhbGxlciA9ICh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZTx0eXBlb2YgdHlwZT4odmFsdWUsIHR5cGUuZWxlbWVudCBhcyBEZWNvZGVyUHJvdG90eXBhbFRhcmdldClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25NYXJzaGFsbGVyISh2YWx1ZSwgZWxlbWVudE1hcnNoYWxsZXIsIHN0cmljdClcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZSwgdHlwZSkpIHtcbiAgICAgICAgcmV0dXJuICh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gSnNvbkRlY29kZXIuZGVjb2RlPHR5cGVvZiB0eXBlPih2YWx1ZSwgdHlwZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtYXJzaGFsbGVyRm9yVHlwZSh0eXBlKVxufVxuXG4vKipcbiAqIEV2YWx1YXRlcyBhIHByb3BlcnR5IG9mIGFuIG9iamVjdCAoYmVpbmcgZGVjb2RlZCkgYmFzZWQgb24gYSBtYXAgZW50cnkgZm9yIHRoZSBkZWNvZGVyLlxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBvYmplY3QgYmVpbmcgZGVjb2RlZFxuICogQHBhcmFtIG1hcEVudHJ5IC0gZGVjb2RlciBtYXAgZW50cnlcbiAqIEBwYXJhbSBkZWNvZGVPYmplY3QgLSBvYmplY3QgYmVpbmcgcG9wdWxhdGVkIGJ5IHRoZSBkZWNvZGVyXG4gKiBAcGFyYW0gc3RyaWN0IC0gd2hlbiB0cnVlLCBwYXJzaW5nIGlzIHN0cmljdCBhbmQgdGhyb3dzIGEgVHlwZUVycm9yIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkXG4gKiBAcmV0dXJucyBldmFsdWF0ZWQgcHJvcGVydHkgdmFsdWVcbiAqXG4gKiBAdGhyb3dzIFR5cGVFcnJvclxuICovXG5mdW5jdGlvbiBldmFsdWF0ZVByb3BlcnR5VmFsdWUoXG4gICAgb2JqZWN0OiBvYmplY3QsXG4gICAgbWFwRW50cnk6IERlY29kZXJNYXBFbnRyeSxcbiAgICBkZWNvZGVPYmplY3Q6IG9iamVjdCxcbiAgICBzdHJpY3Q6IGJvb2xlYW4gPSBmYWxzZSxcbik6IGFueSB7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICBpZiAoIW1hcEVudHJ5KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgY29uc2lzdGVudCB1c2Ugb2YgRGVjb2Rlck1hcEVudHJ5XG4gICAgbGV0IGRlY29kZXJNYXBFbnRyeTogRGVjb2Rlck1hcEVudHJ5XG4gICAgaWYgKHR5cGVvZiBtYXBFbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGVjb2Rlck1hcEVudHJ5ID0ge1xuICAgICAgICAgICAga2V5OiBtYXBFbnRyeSxcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlY29kZXJNYXBFbnRyeSA9IG1hcEVudHJ5XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUgcHJvcGVydHkga2V5IHBhdGggaW4gdGhlIEpTT04gb2JqZWN0XG4gICAgY29uc3Qga2V5UGF0aHMgPSBkZWNvZGVyTWFwRW50cnkua2V5LnNwbGl0KC9AfFxcLi8pXG4gICAgbGV0IHZhbHVlOiBhbnkgPSBvYmplY3RcbiAgICBkbyB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBrZXlQYXRocy5zaGlmdCgpIVxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW4gb25seSBpbnNwZWN0IG9iamVjdCB2YWx1ZXMsIGZhaWwgaWYgd2UgY2Fubm90IHJlc29sdmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBUaHJvdyBlcnJvcj9cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IFJlZmxlY3QuZ2V0KHZhbHVlLCBwYXRoKVxuICAgIH0gd2hpbGUgKGtleVBhdGhzLmxlbmd0aCA+IDAgJiYgdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcblxuICAgIC8vIElmIHRoZXJlIGlzIGFuIHVuZGVmaW5lZCB2YWx1ZSByZXR1cm4gaXQgKGRvIG5vdCByZXR1cm4gb24gbnVsbClcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYW55IHR5cGUgY29udmVyc2lvblxuICAgIGlmIChkZWNvZGVyTWFwRW50cnkudHlwZSkge1xuICAgICAgICBjb25zdCBtYXJzaGFsbGVyID0gY3JlYXRlTWFyc2hhbGxlcihkZWNvZGVyTWFwRW50cnkudHlwZSlcbiAgICAgICAgaWYgKG1hcnNoYWxsZXIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWFyc2hhbGxlcih2YWx1ZSwgc3RyaWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RUeXBlID1cbiAgICAgICAgICAgICAgICAgICAgaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQoZGVjb2Rlck1hcEVudHJ5LnR5cGUpID8gZGVjb2Rlck1hcEVudHJ5LnR5cGUuY29sbGVjdGlvbiA6IGRlY29kZXJNYXBFbnRyeS50eXBlXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgJHtyb290VHlwZS5uYW1lfSBpcyBub3QgYSBKU09OIGRlY29kYWJsZSB0eXBlYClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gdmFsdWUsIGl0IHNob3VsZCBiZSBza2lwcGVkXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVjb2Rlck1hcEVudHJ5Lm1hcEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGRlY29kZXJNYXBFbnRyeS5tYXBGdW5jdGlvbi5jYWxsKGRlY29kZU9iamVjdCwgdmFsdWUsIG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIHNjaGVtYSBkZWZpbmVkIG9uIGEgdGFyZ2V0IGFnYWluc3QgdGhlIHNvdXJjZSBKU09OLlxuICogSWYgdGhlIEpTT04gaXMgbm90IHZhbGlkIHRoZW4gYSBKc29uRGVjb2RlclZhbGlkYXRvckVycm9yIGV4Y2VwdGlvbiBpcyB0aHJvd25cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IC0gdGFyZ2V0IGNsYXNzIHRvIHRha2UgZGVmaW5lZCBzY2hlbWEgZnJvbVxuICogQHBhcmFtIGpzb24gLSBKU09OIG9iamVjdFxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgc2NoZW1hIHdhcyB2YWxpZCAoSnNvbkRlY29kZXJWYWxpZGF0b3JFcnJvciBleGNlcHRpb24gdGhyb3duIG90aGVyd2lzZSlcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVkU291cmNlSnNvbih0YXJnZXQ6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LCBqc29uOiBKc29uT2JqZWN0KTogYm9vbGVhbiB7XG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byB2YWxpZGF0ZSB0aGVuIGl0J3MgdmFsaWRcbiAgICBpZiAoIVJlZmxlY3QuaGFzTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gRmV0Y2ggYW4gZXhpc3RpbmcgdmFsaWRhdG9yXG4gICAgbGV0IHZhbGlkYXRvciA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hVmFsaWRhdG9yLCB0YXJnZXQpIGFzIFZhbGlkYXRlRnVuY3Rpb24gfCB1bmRlZmluZWRcbiAgICAvLyBDcmVhdGUgYSBuZXcgdmFsaWRhdG9yIGlmIG9uZSBoYXMgbm90IGFscmVhZHkgYmVlbiBjcmVhdGVkXG4gICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgdmFsaWRhdG9yID0gY3JlYXRlU2NoZW1hVmFsaWRhdG9yKHRhcmdldClcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWFWYWxpZGF0b3IsIHZhbGlkYXRvciwgdGFyZ2V0KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm8gdmFsaWRhdG9yIChzaG91bGQgbm90IGhhcHBlbilcbiAgICBpZiAoIXZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIEF0dGVtcHQgdmFsaWRhdGlvbiBhbmQgcmVwb3J0IGVycm9yc1xuICAgIGNvbnN0IHZhbGlkYXRvclJlc3VsdCA9IHZhbGlkYXRvcihqc29uKVxuICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yUmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKCF2YWxpZGF0b3JSZXN1bHQpIHtcbiAgICAgICAgICAgIC8vIENvbGxlY3QgdGhlIGVycm9ycyBwcm9kdWNlZCBieSB0aGUgdmFsaWRhdG9yXG4gICAgICAgICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3JzOiBKc29uVmFsaWRhdGlvbkVycm9yW10gPSBbXVxuICAgICAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgICAgICAgIGVycm9ycy5tYXAoKGVycm9yOiBFcnJvck9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYWp2RXJyb3I6IEVycm9yT2JqZWN0IHwgdW5kZWZpbmVkID0gZXJyb3JcblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgZXhwbGljaXQgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlRXJyb3JNZXNzYWdlOiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5UGF0aDogc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3JtYXRFcnJvck1lc3NhZ2UgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iua2V5d29yZCA9PT0gJ2Vycm9yTWVzc2FnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0gZXJyb3IucGFyYW1zXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItY29uZGl0aW9uYWwtZXhwcmVzc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdlcnJvcnMnIGluIHBhcmFtcyAmJiBBcnJheS5pc0FycmF5KHBhcmFtcy5lcnJvcnMpICYmIHBhcmFtcy5lcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqdkVycm9yID0gcGFyYW1zLmVycm9yc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9IGNvbnZlcnRKc29uUG9pbnRlclRvS2V5UGF0aChhanZFcnJvciEuZGF0YVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIGZvcm1hdCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXRFcnJvck1lc3NhZ2UgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqdkVycm9yID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UhXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgoZXJyb3IuZGF0YVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IHByb3BlcnR5UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYCcke3Byb3BlcnR5UGF0aH0nICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IGBPYmplY3QgJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhanZFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIGVycm9yIHBhcmFtZXRlciB0byBiZSBhbiBhcnJheS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHBsYXkgaXQgc2FmZSwgZW5zdXJlIHdlIGhhdmUgYW4gYXJyYXkgdG8gaXRlcmF0ZSBvdmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvclBhcmFtczogYW55W10gPSBbXS5jb25jYXQoYWp2RXJyb3IucGFyYW1zIGFzIGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUGFyYW1zLmZvckVhY2goZXJyb3JQYXJhbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhanZFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ2RlcGVuZGVuY2llcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBwcm9wZXJ0eVBhdGggPyBgJHtwcm9wZXJ0eVBhdGh9LiR7ZXJyb3JQYXJhbS5wcm9wZXJ0eX1gIDogZXJyb3JQYXJhbS5wcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIHRvIGVuc3VyZSB0aGVyZSBpcyBhbHdheXMgYSBwcm9wZXJ0eSBwYXRoIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUGFyYW0ucHJvcGVydHlQYXRoID0gcHJvcGVydHlQYXRoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gU3RyaW5nKHRlbXBsYXRlRXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtYXRFcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVSZWdFeCA9IC8oe3soW2EtejAtOVxcLV9dKyl9fSkvZ2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1hdGNoID0gdGVtcGxhdGVSZWdFeC5leGVjKGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgaW4gZXJyb3JQYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3Byb3BlcnR5UGF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycm9yUGFyYW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYCcke2Vycm9yUGFyYW1bcHJvcGVydHldfSdgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGAke2Vycm9yTWVzc2FnZS5zbGljZSgwLCBtYXRjaC5pbmRleCl9YCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7dmFsdWV9YCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7ZXJyb3JNZXNzYWdlLnNsaWNlKHRlbXBsYXRlUmVnRXgubGFzdEluZGV4KX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gdGVtcGxhdGVSZWdFeC5leGVjKGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhanZFcnJvci5rZXl3b3JkID09PSAncmVxdWlyZWQnIHx8IGFqdkVycm9yLmtleXdvcmQgPT09ICdkZXBlbmRlbmNpZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25FcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBKc29uVmFsaWRhdG9yUHJvcGVydHlNaXNzaW5nRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlcnJvclBhcmFtIGFzIFJlcXVpcmVkUGFyYW1zKS5taXNzaW5nUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5VW5zdXBwb3J0ZWRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlcnJvclBhcmFtIGFzIEFkZGl0aW9uYWxQcm9wZXJ0aWVzUGFyYW1zKS5hZGRpdGlvbmFsUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5VmFsdWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVGcm9tSnNvblBvaW50ZXIoYWp2RXJyb3IhLmRhdGFQYXRoLCBqc29uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaHJvdyBhIHNpbmdsZSBlcnJvciB3aXRoIGFsbCB0aGUgc3BlY2lmaWMgdmFsaWRhdGlvblxuICAgICAgICAgICAgdGhyb3cgbmV3IEpzb25EZWNvZGVyVmFsaWRhdGlvbkVycm9yKHZhbGlkYXRpb25FcnJvcnMsIGpzb24pXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ0FzeW5jIHNjaGVtYSB2YWxpZGF0aW9uIG5vdCBzdXBwb3J0ZWQnKVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHNjaGVtYSB2YWxpZGF0b3IgZm9yIGEgdGFyZ2V0LiBJZiB0aGUgdGFyZ2V0IGRvZXMgbm90IHN1cHBvcnQgSlNPTiBzY2hlbWEgbm8gdmFsaWRhdG9yIGZ1bmN0aW9uIHdpbGwgYmUgcmV0dXJuZWRcbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IC0gdGFyZ2V0IGNsYXNzIHRvIHRha2UgZGVmaW5lZCBzY2hlbWEsIGFuZCBzY2hlbWEgcmVmZXJlbmNlcyBmcm9tXG4gKiBAcmV0dXJucyB2YWxpZGF0b3IgZnVuY3Rpb24gdG8gdmFsaWRhdGUgc2NoZW1hcyB3aXRoLCBvciB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gdmFsaWRhdGlvbiBuZWVkZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlU2NoZW1hVmFsaWRhdG9yKHRhcmdldDogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpOiBhanYuVmFsaWRhdGVGdW5jdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YWRhdGFTY2hlbWE6IEpzb25EZWNvZGVyU2NoZW1hTWV0YWRhdGEgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KVxuICAgIGlmICghbWV0YWRhdGFTY2hlbWEpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIC8vIFNjaGVtYSBvcHRpb25zXG4gICAgY29uc3Qgc2NoZW1hQ29tcGlsZXIgPSBhanYoe1xuICAgICAgICBhbGxFcnJvcnM6IHRydWUsXG4gICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgdmVyYm9zZTogdHJ1ZSxcbiAgICAgICAgZm9ybWF0OiAnZnVsbCcsXG4gICAgICAgIGpzb25Qb2ludGVyczogdHJ1ZSwgLy8gUmVxdWlyZWQgZm9yIGFqdkVycm9yc1xuICAgIH0pXG4gICAgYWp2RXJyb3JzKHNjaGVtYUNvbXBpbGVyKVxuXG4gICAgLy8gRmxhdHRlbiBhbGwgdGhlIHJlZmVyZW5jZXMgYW5kIGVuc3VyZSB0aGVyZSBpcyBvbmx5IG9uZSB2ZXJzaW9uIG9mIGVhY2hcbiAgICBjb25zdCByZWZlcmVuY2VTY2hlbWFzID0gZmxhdHRlblNjaGVtYVJlZmVyZW5jZXModGFyZ2V0KS5yZWR1Y2UoKHJlc3VsdCwgcmVmZXJlbmNlKSA9PiB7XG4gICAgICAgIGlmICghcmVzdWx0LmhhcyhyZWZlcmVuY2UuJGlkISkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5zZXQocmVmZXJlbmNlLiRpZCEsIHJlZmVyZW5jZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICB9LCBuZXcgTWFwPHN0cmluZywgSnNvbkRlY29kYWJsZVNjaGVtYT4oKSlcblxuICAgIC8vIEFkZCBhbGwgcmVmZXJlbmNlcyBhbmQgY29tcGlsZVxuICAgIGZvciAoY29uc3QgcmVmZXJlbmNlU2NoZW1hIG9mIHJlZmVyZW5jZVNjaGVtYXMudmFsdWVzKCkpIHtcbiAgICAgICAgc2NoZW1hQ29tcGlsZXIuYWRkU2NoZW1hKHJlZmVyZW5jZVNjaGVtYSlcbiAgICB9XG4gICAgY29uc3QgdmFsaWRhdG9yID0gc2NoZW1hQ29tcGlsZXIuY29tcGlsZShtZXRhZGF0YVNjaGVtYS5zY2hlbWEpXG5cbiAgICByZXR1cm4gdmFsaWRhdG9yXG59XG5cbi8qKlxuICogRmxhdHRlbnMgYWxsIHNjaGVtYSByZWZlcmVuY2VzIGZyb20gdGhlIHRhcmdldCBkb3duXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hIHJlZmVyZW5jZXMgZnJvbVxuICogQHBhcmFtIFtpbmNsdWRlUm9vdFNjaGVtYT1mYWxzZV0gLSBVc2VkIGZvciByZWN1cnNpb25cbiAqIEByZXR1cm5zIEZsYXR0ZW5lZCBzY2hlbWFzIHRvIGFkZCBhcyByZWZlcmVuY2UgZGVmaW5pdGlvbnNcbiAqL1xuZnVuY3Rpb24gZmxhdHRlblNjaGVtYVJlZmVyZW5jZXMoXG4gICAgdGFyZ2V0OiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCB8IEpzb25EZWNvZGFibGVTY2hlbWEsXG4gICAgaW5jbHVkZVJvb3RTY2hlbWE6IGJvb2xlYW4gPSBmYWxzZSk6IEpzb25EZWNvZGFibGVTY2hlbWFbXVxue1xuICAgIGNvbnN0IHNjaGVtYXM6IEpzb25EZWNvZGFibGVTY2hlbWFbXSA9IFtdXG5cbiAgICBjb25zdCBtZXRhZGF0YVNjaGVtYTogSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCB0YXJnZXQpXG4gICAgaWYgKG1ldGFkYXRhU2NoZW1hKSB7XG4gICAgICAgIGlmICghKCckc2NoZW1hJyBpbiBtZXRhZGF0YVNjaGVtYS5zY2hlbWEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBNaXNzaW5nICckc2NoZW1hJyBkZWNsYXJhdGlvbiBpbiAke3RhcmdldC5uYW1lIHx8IHRhcmdldC4kaWR9IHNjaGVtYWApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jbHVkZVJvb3RTY2hlbWEpIHtcbiAgICAgICAgICAgIGNvbnN0IG11dGFibGVTY2hlbWE6IEpzb25EZWNvZGFibGVTY2hlbWEgPSB7Li4ubWV0YWRhdGFTY2hlbWEuc2NoZW1hfVxuICAgICAgICAgICAgaWYgKCFtdXRhYmxlU2NoZW1hLiRpZCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSB0aGUgdGFyZ2V0IG5hbWUgYXMgdGhlIElEXG4gICAgICAgICAgICAgICAgbXV0YWJsZVNjaGVtYS4kaWQgPSBgIy8ke3RhcmdldC5uYW1lfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjaGVtYXMucHVzaChtdXRhYmxlU2NoZW1hKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmxhdHRlbiByZWZlcmVuY2Ugc2NoZW1hcy5cbiAgICAgICAgLy8gVGhlc2UgY291bGQgYmUgY2xhc3MgZGVjbGFyYXRpb25zIHdpdGggc2NoZW1hcyBhdHRhY2hlZCBvciBzY2hlbWFzIHRoZW1zZWx2ZXNcbiAgICAgICAgaWYgKG1ldGFkYXRhU2NoZW1hLnJlZmVyZW5jZXMgJiYgQXJyYXkuaXNBcnJheShtZXRhZGF0YVNjaGVtYS5yZWZlcmVuY2VzKSkge1xuICAgICAgICAgICAgbWV0YWRhdGFTY2hlbWEucmVmZXJlbmNlcy5mb3JFYWNoKHJlZmVyZW5jZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCEhUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hcy5wdXNoKC4uLmZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKHJlZmVyZW5jZSwgdHJ1ZSkpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgnJHNjaGVtYScgaW4gcmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaChyZWZlcmVuY2UgYXMgSnNvbkRlY29kYWJsZVNjaGVtYSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBNaXNzaW5nICckc2NoZW1hJyBkZWNsYXJhdGlvbiBpbiBzY2hlbWEgcmVmZXJlbmNlcyBmb3IgJHt0YXJnZXQubmFtZX1gKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbnVtZXJhdGlvbiB0aGUgZGVjb2RlciBtYXAgdG8gYXV0b21hdGljYWxseSBpbmplY3Qgc2NoZW1hIHJlZmVyZW5jZXNcbiAgICAgICAgY29uc3QgZGVjb2Rlck1hcCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyTWFwLCB0YXJnZXQpIGFzIERlY29kZXJNYXAgfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKGRlY29kZXJNYXApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhkZWNvZGVyTWFwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcEVudHkgPSBSZWZsZWN0LmdldChkZWNvZGVyTWFwLCBrZXkpXG4gICAgICAgICAgICAgICAgaWYgKG1hcEVudHkgJiYgbWFwRW50eS50eXBlICYmIFJlZmxlY3QuaGFzTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCBtYXBFbnR5LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaCguLi5mbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyhtYXBFbnR5LnR5cGUgYXMgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQsIHRydWUpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWFzXG59XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIHZhbHVlIGZyb20gYSBqc29uIG9iamVjdCBiYXNlZCBvbiBhIEpTT04gcG9pbnRlciBwYXRoXG4gKlxuICogQHBhcmFtIHBvaW50ZXIgLSBwb2ludGVyIHBhdGhcbiAqIEBwYXJhbSBqc29uIC0gc291cmNlIEpTT04gb2JqZWN0XG4gKiBAcmV0dXJucyBhIHZhbHVlLCBvciB1bmRlZmluZWQgaWYgbm90IGF2YWlsYWJsZVxuICovXG5mdW5jdGlvbiB2YWx1ZUZyb21Kc29uUG9pbnRlcihwb2ludGVyOiBzdHJpbmcsIGpzb246IEpzb25PYmplY3QpOiBhbnkge1xuICAgIGNvbnN0IGtleXMgPSBwb2ludGVyLnNwbGl0KCcvJykuZmlsdGVyKHBhcnQgPT4gISFwYXJ0KVxuXG4gICAgbGV0IHZhbHVlID0ganNvblxuICAgIHdoaWxlIChrZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5cy5zaGlmdCgpIVxuICAgICAgICBpZiAoIShrZXkgaW4gdmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZSA9IHZhbHVlW2tleV1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIEpTT04gcG9pbnRlciBwYXRoIHRvIGEga2V5IHBhdGggdGhhdCBpcyBtb3JlIGh1bWFuIGZyaWVuZGx5XG4gKlxuICogQHBhcmFtIHBvaW50ZXIgLSBwb2ludGVyIHBhdGhcbiAqIEBwYXJhbSBvdGhlcktleXMgLSBvdGhlciBrZXlzIHRvIGFwcGVuZCB0byB0aGUgcmVzdWx0IGtleSBwYXRoXG4gKiBAcmV0dXJucyBKU09OIGtleSBwYXRoXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRKc29uUG9pbnRlclRvS2V5UGF0aChwb2ludGVyOiBzdHJpbmcsIC4uLm90aGVyS2V5czogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcnRzID0gcG9pbnRlci5zcGxpdCgnLycpLmZpbHRlcihwYXJ0ID0+ICEhcGFydClcbiAgICBpZiAob3RoZXJLZXlzICYmIG90aGVyS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHBhcnRzLnB1c2goLi4ub3RoZXJLZXlzKVxuICAgIH1cblxuICAgIGxldCBkb3RQYXRoID0gJydcbiAgICB3aGlsZSAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHMuc2hpZnQoKSFcbiAgICAgICAgaWYgKC9eWzAtOV0rJC8udGVzdChwYXJ0KSkge1xuICAgICAgICAgICAgZG90UGF0aCArPSBgWyR7cGFydH1dYFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGRvdFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGRvdFBhdGggKz0gJy4nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb3RQYXRoICs9IHBhcnRcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkb3RQYXRoXG59Il19