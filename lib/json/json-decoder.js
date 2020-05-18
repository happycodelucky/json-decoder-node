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
        var _a;
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
            if (options && ((_a = options.useConstructor) !== null && _a !== void 0 ? _a : false)) {
                const constructable = classType;
                decodeObject = new constructable();
            }
            else {
                decodeObject = Object.create(classType.prototype);
            }
        }
        validatedSourceJson(classType, object);
        const contextKey = Reflect.getMetadata(json_symbols_1.JsonDecoderMetadataKeys.context, classType);
        if (contextKey !== undefined && contextKey.length > 0) {
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
                    Reflect.set(decodeObject, key, value);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBSUEsNEJBQXlCO0FBRXpCLDJCQUEwQjtBQUUxQix3Q0FBdUM7QUFJdkMsMEVBQThGO0FBQzlGLDBFQUF3SDtBQUN4SCx3REFBeUY7QUFHekYsNERBQTJGO0FBRzNGLCtEQUFrRTtBQUVsRSxpREFBd0Q7QUFDeEQscUVBQStGO0FBQy9GLHFFQUFtSDtBQU1uSCxNQUFhLFdBQVc7SUFPcEIsTUFBTSxDQUFDLE1BQU0sQ0FBbUIsY0FBbUMsRUFBRSxTQUFrQzs7UUFDbkcsSUFBSSxjQUFjLEtBQUssSUFBSSxJQUFJLGNBQWMsS0FBSyxTQUFTLEVBQUU7WUFDekQsT0FBTyxJQUFJLENBQUE7U0FDZDtRQUdELElBQUksTUFBYyxDQUFBO1FBQ2xCLElBQUksT0FBTyxjQUFjLEtBQUssUUFBUSxFQUFFO1lBRXBDLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsQ0FBZSxDQUFBO1NBQ3BEO2FBQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLGNBQWMsQ0FBQyxJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUU1RSxNQUFNLEdBQUcsY0FBYyxDQUFBO1NBQzFCO2FBQU07WUFDSCxNQUFNLElBQUksU0FBUyxDQUFDLGdEQUFnRCxDQUFDLENBQUE7U0FDeEU7UUFFRCxJQUFJLFlBQWtDLENBQUE7UUFHdEMsTUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQywwQ0FBbUIsQ0FBQyxjQUFjLEVBQUUsU0FBUyxDQUF5QixDQUFBO1FBQ2hILElBQUksYUFBYSxFQUFFO1lBQ2YsWUFBWSxHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBTSxDQUFBO1lBR3pELElBQUksWUFBWSxLQUFLLElBQUksRUFBRTtnQkFDdkIsT0FBTyxJQUFJ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R0FBRyxJQUFJLEtBQUssQ0FBQyxFQUFFO1lBQ2pCLE9BQU8sU0FBUyxDQUFBO1NBQ25CO1FBRUQsS0FBSyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQTtLQUNyQjtJQUVELE9BQU8sS0FBSyxDQUFBO0FBQ2hCLENBQUM7QUFTRCxTQUFTLDJCQUEyQixDQUFDLE9BQWUsRUFBRSxHQUFHLFNBQW1CO0lBQ3hFLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFBO0lBQ3ZELElBQUksU0FBUyxJQUFJLFNBQVMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ25DLEtBQUssQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQTtLQUMzQjtJQUVELElBQUksT0FBTyxHQUFHLEVBQUUsQ0FBQTtJQUNoQixPQUFPLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO1FBQ3JCLE1BQU0sSUFBSSxHQUFHLEtBQUssQ0FBQyxLQUFLLEVBQUcsQ0FBQTtRQUMzQixJQUFJLFVBQVUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDdkIsT0FBTyxJQUFJLElBQUksSUFBSSxHQUFHLENBQUE7U0FDekI7YUFBTTtZQUNILElBQUksT0FBTyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUU7Z0JBQ3BCLE9BQU8sSUFBSSxHQUFHLENBQUE7YUFDakI7WUFDRCxPQUFPLElBQUksSUFBSSxDQUFBO1NBQ2xCO0tBQ0o7SUFFRCxPQUFPLE9BQU8sQ0FBQTtBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBKU09OIHNwZWNpZmljIGRlY29kZXIgYW5kIGRlY29yYXRvcnNcbiAqL1xuXG5pbXBvcnQgJ3JlZmxlY3QtbWV0YWRhdGEnXG5cbmltcG9ydCAqIGFzIGFqdiBmcm9tICdhanYnXG4vLyBAdHMtaWdub3JlXG5pbXBvcnQgKiBhcyBhanZFcnJvcnMgZnJvbSAnYWp2LWVycm9ycydcblxuaW1wb3J0IHsgQWRkaXRpb25hbFByb3BlcnRpZXNQYXJhbXMsIEVycm9yT2JqZWN0LCBSZXF1aXJlZFBhcmFtcywgVmFsaWRhdGVGdW5jdGlvbiB9IGZyb20gJ2FqdidcblxuaW1wb3J0IHsgRGVjb2Rlck1ldGFkYXRhS2V5cywgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItZGVjbGFyYXRpb25zJ1xuaW1wb3J0IHsgRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0LCBpc0RlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCB9IGZyb20gJy4uL2RlY29kZXIvZGVjb2Rlci1kZWNsYXJhdGlvbnMnXG5pbXBvcnQgeyBEZWNvZGVyTWFwLCBEZWNvZGVyTWFwRW50cnksIGRlY29kZXJNYXBGb3JUYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItbWFwJ1xuXG5pbXBvcnQgeyBDb2xsZWN0aW9uTWFyc2hhbGxlckZ1bmN0aW9uLCBNYXJzaGFsbGVyRnVuY3Rpb24gfSBmcm9tICcuLi9tYXJzaGFsbGVycy9tYXJzaGFsbGVycydcbmltcG9ydCB7IGNvbGxlY3Rpb25NYXJzaGFsbGVyRm9yVHlwZSwgbWFyc2hhbGxlckZvclR5cGUgfSBmcm9tICcuLi9tYXJzaGFsbGVycy9tYXJzaGFsbGVycydcblxuaW1wb3J0IHsgSnNvbk9iamVjdCB9IGZyb20gJy4vanNvbi1kZWNvZGFibGUtdHlwZXMnXG5pbXBvcnQgeyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvciB9IGZyb20gJy4vanNvbi1kZWNvZGVyLWVycm9ycydcbmltcG9ydCB7IEpzb25EZWNvZGFibGVPcHRpb25zLCBKc29uRGVjb2RhYmxlU2NoZW1hLCBKc29uRGVjb2RlclNjaGVtYU1ldGFkYXRhIH0gZnJvbSAnLi9qc29uLWRlY29yYXRvcnMnXG5pbXBvcnQgeyBKc29uRGVjb2Rlck1ldGFkYXRhS2V5cyB9IGZyb20gJy4vanNvbi1zeW1ib2xzJ1xuaW1wb3J0IHsgSnNvblZhbGlkYXRpb25FcnJvciwgSnNvblZhbGlkYXRvclByb3BlcnR5VmFsdWVFcnJvciB9IGZyb20gJy4vanNvbi12YWxpZGF0aW9uLWVycm9ycydcbmltcG9ydCB7IEpzb25WYWxpZGF0b3JQcm9wZXJ0eU1pc3NpbmdFcnJvciwgSnNvblZhbGlkYXRvclByb3BlcnR5VW5zdXBwb3J0ZWRFcnJvciB9IGZyb20gJy4vanNvbi12YWxpZGF0aW9uLWVycm9ycydcblxuLyoqXG4gKiBKU09OIGRlY29kZXIgZm9yIEpTT04gZGVjb2RhYmxlIGNsYXNzZXNcbiAqL1xuLy8gdHNsaW50OmRpc2FibGU6bm8tdW5uZWNlc3NhcnktY2xhc3NcbmV4cG9ydCBjbGFzcyBKc29uRGVjb2RlciB7XG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhIEpTT04gb2JqZWN0IG9yIFN0cmluZyByZXR1cm5pbmcgYmFjayB0aGUgb2JqZWN0IGlmIGl0IHdhcyBhYmxlIHRvIGJlIGRlY29kZWRcbiAgICAgKiBAcGFyYW0gb2JqZWN0T3JTdHJpbmcgLSBhcnJheSBvciBzdHJpbmcgKGNvbnRhaW4gSlNPTiBvYmplY3QpIHRvIGRlY29kZVxuICAgICAqIEBwYXJhbSBjbGFzc1R5cGUgLSBkZWNvZGFibGUgdHlwZSB0byBkZWNvZGUgSlNPTiBpbnRvXG4gICAgICogQHJldHVybiBhIGRlY29kZWQgb2JqZWN0IG9mIGBjbGFzc1R5cGVgXG4gICAgICovXG4gICAgc3RhdGljIGRlY29kZTxUIGV4dGVuZHMgb2JqZWN0PihvYmplY3RPclN0cmluZzogc3RyaW5nIHwgSnNvbk9iamVjdCwgY2xhc3NUeXBlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCk6IFQgfCBudWxsIHtcbiAgICAgICAgaWYgKG9iamVjdE9yU3RyaW5nID09PSBudWxsIHx8IG9iamVjdE9yU3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICAvLyBFeHRyYWN0IG91ciBKU09OIG9iamVjdFxuICAgICAgICBsZXQgb2JqZWN0OiBvYmplY3RcbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RPclN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIC8vIFdpbGwgdGhyb3cgYW4gZXhjZXB0aW9uIGlmIHRoZSBKU09OIGhhcyBhIHN5bnRheCBlcnJvclxuICAgICAgICAgICAgb2JqZWN0ID0gSlNPTi5wYXJzZShvYmplY3RPclN0cmluZykgYXMgSnNvbk9iamVjdFxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0T3JTdHJpbmcpIHx8IHR5cGVvZiBvYmplY3RPclN0cmluZyA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIC8vIEFycmF5cyBhcmUgb2JqZWN0cyB0b28sIGFuZCBjYW4gYmUgcXVlcmllZCB3aXRoIEAwLnZhbHVlXG4gICAgICAgICAgICBvYmplY3QgPSBvYmplY3RPclN0cmluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZGVjb2RlKG9iamVjdCkgc2hvdWxkIGJlIGFuIE9iamVjdCBvciBhIFN0cmluZycpXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZGVjb2RlT2JqZWN0OiBUIHwgdW5kZWZpbmVkIHwgbnVsbFxuXG4gICAgICAgIC8vIENyZWF0ZSBvdXIgZGVjb2Rpbmcgb2JqZWN0IHVzaW5nIGEgZGVjb2RlciBmdW5jdGlvbiBpZiByZWdpc3RlcmVkXG4gICAgICAgIGNvbnN0IG9iamVjdEZhY3RvcnkgPSBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RlckZhY3RvcnksIGNsYXNzVHlwZSkgYXMgRnVuY3Rpb24gfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKG9iamVjdEZhY3RvcnkpIHtcbiAgICAgICAgICAgIGRlY29kZU9iamVjdCA9IG9iamVjdEZhY3RvcnkuY2FsbChjbGFzc1R5cGUsIG9iamVjdCkgYXMgVFxuXG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICBpZiAoZGVjb2RlT2JqZWN0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gV2l0aCBhIG5ldyBvYmplY3QgY2FuIGNvbWUgYSBuZXcgZGVjb2RlciBjb25maWd1cmF0aW9uXG4gICAgICAgICAgICBpZiAoZGVjb2RlT2JqZWN0ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBjbGFzc1R5cGUgPSBkZWNvZGVPYmplY3QuY29uc3RydWN0b3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghZGVjb2RlT2JqZWN0KSB7XG4gICAgICAgICAgICBjb25zdCBvcHRpb25zID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZU9wdGlvbnMsIGNsYXNzVHlwZSkgYXMgSnNvbkRlY29kYWJsZU9wdGlvbnMgfCB1bmRlZmluZWRcbiAgICAgICAgICAgIGlmIChvcHRpb25zICYmIChvcHRpb25zLnVzZUNvbnN0cnVjdG9yID8/IGZhbHNlKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGNvbnN0cnVjdGFibGUgPSBjbGFzc1R5cGUgYXMgT2JqZWN0Q29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBuZXcgY29uc3RydWN0YWJsZSgpIGFzIFRcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgLy8gSW5zdGFudGlhdGUgdGhlIG9iamVjdCwgd2l0aG91dCBjYWxsaW5nIHRoZSBjb25zdHJ1Y3RvclxuICAgICAgICAgICAgICAgIGRlY29kZU9iamVjdCA9IE9iamVjdC5jcmVhdGUoY2xhc3NUeXBlLnByb3RvdHlwZSkgYXMgVFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gVmFsaWRhdGUgdGhlIEpTT05cbiAgICAgICAgLy8gVGhpcyB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBub3QgdmFsaWRcbiAgICAgICAgdmFsaWRhdGVkU291cmNlSnNvbihjbGFzc1R5cGUsIG9iamVjdClcblxuICAgICAgICAvLyBDaGVjayBpZiBhIGNvbnRleHQgbmVlZHMgdG8gYmUgc2V0XG4gICAgICAgIGNvbnN0IGNvbnRleHRLZXkgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLmNvbnRleHQsIGNsYXNzVHlwZSkgYXMgc3RyaW5nIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChjb250ZXh0S2V5ICE9PSB1bmRlZmluZWQgJiYgY29udGV4dEtleS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZVByb3BlcnR5KGRlY29kZU9iamVjdCwgY29udGV4dEtleSwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiBvYmplY3QsXG4gICAgICAgICAgICAgICAgZW51bWVyYWJsZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFdhbGsgdGhlIHByb3RvdHlwZSBjaGFpbiwgYWRkaW5nIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvbnMgaW4gcmV2ZXJzZSBvcmRlclxuICAgICAgICBjb25zdCBjbGFzc0NvbnN0cnVjdG9yczogRGVjb2RlclByb3RvdHlwYWxUYXJnZXRbXSA9IFtdXG4gICAgICAgIGxldCBwcm90b3R5cGUgPSBjbGFzc1R5cGUucHJvdG90eXBlXG4gICAgICAgIHdoaWxlIChwcm90b3R5cGUgIT09IE9iamVjdC5wcm90b3R5cGUpIHtcbiAgICAgICAgICAgIGlmICghIVJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHByb3RvdHlwZS5jb25zdHJ1Y3RvcikpIHtcbiAgICAgICAgICAgICAgICBjbGFzc0NvbnN0cnVjdG9ycy51bnNoaWZ0KHByb3RvdHlwZS5jb25zdHJ1Y3RvcilcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHByb3RvdHlwZSA9IFJlZmxlY3QuZ2V0UHJvdG90eXBlT2YocHJvdG90eXBlKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBjbGFzcyBoZWlyYXJjaHlcbiAgICAgICAgZm9yIChjb25zdCBjb25zdHJ1Y3RvciBvZiBjbGFzc0NvbnN0cnVjdG9ycykge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGEgYmVmb3JlIGRlY29kZSBmdW5jdGlvbiBvbiBhIGNvbnN0cnVjdG9yIGZ1bmN0aW9uJ3MgcHJvdG90eXBlXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXIsIGNvbnN0cnVjdG9yLnByb3RvdHlwZSkgYXMgRnVuY3Rpb25cbiAgICAgICAgICAgIGlmIChkZWNvZGVyKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYWx0ZXJuYXRpdmVEZWNvZGVPYmplY3QgPSBkZWNvZGVyLmNhbGwoZGVjb2RlT2JqZWN0LCBvYmplY3QpXG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgICAgIGlmIChhbHRlcm5hdGl2ZURlY29kZU9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gTG9vayB1cCBkZWNvZGVyIG1hcCBmb3IgdGhlIGNvbnN0cnVjdG9yIGZ1bmN0aW9uXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyTWFwID0gZGVjb2Rlck1hcEZvclRhcmdldChjb25zdHJ1Y3RvcilcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhkZWNvZGVyTWFwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcEVudHJ5ID0gUmVmbGVjdC5nZXQoZGVjb2Rlck1hcCwga2V5KSBhcyBEZWNvZGVyTWFwRW50cnlcbiAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlUHJvcGVydHlWYWx1ZShvYmplY3QsIG1hcEVudHJ5LCBkZWNvZGVPYmplY3QpXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgUmVmbGVjdC5zZXQoZGVjb2RlT2JqZWN0LCBrZXksIHZhbHVlKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5IGZvciBwcm90b3R5cGUgZGVjb2RlcnMsIHRoaXMgdGltZSBjYWxsaW5nIGFsbCB0aGUgcHJvcGVydHkgbm90aWZpZXJzXG4gICAgICAgIC8vIFRoaXMgaXMgZG9uZSBhZnRlciBhbGwgbWFwcGVkIHByb3BlcnRpZXMgaGF2ZSBiZWVuIGFzc2lnbmVkXG4gICAgICAgIGZvciAoY29uc3QgY29uc3RydWN0b3Igb2YgY2xhc3NDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5Tm90aWZpZXJzID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShcbiAgICAgICAgICAgICAgICBEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJOb3RpZmllcnMsXG4gICAgICAgICAgICAgICAgY29uc3RydWN0b3IsXG4gICAgICAgICAgICApIGFzIE1hcDxzdHJpbmcsIERlY29kZXJNYXBFbnRyeVtdPiB8IHVuZGVmaW5lZFxuXG4gICAgICAgICAgICBpZiAocHJvcGVydHlOb3RpZmllcnMpIHtcbiAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXJzIG9mIHByb3BlcnR5Tm90aWZpZXJzLnZhbHVlcygpKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlciBvZiBoYW5kbGVycykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZVByb3BlcnR5VmFsdWUoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBoYW5kbGVyLmtleSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogaGFuZGxlci50eXBlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPOiBDYXB0dXJlIGVycm9ycyBmcm9tIGhhbmRsZXJzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaGFuZGxlci5tYXBGdW5jdGlvbiEuY2FsbChkZWNvZGVPYmplY3QsIHZhbHVlLCBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGNsYXNzIGhlaXJhcmNoeSBmb3IgcHJvdG90eXBlIGRlY29kZXJzLCBjYWxsaW5nIHRoZSBkZWNvZGVyIGNvbXBsZXRlIGZ1bmN0aW9uXG4gICAgICAgIC8vIFRoaXMgZG9uZSBhZnRlciBhbGwgcG90ZW50aWFsIGFzc2lnbWVudHNcbiAgICAgICAgZm9yIChjb25zdCBjb25zdHJ1Y3RvciBvZiBjbGFzc0NvbnN0cnVjdG9ycykge1xuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGEgYWZ0ZXIgZGVjb2RlIHByb3RvdHlwZSBmdW5jdGlvblxuICAgICAgICAgICAgY29uc3QgZGVjb2RlckNvbXBsZXRlID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJDb21wbGV0ZWQsIGNvbnN0cnVjdG9yLnByb3RvdHlwZSlcbiAgICAgICAgICAgIGlmIChkZWNvZGVyQ29tcGxldGUpIHtcbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21wbGV0ZU9iamVjdDogYW55ID0gZGVjb2RlckNvbXBsZXRlLmNhbGwoZGVjb2RlT2JqZWN0LCBvYmplY3QpXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlT2JqZWN0ID09PSBudWxsIHx8IGNvbXBsZXRlT2JqZWN0ID09PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3Igc3dhcHBlZCBkZWNvZGUgb2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZU9iamVjdCAmJiBjb21wbGV0ZU9iamVjdCAhPT0gZGVjb2RlT2JqZWN0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBjb21wbGV0ZU9iamVjdFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnIgaW5zdGFuY2VvZiBKc29uVmFsaWRhdGlvbkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3IgPSBuZXcgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IoW2Vycl0sIG9iamVjdCwgJ0pTT04gdmFsaWRhdGlvbiBmYWlsZWQgcG9zdCBkZWNvZGUnKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGhyb3cgdmFsaWRhdGlvbkVycm9yXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnJcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVjb2RlT2JqZWN0IVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBKU09OIG9iamVjdCBvciBTdHJpbmcgcmV0dXJuaW5nIGJhY2sgdGhlIG9iamVjdCBpZiBpdCB3YXMgYWJsZSB0byBiZSBkZWNvZGVkXG4gICAgICogQHBhcmFtIG9iamVjdE9yU3RyaW5nIC0gYXJyYXkgb3Igc3RyaW5nIChjb250YWluIEpTT04gYXJyYXkpIHRvIGRlY29kZVxuICAgICAqIEBwYXJhbSBjbGFzc1R5cGUgLSBkZWNvZGFibGUgdHlwZSB0byBkZWNvZGUgSlNPTiBpbnRvXG4gICAgICogQHJldHVybiBhbiBhcnJheSBvZiBkZWNvZGVkIG9iamVjdHMgb2YgYGNsYXNzVHlwZWBcbiAgICAgKi9cbiAgICBzdGF0aWMgZGVjb2RlQXJyYXk8VCBleHRlbmRzIG9iamVjdD4oXG4gICAgICAgIG9iamVjdE9yU3RyaW5nOiBzdHJpbmcgfCBKc29uT2JqZWN0W10sXG4gICAgICAgIGNsYXNzVHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQsXG4gICAgKTogW1RdIHwgbnVsbCB7XG4gICAgICAgIGlmIChvYmplY3RPclN0cmluZyA9PT0gbnVsbCB8fCBvYmplY3RPclN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IG9iamVjdHM6IG9iamVjdFtdXG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICBvYmplY3RzID0gSlNPTi5wYXJzZShvYmplY3RPclN0cmluZylcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iamVjdE9yU3RyaW5nKSkge1xuICAgICAgICAgICAgb2JqZWN0cyA9IG9iamVjdE9yU3RyaW5nXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdkZWNvZGUob2JqZWN0KSBzaG91bGQgYmUgYW4gQXJyYXkgb2YgT2JqZWN0cyBvciBhIFN0cmluZycpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gb2JqZWN0cy5tYXA8VCB8IG51bGw+KChvYmplY3QpID0+IHRoaXMuZGVjb2RlPFQ+KG9iamVjdCwgY2xhc3NUeXBlKSkuZmlsdGVyKChvYmplY3QpID0+ICEhb2JqZWN0KSBhcyBbVF1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGEgSlNPTiBvYmplY3Qgb3IgU3RyaW5nIHJldHVybmluZyBiYWNrIGEgbWFwIHdpdGgga2V5IGFzIHRoZVxuICAgICAqIGpzb24ga2V5IGFuZCB2YWx1ZSBkZWNvZGVkIHRvIHRoZSBkZWNvZGFibGUgdHlwZSBwYXNzZWQgaW4gdGhlIGlucHV0XG4gICAgICogQHBhcmFtIG9iamVjdE9yU3RyaW5nIC0gYXJyYXkgb3Igc3RyaW5nIChjb250YWluIEpTT04gYXJyYXkpIHRvIGRlY29kZVxuICAgICAqIEBwYXJhbSBjbGFzc1R5cGVPZlZhbHVlIC0gZGVjb2RhYmxlIHR5cGUgb2YganNvbiB2YWx1ZXMgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYSBNYXAgd2l0aCB0aGUgdmFsdWUgY29udGFpbmluZyBkZWNvZGVkIG9iamVjdHMgb2YgYGNsYXNzVHlwZWBcbiAgICAgKi9cbiAgICBzdGF0aWMgZGVjb2RlTWFwPFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgICAgICBvYmplY3RPclN0cmluZzogc3RyaW5nIHwgSnNvbk9iamVjdCxcbiAgICAgICAgY2xhc3NUeXBlT2ZWYWx1ZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQsXG4gICAgKTogTWFwPHN0cmluZywgVD4gfCBudWxsICB7XG4gICAgICAgIGlmIChvYmplY3RPclN0cmluZyA9PT0gbnVsbCB8fCBvYmplY3RPclN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaW5wdXRPYmplY3Q6IEpzb25PYmplY3QgPSAodHlwZW9mKG9iamVjdE9yU3RyaW5nKSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICA/IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpXG4gICAgICAgICAgICA6IG9iamVjdE9yU3RyaW5nXG5cbiAgICAgICAgY29uc3QgZGVjb2RlZE1hcDogTWFwPHN0cmluZywgVCA+ID0gbmV3IE1hcCgpXG4gICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhpbnB1dE9iamVjdCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlY29kZWRWYWx1ZSA9IHRoaXMuZGVjb2RlPFQ+KGlucHV0T2JqZWN0W2tleS50b1N0cmluZygpXSwgY2xhc3NUeXBlT2ZWYWx1ZSlcbiAgICAgICAgICAgIGlmIChkZWNvZGVkVmFsdWUpIHtcbiAgICAgICAgICAgICAgICBkZWNvZGVkTWFwLnNldChrZXkudG9TdHJpbmcoKSwgZGVjb2RlZFZhbHVlKVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlY29kZWRNYXBcbiAgICB9XG59XG5cblxuXG4vL1xuLy8gUHJpdmF0ZSBmdW5jdGlvbnNcbi8vXG5cbi8qKlxuICogQ3JlYXRlcyBhIG1hcnNoYWxsZXIgZm9yIGEgZ2l2ZW4gdHlwZSBkZWNsYXJhdGlvbiB0byB1c2UgZm9yIGNvbnZlcnNpb25cbiAqXG4gKiBAcGFyYW0gdHlwZSAtIGRlc2lyZWQgY29udmVyc2lvbiB0eXBlXG4gKiBAcmV0dXJuIGNvbnZlcnNpb24gZnVuY3Rpb24gb3IgdW5kZWZpbmVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZU1hcnNoYWxsZXIodHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfCBEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQpOlxuICAgICgodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4gYW55KSB8IHVuZGVmaW5lZFxue1xuICAgIGlmIChpc0RlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCh0eXBlKSkge1xuICAgICAgICBsZXQgY29sbGVjdGlvbk1hcnNoYWxsZXI6IENvbGxlY3Rpb25NYXJzaGFsbGVyRnVuY3Rpb24gfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHR5cGUuY29sbGVjdGlvbikpIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25NYXJzaGFsbGVyID0gKHZhbHVlOiBhbnksIGl0ZW1NYXJoc2FsbGVyPzogTWFyc2hhbGxlckZ1bmN0aW9uLCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Jvb2xlYW4nXG4gICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ251bWJlcidcbiAgICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJ1xuICAgICAgICAgICAgICAgICAgICB8fCAodHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZSh2YWx1ZSwgdHlwZS5jb2xsZWN0aW9uKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7dHlwZW9mIHZhbHVlfSBjYW5ub3QgYmUgY29udmVydGVkIHRvICR7dHlwZS5jb2xsZWN0aW9uLm5hbWV9YClcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uTWFyc2hhbGxlciA9IGNvbGxlY3Rpb25NYXJzaGFsbGVyRm9yVHlwZSh0eXBlLmNvbGxlY3Rpb24pXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWNvbGxlY3Rpb25NYXJzaGFsbGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGVsZW1lbnRNYXJzaGFsbGVyID0gY3JlYXRlTWFyc2hhbGxlcih0eXBlLmVsZW1lbnQpXG5cbiAgICAgICAgLy8gSWYgdGhlIGVsZW1lbnQgdHlwZSBpcyBkZWNvZGFibGVcbiAgICAgICAgaWYgKCFlbGVtZW50TWFyc2hhbGxlciAmJiBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCB0eXBlLmVsZW1lbnQpKSB7XG4gICAgICAgICAgICBlbGVtZW50TWFyc2hhbGxlciA9ICh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZTx0eXBlb2YgdHlwZT4odmFsdWUsIHR5cGUuZWxlbWVudCBhcyBEZWNvZGVyUHJvdG90eXBhbFRhcmdldClcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIGNvbGxlY3Rpb25NYXJzaGFsbGVyISh2YWx1ZSwgZWxlbWVudE1hcnNoYWxsZXIsIHN0cmljdClcbiAgICAgICAgfVxuICAgIH0gZWxzZSBpZiAoUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZSwgdHlwZSkpIHtcbiAgICAgICAgcmV0dXJuICh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gSnNvbkRlY29kZXIuZGVjb2RlPHR5cGVvZiB0eXBlPih2YWx1ZSwgdHlwZSlcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBtYXJzaGFsbGVyRm9yVHlwZSh0eXBlKVxufVxuXG4vKipcbiAqIEV2YWx1YXRlcyBhIHByb3BlcnR5IG9mIGFuIG9iamVjdCAoYmVpbmcgZGVjb2RlZCkgYmFzZWQgb24gYSBtYXAgZW50cnkgZm9yIHRoZSBkZWNvZGVyLlxuICpcbiAqIEBwYXJhbSBvYmplY3QgLSBvYmplY3QgYmVpbmcgZGVjb2RlZFxuICogQHBhcmFtIG1hcEVudHJ5IC0gZGVjb2RlciBtYXAgZW50cnlcbiAqIEBwYXJhbSBkZWNvZGVPYmplY3QgLSBvYmplY3QgYmVpbmcgcG9wdWxhdGVkIGJ5IHRoZSBkZWNvZGVyXG4gKiBAcGFyYW0gc3RyaWN0IC0gd2hlbiB0cnVlLCBwYXJzaW5nIGlzIHN0cmljdCBhbmQgdGhyb3dzIGEgVHlwZUVycm9yIGlmIHRoZSB2YWx1ZSBjYW5ub3QgYmUgY29udmVydGVkXG4gKiBAcmV0dXJucyBldmFsdWF0ZWQgcHJvcGVydHkgdmFsdWVcbiAqXG4gKiBAdGhyb3dzIFR5cGVFcnJvclxuICovXG5mdW5jdGlvbiBldmFsdWF0ZVByb3BlcnR5VmFsdWUoXG4gICAgb2JqZWN0OiBvYmplY3QsXG4gICAgbWFwRW50cnk6IERlY29kZXJNYXBFbnRyeSxcbiAgICBkZWNvZGVPYmplY3Q6IG9iamVjdCxcbiAgICBzdHJpY3Q6IGJvb2xlYW4gPSBmYWxzZSxcbik6IGFueSB7XG4gICAgaWYgKCFvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cbiAgICBpZiAoIW1hcEVudHJ5KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICAvLyBFbnN1cmUgY29uc2lzdGVudCB1c2Ugb2YgRGVjb2Rlck1hcEVudHJ5XG4gICAgbGV0IGRlY29kZXJNYXBFbnRyeTogRGVjb2Rlck1hcEVudHJ5XG4gICAgaWYgKHR5cGVvZiBtYXBFbnRyeSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgZGVjb2Rlck1hcEVudHJ5ID0ge1xuICAgICAgICAgICAga2V5OiBtYXBFbnRyeSxcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIGRlY29kZXJNYXBFbnRyeSA9IG1hcEVudHJ5XG4gICAgfVxuXG4gICAgLy8gTG9vayB1cCB0aGUgcHJvcGVydHkga2V5IHBhdGggaW4gdGhlIEpTT04gb2JqZWN0XG4gICAgY29uc3Qga2V5UGF0aHMgPSBkZWNvZGVyTWFwRW50cnkua2V5LnNwbGl0KC9AfFxcLi8pXG4gICAgbGV0IHZhbHVlOiBhbnkgPSBvYmplY3RcbiAgICBkbyB7XG4gICAgICAgIGNvbnN0IHBhdGggPSBrZXlQYXRocy5zaGlmdCgpIVxuICAgICAgICBpZiAoIXBhdGgpIHtcbiAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgIH1cblxuICAgICAgICAvLyBDYW4gb25seSBpbnNwZWN0IG9iamVjdCB2YWx1ZXMsIGZhaWwgaWYgd2UgY2Fubm90IHJlc29sdmUgdGhlIHZhbHVlXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnICYmIHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgICAgICAgICAvLyBUT0RPOiBUaHJvdyBlcnJvcj9cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgICB2YWx1ZSA9IFJlZmxlY3QuZ2V0KHZhbHVlLCBwYXRoKVxuICAgIH0gd2hpbGUgKGtleVBhdGhzLmxlbmd0aCA+IDAgJiYgdmFsdWUgIT09IG51bGwgJiYgdmFsdWUgIT09IHVuZGVmaW5lZClcblxuICAgIC8vIElmIHRoZXJlIGlzIGFuIHVuZGVmaW5lZCB2YWx1ZSByZXR1cm4gaXQgKGRvIG5vdCByZXR1cm4gb24gbnVsbClcbiAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgYW55IHR5cGUgY29udmVyc2lvblxuICAgIGlmIChkZWNvZGVyTWFwRW50cnkudHlwZSkge1xuICAgICAgICBjb25zdCBtYXJzaGFsbGVyID0gY3JlYXRlTWFyc2hhbGxlcihkZWNvZGVyTWFwRW50cnkudHlwZSlcbiAgICAgICAgaWYgKG1hcnNoYWxsZXIpIHtcbiAgICAgICAgICAgIHZhbHVlID0gbWFyc2hhbGxlcih2YWx1ZSwgc3RyaWN0KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHJvb3RUeXBlID1cbiAgICAgICAgICAgICAgICAgICAgaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQoZGVjb2Rlck1hcEVudHJ5LnR5cGUpID8gZGVjb2Rlck1hcEVudHJ5LnR5cGUuY29sbGVjdGlvbiA6IGRlY29kZXJNYXBFbnRyeS50eXBlXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgJHtyb290VHlwZS5uYW1lfSBpcyBub3QgYSBKU09OIGRlY29kYWJsZSB0eXBlYClcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWYgdGhlcmUgaXMgbm8gdmFsdWUsIGl0IHNob3VsZCBiZSBza2lwcGVkXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZGVjb2Rlck1hcEVudHJ5Lm1hcEZ1bmN0aW9uKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IGRlY29kZXJNYXBFbnRyeS5tYXBGdW5jdGlvbi5jYWxsKGRlY29kZU9iamVjdCwgdmFsdWUsIG9iamVjdClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIFZhbGlkYXRlcyBhIHNjaGVtYSBkZWZpbmVkIG9uIGEgdGFyZ2V0IGFnYWluc3QgdGhlIHNvdXJjZSBKU09OLlxuICogSWYgdGhlIEpTT04gaXMgbm90IHZhbGlkIHRoZW4gYSBKc29uRGVjb2RlclZhbGlkYXRvckVycm9yIGV4Y2VwdGlvbiBpcyB0aHJvd25cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IC0gdGFyZ2V0IGNsYXNzIHRvIHRha2UgZGVmaW5lZCBzY2hlbWEgZnJvbVxuICogQHBhcmFtIGpzb24gLSBKU09OIG9iamVjdFxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgc2NoZW1hIHdhcyB2YWxpZCAoSnNvbkRlY29kZXJWYWxpZGF0b3JFcnJvciBleGNlcHRpb24gdGhyb3duIG90aGVyd2lzZSlcbiAqL1xuZnVuY3Rpb24gdmFsaWRhdGVkU291cmNlSnNvbih0YXJnZXQ6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LCBqc29uOiBKc29uT2JqZWN0KTogYm9vbGVhbiB7XG4gICAgLy8gSWYgdGhlcmUgaXMgbm90aGluZyB0byB2YWxpZGF0ZSB0aGVuIGl0J3MgdmFsaWRcbiAgICBpZiAoIVJlZmxlY3QuaGFzTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCB0YXJnZXQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gRmV0Y2ggYW4gZXhpc3RpbmcgdmFsaWRhdG9yXG4gICAgbGV0IHZhbGlkYXRvciA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hVmFsaWRhdG9yLCB0YXJnZXQpIGFzIFZhbGlkYXRlRnVuY3Rpb24gfCB1bmRlZmluZWRcbiAgICAvLyBDcmVhdGUgYSBuZXcgdmFsaWRhdG9yIGlmIG9uZSBoYXMgbm90IGFscmVhZHkgYmVlbiBjcmVhdGVkXG4gICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgdmFsaWRhdG9yID0gY3JlYXRlU2NoZW1hVmFsaWRhdG9yKHRhcmdldClcbiAgICAgICAgaWYgKHZhbGlkYXRvcikge1xuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWFWYWxpZGF0b3IsIHZhbGlkYXRvciwgdGFyZ2V0KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgLy8gTm8gdmFsaWRhdG9yIChzaG91bGQgbm90IGhhcHBlbilcbiAgICBpZiAoIXZhbGlkYXRvcikge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIEF0dGVtcHQgdmFsaWRhdGlvbiBhbmQgcmVwb3J0IGVycm9yc1xuICAgIGNvbnN0IHZhbGlkYXRvclJlc3VsdCA9IHZhbGlkYXRvcihqc29uKVxuICAgIGlmICh0eXBlb2YgdmFsaWRhdG9yUmVzdWx0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgaWYgKCF2YWxpZGF0b3JSZXN1bHQpIHtcbiAgICAgICAgICAgIC8vIENvbGxlY3QgdGhlIGVycm9ycyBwcm9kdWNlZCBieSB0aGUgdmFsaWRhdG9yXG4gICAgICAgICAgICBjb25zdCBlcnJvcnMgPSB2YWxpZGF0b3IuZXJyb3JzXG4gICAgICAgICAgICBjb25zdCB2YWxpZGF0aW9uRXJyb3JzOiBKc29uVmFsaWRhdGlvbkVycm9yW10gPSBbXVxuICAgICAgICAgICAgaWYgKGVycm9ycykge1xuICAgICAgICAgICAgICAgIGVycm9ycy5tYXAoKGVycm9yOiBFcnJvck9iamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBsZXQgYWp2RXJyb3I6IEVycm9yT2JqZWN0IHwgdW5kZWZpbmVkID0gZXJyb3JcblxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgZXhwbGljaXQgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRlbXBsYXRlRXJyb3JNZXNzYWdlOiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgbGV0IHByb3BlcnR5UGF0aDogc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGxldCBmb3JtYXRFcnJvck1lc3NhZ2UgPSBmYWxzZVxuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyb3Iua2V5d29yZCA9PT0gJ2Vycm9yTWVzc2FnZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHBhcmFtczogYW55ID0gZXJyb3IucGFyYW1zXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpwcmVmZXItY29uZGl0aW9uYWwtZXhwcmVzc2lvblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCdlcnJvcnMnIGluIHBhcmFtcyAmJiBBcnJheS5pc0FycmF5KHBhcmFtcy5lcnJvcnMpICYmIHBhcmFtcy5lcnJvcnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqdkVycm9yID0gcGFyYW1zLmVycm9yc1swXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9IGNvbnZlcnRKc29uUG9pbnRlclRvS2V5UGF0aChhanZFcnJvciEuZGF0YVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2hvdWxkIGZvcm1hdCB0aGUgZXJyb3IgbWVzc2FnZXNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3JtYXRFcnJvck1lc3NhZ2UgPSB0cnVlXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFqdkVycm9yID0gdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gJz8/PydcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UhXG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgoZXJyb3IuZGF0YVBhdGgpXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IHByb3BlcnR5UGF0aFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8gYCcke3Byb3BlcnR5UGF0aH0nICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgOiB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IGBPYmplY3QgJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChhanZFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSXQncyBwb3NzaWJsZSBmb3IgdGhlIGVycm9yIHBhcmFtZXRlciB0byBiZSBhbiBhcnJheS5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRvIHBsYXkgaXQgc2FmZSwgZW5zdXJlIHdlIGhhdmUgYW4gYXJyYXkgdG8gaXRlcmF0ZSBvdmVyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBlcnJvclBhcmFtczogYW55W10gPSBbXS5jb25jYXQoYWp2RXJyb3IucGFyYW1zIGFzIGFueSlcbiAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUGFyYW1zLmZvckVhY2goZXJyb3JQYXJhbSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFhanZFcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ2RlcGVuZGVuY2llcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBwcm9wZXJ0eVBhdGggPyBgJHtwcm9wZXJ0eVBhdGh9LiR7ZXJyb3JQYXJhbS5wcm9wZXJ0eX1gIDogZXJyb3JQYXJhbS5wcm9wZXJ0eVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBIYWNrIHRvIGVuc3VyZSB0aGVyZSBpcyBhbHdheXMgYSBwcm9wZXJ0eSBwYXRoIHZhcmlhYmxlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yUGFyYW0ucHJvcGVydHlQYXRoID0gcHJvcGVydHlQYXRoXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZXJyb3JNZXNzYWdlID0gU3RyaW5nKHRlbXBsYXRlRXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmb3JtYXRFcnJvck1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdGVtcGxhdGVSZWdFeCA9IC8oe3soW2EtejAtOVxcLV9dKyl9fSkvZ2lcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IG1hdGNoID0gdGVtcGxhdGVSZWdFeC5leGVjKGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hpbGUgKG1hdGNoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwcm9wZXJ0eSA9IG1hdGNoWzJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgaW4gZXJyb3JQYXJhbSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCB2YWx1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSA9PT0gJ3Byb3BlcnR5UGF0aCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWVycm9yUGFyYW1bcHJvcGVydHldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9ICdvYmplY3QnXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gYCcke2Vycm9yUGFyYW1bcHJvcGVydHldfSdgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSA9IGAke2Vycm9yTWVzc2FnZS5zbGljZSgwLCBtYXRjaC5pbmRleCl9YCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7dmFsdWV9YCArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYCR7ZXJyb3JNZXNzYWdlLnNsaWNlKHRlbXBsYXRlUmVnRXgubGFzdEluZGV4KX1gXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoID0gdGVtcGxhdGVSZWdFeC5leGVjKGVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhanZFcnJvci5rZXl3b3JkID09PSAncmVxdWlyZWQnIHx8IGFqdkVycm9yLmtleXdvcmQgPT09ICdkZXBlbmRlbmNpZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25FcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBKc29uVmFsaWRhdG9yUHJvcGVydHlNaXNzaW5nRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlcnJvclBhcmFtIGFzIFJlcXVpcmVkUGFyYW1zKS5taXNzaW5nUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5VW5zdXBwb3J0ZWRFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIChlcnJvclBhcmFtIGFzIEFkZGl0aW9uYWxQcm9wZXJ0aWVzUGFyYW1zKS5hZGRpdGlvbmFsUHJvcGVydHksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5VmFsdWVFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWVGcm9tSnNvblBvaW50ZXIoYWp2RXJyb3IhLmRhdGFQYXRoLCBqc29uKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBUaHJvdyBhIHNpbmdsZSBlcnJvciB3aXRoIGFsbCB0aGUgc3BlY2lmaWMgdmFsaWRhdGlvblxuICAgICAgICAgICAgdGhyb3cgbmV3IEpzb25EZWNvZGVyVmFsaWRhdGlvbkVycm9yKHZhbGlkYXRpb25FcnJvcnMsIGpzb24pXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBUeXBlRXJyb3IoJ0FzeW5jIHNjaGVtYSB2YWxpZGF0aW9uIG5vdCBzdXBwb3J0ZWQnKVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlXG59XG5cbi8qKlxuICogQ3JlYXRlIGEgbmV3IHNjaGVtYSB2YWxpZGF0b3IgZm9yIGEgdGFyZ2V0LiBJZiB0aGUgdGFyZ2V0IGRvZXMgbm90IHN1cHBvcnQgSlNPTiBzY2hlbWEgbm8gdmFsaWRhdG9yIGZ1bmN0aW9uIHdpbGwgYmUgcmV0dXJuZWRcbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IC0gdGFyZ2V0IGNsYXNzIHRvIHRha2UgZGVmaW5lZCBzY2hlbWEsIGFuZCBzY2hlbWEgcmVmZXJlbmNlcyBmcm9tXG4gKiBAcmV0dXJucyB2YWxpZGF0b3IgZnVuY3Rpb24gdG8gdmFsaWRhdGUgc2NoZW1hcyB3aXRoLCBvciB1bmRlZmluZWQgaWYgdGhlcmUgaXMgbm8gdmFsaWRhdGlvbiBuZWVkZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlU2NoZW1hVmFsaWRhdG9yKHRhcmdldDogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpOiBhanYuVmFsaWRhdGVGdW5jdGlvbiB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3QgbWV0YWRhdGFTY2hlbWE6IEpzb25EZWNvZGVyU2NoZW1hTWV0YWRhdGEgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KVxuICAgIGlmICghbWV0YWRhdGFTY2hlbWEpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIC8vIFNjaGVtYSBvcHRpb25zXG4gICAgY29uc3Qgc2NoZW1hQ29tcGlsZXIgPSBhanYoe1xuICAgICAgICBhbGxFcnJvcnM6IHRydWUsXG4gICAgICAgIGFzeW5jOiBmYWxzZSxcbiAgICAgICAgdmVyYm9zZTogdHJ1ZSxcbiAgICAgICAgZm9ybWF0OiAnZnVsbCcsXG4gICAgICAgIGpzb25Qb2ludGVyczogdHJ1ZSwgLy8gUmVxdWlyZWQgZm9yIGFqdkVycm9yc1xuICAgIH0pXG4gICAgYWp2RXJyb3JzKHNjaGVtYUNvbXBpbGVyKVxuXG4gICAgLy8gRmxhdHRlbiBhbGwgdGhlIHJlZmVyZW5jZXMgYW5kIGVuc3VyZSB0aGVyZSBpcyBvbmx5IG9uZSB2ZXJzaW9uIG9mIGVhY2hcbiAgICBjb25zdCByZWZlcmVuY2VTY2hlbWFzID0gZmxhdHRlblNjaGVtYVJlZmVyZW5jZXModGFyZ2V0KS5yZWR1Y2UoKHJlc3VsdCwgcmVmZXJlbmNlKSA9PiB7XG4gICAgICAgIGlmICghcmVzdWx0LmhhcyhyZWZlcmVuY2UuJGlkISkpIHtcbiAgICAgICAgICAgIHJlc3VsdC5zZXQocmVmZXJlbmNlLiRpZCEsIHJlZmVyZW5jZSlcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiByZXN1bHRcbiAgICB9LCBuZXcgTWFwPHN0cmluZywgSnNvbkRlY29kYWJsZVNjaGVtYT4oKSlcblxuICAgIC8vIEFkZCBhbGwgcmVmZXJlbmNlcyBhbmQgY29tcGlsZVxuICAgIGZvciAoY29uc3QgcmVmZXJlbmNlU2NoZW1hIG9mIHJlZmVyZW5jZVNjaGVtYXMudmFsdWVzKCkpIHtcbiAgICAgICAgc2NoZW1hQ29tcGlsZXIuYWRkU2NoZW1hKHJlZmVyZW5jZVNjaGVtYSlcbiAgICB9XG4gICAgY29uc3QgdmFsaWRhdG9yID0gc2NoZW1hQ29tcGlsZXIuY29tcGlsZShtZXRhZGF0YVNjaGVtYS5zY2hlbWEpXG5cbiAgICByZXR1cm4gdmFsaWRhdG9yXG59XG5cbi8qKlxuICogRmxhdHRlbnMgYWxsIHNjaGVtYSByZWZlcmVuY2VzIGZyb20gdGhlIHRhcmdldCBkb3duXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hIHJlZmVyZW5jZXMgZnJvbVxuICogQHBhcmFtIFtpbmNsdWRlUm9vdFNjaGVtYT1mYWxzZV0gLSBVc2VkIGZvciByZWN1cnNpb25cbiAqIEByZXR1cm5zIEZsYXR0ZW5lZCBzY2hlbWFzIHRvIGFkZCBhcyByZWZlcmVuY2UgZGVmaW5pdGlvbnNcbiAqL1xuZnVuY3Rpb24gZmxhdHRlblNjaGVtYVJlZmVyZW5jZXMoXG4gICAgdGFyZ2V0OiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCB8IEpzb25EZWNvZGFibGVTY2hlbWEsXG4gICAgaW5jbHVkZVJvb3RTY2hlbWE6IGJvb2xlYW4gPSBmYWxzZSk6IEpzb25EZWNvZGFibGVTY2hlbWFbXVxue1xuICAgIGNvbnN0IHNjaGVtYXM6IEpzb25EZWNvZGFibGVTY2hlbWFbXSA9IFtdXG5cbiAgICBjb25zdCBtZXRhZGF0YVNjaGVtYTogSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCB0YXJnZXQpXG4gICAgaWYgKG1ldGFkYXRhU2NoZW1hKSB7XG4gICAgICAgIGlmICghKCckc2NoZW1hJyBpbiBtZXRhZGF0YVNjaGVtYS5zY2hlbWEpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBNaXNzaW5nICckc2NoZW1hJyBkZWNsYXJhdGlvbiBpbiAke3RhcmdldC5uYW1lIHx8IHRhcmdldC4kaWR9IHNjaGVtYWApXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoaW5jbHVkZVJvb3RTY2hlbWEpIHtcbiAgICAgICAgICAgIGNvbnN0IG11dGFibGVTY2hlbWE6IEpzb25EZWNvZGFibGVTY2hlbWEgPSB7Li4ubWV0YWRhdGFTY2hlbWEuc2NoZW1hfVxuICAgICAgICAgICAgaWYgKCFtdXRhYmxlU2NoZW1hLiRpZCkge1xuICAgICAgICAgICAgICAgIC8vIFVzZSB0aGUgdGFyZ2V0IG5hbWUgYXMgdGhlIElEXG4gICAgICAgICAgICAgICAgbXV0YWJsZVNjaGVtYS4kaWQgPSBgIy8ke3RhcmdldC5uYW1lfWBcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNjaGVtYXMucHVzaChtdXRhYmxlU2NoZW1hKVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRmxhdHRlbiByZWZlcmVuY2Ugc2NoZW1hcy5cbiAgICAgICAgLy8gVGhlc2UgY291bGQgYmUgY2xhc3MgZGVjbGFyYXRpb25zIHdpdGggc2NoZW1hcyBhdHRhY2hlZCBvciBzY2hlbWFzIHRoZW1zZWx2ZXNcbiAgICAgICAgaWYgKG1ldGFkYXRhU2NoZW1hLnJlZmVyZW5jZXMgJiYgQXJyYXkuaXNBcnJheShtZXRhZGF0YVNjaGVtYS5yZWZlcmVuY2VzKSkge1xuICAgICAgICAgICAgbWV0YWRhdGFTY2hlbWEucmVmZXJlbmNlcy5mb3JFYWNoKHJlZmVyZW5jZSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCEhUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHJlZmVyZW5jZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hcy5wdXNoKC4uLmZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKHJlZmVyZW5jZSwgdHJ1ZSkpXG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICgnJHNjaGVtYScgaW4gcmVmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaChyZWZlcmVuY2UgYXMgSnNvbkRlY29kYWJsZVNjaGVtYSlcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBNaXNzaW5nICckc2NoZW1hJyBkZWNsYXJhdGlvbiBpbiBzY2hlbWEgcmVmZXJlbmNlcyBmb3IgJHt0YXJnZXQubmFtZX1gKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBFbnVtZXJhdGlvbiB0aGUgZGVjb2RlciBtYXAgdG8gYXV0b21hdGljYWxseSBpbmplY3Qgc2NoZW1hIHJlZmVyZW5jZXNcbiAgICAgICAgY29uc3QgZGVjb2Rlck1hcCA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyTWFwLCB0YXJnZXQpIGFzIERlY29kZXJNYXAgfCB1bmRlZmluZWRcbiAgICAgICAgaWYgKGRlY29kZXJNYXApIHtcbiAgICAgICAgICAgIGZvciAoY29uc3Qga2V5IG9mIFJlZmxlY3Qub3duS2V5cyhkZWNvZGVyTWFwKSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hcEVudHkgPSBSZWZsZWN0LmdldChkZWNvZGVyTWFwLCBrZXkpXG4gICAgICAgICAgICAgICAgaWYgKG1hcEVudHkgJiYgbWFwRW50eS50eXBlICYmIFJlZmxlY3QuaGFzTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCBtYXBFbnR5LnR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaCguLi5mbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyhtYXBFbnR5LnR5cGUgYXMgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQsIHRydWUpKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBzY2hlbWFzXG59XG5cbi8qKlxuICogRXh0cmFjdHMgdGhlIHZhbHVlIGZyb20gYSBqc29uIG9iamVjdCBiYXNlZCBvbiBhIEpTT04gcG9pbnRlciBwYXRoXG4gKlxuICogQHBhcmFtIHBvaW50ZXIgLSBwb2ludGVyIHBhdGhcbiAqIEBwYXJhbSBqc29uIC0gc291cmNlIEpTT04gb2JqZWN0XG4gKiBAcmV0dXJucyBhIHZhbHVlLCBvciB1bmRlZmluZWQgaWYgbm90IGF2YWlsYWJsZVxuICovXG5mdW5jdGlvbiB2YWx1ZUZyb21Kc29uUG9pbnRlcihwb2ludGVyOiBzdHJpbmcsIGpzb246IEpzb25PYmplY3QpOiBhbnkge1xuICAgIGNvbnN0IGtleXMgPSBwb2ludGVyLnNwbGl0KCcvJykuZmlsdGVyKHBhcnQgPT4gISFwYXJ0KVxuXG4gICAgbGV0IHZhbHVlID0ganNvblxuICAgIHdoaWxlIChrZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5cy5zaGlmdCgpIVxuICAgICAgICBpZiAoIShrZXkgaW4gdmFsdWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICB2YWx1ZSA9IHZhbHVlW2tleV1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBDb252ZXJ0cyBhIEpTT04gcG9pbnRlciBwYXRoIHRvIGEga2V5IHBhdGggdGhhdCBpcyBtb3JlIGh1bWFuIGZyaWVuZGx5XG4gKlxuICogQHBhcmFtIHBvaW50ZXIgLSBwb2ludGVyIHBhdGhcbiAqIEBwYXJhbSBvdGhlcktleXMgLSBvdGhlciBrZXlzIHRvIGFwcGVuZCB0byB0aGUgcmVzdWx0IGtleSBwYXRoXG4gKiBAcmV0dXJucyBKU09OIGtleSBwYXRoXG4gKi9cbmZ1bmN0aW9uIGNvbnZlcnRKc29uUG9pbnRlclRvS2V5UGF0aChwb2ludGVyOiBzdHJpbmcsIC4uLm90aGVyS2V5czogc3RyaW5nW10pOiBzdHJpbmcge1xuICAgIGNvbnN0IHBhcnRzID0gcG9pbnRlci5zcGxpdCgnLycpLmZpbHRlcihwYXJ0ID0+ICEhcGFydClcbiAgICBpZiAob3RoZXJLZXlzICYmIG90aGVyS2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIHBhcnRzLnB1c2goLi4ub3RoZXJLZXlzKVxuICAgIH1cblxuICAgIGxldCBkb3RQYXRoID0gJydcbiAgICB3aGlsZSAocGFydHMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBwYXJ0ID0gcGFydHMuc2hpZnQoKSFcbiAgICAgICAgaWYgKC9eWzAtOV0rJC8udGVzdChwYXJ0KSkge1xuICAgICAgICAgICAgZG90UGF0aCArPSBgWyR7cGFydH1dYFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKGRvdFBhdGgubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIGRvdFBhdGggKz0gJy4nXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBkb3RQYXRoICs9IHBhcnRcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkb3RQYXRoXG59XG4iXX0=