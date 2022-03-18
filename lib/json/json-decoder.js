"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonDecoder = void 0;
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
    let validator = Reflect.getOwnMetadata(json_symbols_1.JsonDecoderMetadataKeys.schemaValidator, target);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUlBLDRCQUF5QjtBQUV6QiwyQkFBMEI7QUFFMUIsd0NBQXVDO0FBSXZDLDBFQUE4RjtBQUM5RiwwRUFBd0g7QUFDeEgsd0RBQXlGO0FBR3pGLDREQUEyRjtBQUczRiwrREFBa0U7QUFFbEUsaURBQXdEO0FBQ3hELHFFQUErRjtBQUMvRixxRUFBbUg7QUFNbkgsTUFBYSxXQUFXO0lBT3BCLE1BQU0sQ0FBQyxNQUFNLENBQW1CLGNBQW1DLEVBQUUsU0FBa0M7O1FBQ25HLElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFBO1NBQ2Q7UUFHRCxJQUFJLE1BQWMsQ0FBQTtRQUNsQixJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUVwQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQWUsQ0FBQTtTQUNwRDthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUU7WUFFNUUsTUFBTSxHQUFHLGNBQWMsQ0FBQTtTQUMxQjthQUFNO1lBQ0gsTUFBTSxJQUFJLFNBQVMsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1NBQ3hFO1FBRUQsSUFBSSxZQUFrQyxDQUFBO1FBR3RDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsMENBQW1CLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBeUIsQ0FBQTtRQUNoSCxJQUFJLGFBQWEsRUFBRTtZQUNmLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQU0sQ0FBQTtZQUd6RCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE9BQU8sSUFB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LEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNqQixPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDckI7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNoQixDQUFDO0FBU0QsU0FBUywyQkFBMkIsQ0FBQyxPQUFlLEVBQUUsR0FBRyxTQUFtQjtJQUN4RSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2RCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUE7S0FDM0I7SUFFRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFDaEIsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNyQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFHLENBQUE7UUFDM0IsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBO1NBQ3pCO2FBQU07WUFDSCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixPQUFPLElBQUksR0FBRyxDQUFBO2FBQ2pCO1lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQTtTQUNsQjtLQUNKO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSlNPTiBzcGVjaWZpYyBkZWNvZGVyIGFuZCBkZWNvcmF0b3JzXG4gKi9cblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJ1xuXG5pbXBvcnQgKiBhcyBhanYgZnJvbSAnYWp2J1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICogYXMgYWp2RXJyb3JzIGZyb20gJ2Fqdi1lcnJvcnMnXG5cbmltcG9ydCB7IEFkZGl0aW9uYWxQcm9wZXJ0aWVzUGFyYW1zLCBFcnJvck9iamVjdCwgUmVxdWlyZWRQYXJhbXMsIFZhbGlkYXRlRnVuY3Rpb24gfSBmcm9tICdhanYnXG5cbmltcG9ydCB7IERlY29kZXJNZXRhZGF0YUtleXMsIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLWRlY2xhcmF0aW9ucydcbmltcG9ydCB7IERlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCwgaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItZGVjbGFyYXRpb25zJ1xuaW1wb3J0IHsgRGVjb2Rlck1hcCwgRGVjb2Rlck1hcEVudHJ5LCBkZWNvZGVyTWFwRm9yVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLW1hcCdcblxuaW1wb3J0IHsgQ29sbGVjdGlvbk1hcnNoYWxsZXJGdW5jdGlvbiwgTWFyc2hhbGxlckZ1bmN0aW9uIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWFyc2hhbGxlckZvclR5cGUsIG1hcnNoYWxsZXJGb3JUeXBlIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5cbmltcG9ydCB7IEpzb25PYmplY3QgfSBmcm9tICcuL2pzb24tZGVjb2RhYmxlLXR5cGVzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuL2pzb24tZGVjb2Rlci1lcnJvcnMnXG5pbXBvcnQgeyBKc29uRGVjb2RhYmxlT3B0aW9ucywgSnNvbkRlY29kYWJsZVNjaGVtYSwgSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSB9IGZyb20gJy4vanNvbi1kZWNvcmF0b3JzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJNZXRhZGF0YUtleXMgfSBmcm9tICcuL2pzb24tc3ltYm9scydcbmltcG9ydCB7IEpzb25WYWxpZGF0aW9uRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVZhbHVlRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5pbXBvcnQgeyBKc29uVmFsaWRhdG9yUHJvcGVydHlNaXNzaW5nRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVVuc3VwcG9ydGVkRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5cbi8qKlxuICogSlNPTiBkZWNvZGVyIGZvciBKU09OIGRlY29kYWJsZSBjbGFzc2VzXG4gKi9cbi8vIHRzbGludDpkaXNhYmxlOm5vLXVubmVjZXNzYXJ5LWNsYXNzXG5leHBvcnQgY2xhc3MgSnNvbkRlY29kZXIge1xuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBKU09OIG9iamVjdCBvciBTdHJpbmcgcmV0dXJuaW5nIGJhY2sgdGhlIG9iamVjdCBpZiBpdCB3YXMgYWJsZSB0byBiZSBkZWNvZGVkXG4gICAgICogQHBhcmFtIG9iamVjdE9yU3RyaW5nIC0gYXJyYXkgb3Igc3RyaW5nIChjb250YWluIEpTT04gb2JqZWN0KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlIC0gZGVjb2RhYmxlIHR5cGUgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYSBkZWNvZGVkIG9iamVjdCBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGU8VCBleHRlbmRzIG9iamVjdD4ob2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3QsIGNsYXNzVHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpOiBUIHwgbnVsbCB7XG4gICAgICAgIGlmIChvYmplY3RPclN0cmluZyA9PT0gbnVsbCB8fCBvYmplY3RPclN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXh0cmFjdCBvdXIgSlNPTiBvYmplY3RcbiAgICAgICAgbGV0IG9iamVjdDogb2JqZWN0XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBXaWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgSlNPTiBoYXMgYSBzeW50YXggZXJyb3JcbiAgICAgICAgICAgIG9iamVjdCA9IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpIGFzIEpzb25PYmplY3RcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iamVjdE9yU3RyaW5nKSB8fCB0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAvLyBBcnJheXMgYXJlIG9iamVjdHMgdG9vLCBhbmQgY2FuIGJlIHF1ZXJpZWQgd2l0aCBAMC52YWx1ZVxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0T3JTdHJpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RlY29kZShvYmplY3QpIHNob3VsZCBiZSBhbiBPYmplY3Qgb3IgYSBTdHJpbmcnKVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlY29kZU9iamVjdDogVCB8IHVuZGVmaW5lZCB8IG51bGxcblxuICAgICAgICAvLyBDcmVhdGUgb3VyIGRlY29kaW5nIG9iamVjdCB1c2luZyBhIGRlY29kZXIgZnVuY3Rpb24gaWYgcmVnaXN0ZXJlZFxuICAgICAgICBjb25zdCBvYmplY3RGYWN0b3J5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJGYWN0b3J5LCBjbGFzc1R5cGUpIGFzIEZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChvYmplY3RGYWN0b3J5KSB7XG4gICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBvYmplY3RGYWN0b3J5LmNhbGwoY2xhc3NUeXBlLCBvYmplY3QpIGFzIFRcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdpdGggYSBuZXcgb2JqZWN0IGNhbiBjb21lIGEgbmV3IGRlY29kZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NUeXBlID0gZGVjb2RlT2JqZWN0LmNvbnN0cnVjdG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlY29kZU9iamVjdCkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGVPcHRpb25zLCBjbGFzc1R5cGUpIGFzIEpzb25EZWNvZGFibGVPcHRpb25zIHwgdW5kZWZpbmVkXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiAob3B0aW9ucy51c2VDb25zdHJ1Y3RvciA/PyBmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25zdHJ1Y3RhYmxlID0gY2xhc3NUeXBlIGFzIE9iamVjdENvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0ID0gbmV3IGNvbnN0cnVjdGFibGUoKSBhcyBUXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBvYmplY3QsIHdpdGhvdXQgY2FsbGluZyB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBPYmplY3QuY3JlYXRlKGNsYXNzVHlwZS5wcm90b3R5cGUpIGFzIFRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoZSBKU09OXG4gICAgICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgbm90IHZhbGlkXG4gICAgICAgIHZhbGlkYXRlZFNvdXJjZUpzb24oY2xhc3NUeXBlLCBvYmplY3QpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBjb250ZXh0IG5lZWRzIHRvIGJlIHNldFxuICAgICAgICBjb25zdCBjb250ZXh0S2V5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5jb250ZXh0LCBjbGFzc1R5cGUpIGFzIHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICBpZiAoY29udGV4dEtleSAhPT0gdW5kZWZpbmVkICYmIGNvbnRleHRLZXkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShkZWNvZGVPYmplY3QsIGNvbnRleHRLZXksIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogb2JqZWN0LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW4sIGFkZGluZyB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb25zIGluIHJldmVyc2Ugb3JkZXJcbiAgICAgICAgY29uc3QgY2xhc3NDb25zdHJ1Y3RvcnM6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0W10gPSBbXVxuICAgICAgICBsZXQgcHJvdG90eXBlID0gY2xhc3NUeXBlLnByb3RvdHlwZVxuICAgICAgICB3aGlsZSAocHJvdG90eXBlICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICAgICAgICBpZiAoISFSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCBwcm90b3R5cGUuY29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NDb25zdHJ1Y3RvcnMudW5zaGlmdChwcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm90b3R5cGUgPSBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSkhXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGNsYXNzIGhlaXJhcmNoeVxuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdG9yIG9mIGNsYXNzQ29uc3RydWN0b3JzKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgYSBiZWZvcmUgZGVjb2RlIGZ1bmN0aW9uIG9uIGEgY29uc3RydWN0b3IgZnVuY3Rpb24ncyBwcm90b3R5cGVcbiAgICAgICAgICAgIGNvbnN0IGRlY29kZXIgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RlciwgY29uc3RydWN0b3IucHJvdG90eXBlKSBhcyBGdW5jdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZXIpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBhbHRlcm5hdGl2ZURlY29kZU9iamVjdCA9IGRlY29kZXIuY2FsbChkZWNvZGVPYmplY3QsIG9iamVjdClcbiAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICAgICAgaWYgKGFsdGVybmF0aXZlRGVjb2RlT2JqZWN0ID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBMb29rIHVwIGRlY29kZXIgbWFwIGZvciB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IGRlY29kZXJNYXAgPSBkZWNvZGVyTWFwRm9yVGFyZ2V0KGNvbnN0cnVjdG9yKVxuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgUmVmbGVjdC5vd25LZXlzKGRlY29kZXJNYXApKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFwRW50cnkgPSBSZWZsZWN0LmdldChkZWNvZGVyTWFwLCBrZXkpIGFzIERlY29kZXJNYXBFbnRyeVxuICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXZhbHVhdGVQcm9wZXJ0eVZhbHVlKG9iamVjdCwgbWFwRW50cnksIGRlY29kZU9iamVjdClcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICBSZWZsZWN0LnNldChkZWNvZGVPYmplY3QsIGtleSwgdmFsdWUpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBjbGFzcyBoZWlyYXJjaHkgZm9yIHByb3RvdHlwZSBkZWNvZGVycywgdGhpcyB0aW1lIGNhbGxpbmcgYWxsIHRoZSBwcm9wZXJ0eSBub3RpZmllcnNcbiAgICAgICAgLy8gVGhpcyBpcyBkb25lIGFmdGVyIGFsbCBtYXBwZWQgcHJvcGVydGllcyBoYXZlIGJlZW4gYXNzaWduZWRcbiAgICAgICAgZm9yIChjb25zdCBjb25zdHJ1Y3RvciBvZiBjbGFzc0NvbnN0cnVjdG9ycykge1xuICAgICAgICAgICAgY29uc3QgcHJvcGVydHlOb3RpZmllcnMgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKFxuICAgICAgICAgICAgICAgIERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2Rlck5vdGlmaWVycyxcbiAgICAgICAgICAgICAgICBjb25zdHJ1Y3RvcixcbiAgICAgICAgICAgICkgYXMgTWFwPHN0cmluZywgRGVjb2Rlck1hcEVudHJ5W10+IHwgdW5kZWZpbmVkXG5cbiAgICAgICAgICAgIGlmIChwcm9wZXJ0eU5vdGlmaWVycykge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3QgaGFuZGxlcnMgb2YgcHJvcGVydHlOb3RpZmllcnMudmFsdWVzKCkpIHtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVyIG9mIGhhbmRsZXJzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB2YWx1ZSA9IGV2YWx1YXRlUHJvcGVydHlWYWx1ZShcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBrZXk6IGhhbmRsZXIua2V5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBoYW5kbGVyLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QsXG4gICAgICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRPRE86IENhcHR1cmUgZXJyb3JzIGZyb20gaGFuZGxlcnNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBoYW5kbGVyLm1hcEZ1bmN0aW9uIS5jYWxsKGRlY29kZU9iamVjdCwgdmFsdWUsIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5IGZvciBwcm90b3R5cGUgZGVjb2RlcnMsIGNhbGxpbmcgdGhlIGRlY29kZXIgY29tcGxldGUgZnVuY3Rpb25cbiAgICAgICAgLy8gVGhpcyBkb25lIGFmdGVyIGFsbCBwb3RlbnRpYWwgYXNzaWdtZW50c1xuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdG9yIG9mIGNsYXNzQ29uc3RydWN0b3JzKSB7XG4gICAgICAgICAgICAvLyBDaGVjayBmb3IgYSBhZnRlciBkZWNvZGUgcHJvdG90eXBlIGZ1bmN0aW9uXG4gICAgICAgICAgICBjb25zdCBkZWNvZGVyQ29tcGxldGUgPSBSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RlckNvbXBsZXRlZCwgY29uc3RydWN0b3IucHJvdG90eXBlKVxuICAgICAgICAgICAgaWYgKGRlY29kZXJDb21wbGV0ZSkge1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGNvbXBsZXRlT2JqZWN0OiBhbnkgPSBkZWNvZGVyQ29tcGxldGUuY2FsbChkZWNvZGVPYmplY3QsIG9iamVjdClcbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVPYmplY3QgPT09IG51bGwgfHwgY29tcGxldGVPYmplY3QgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBzd2FwcGVkIGRlY29kZSBvYmplY3RcbiAgICAgICAgICAgICAgICAgICAgaWYgKGNvbXBsZXRlT2JqZWN0ICYmIGNvbXBsZXRlT2JqZWN0ICE9PSBkZWNvZGVPYmplY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlY29kZU9iamVjdCA9IGNvbXBsZXRlT2JqZWN0XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVyciBpbnN0YW5jZW9mIEpzb25WYWxpZGF0aW9uRXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25FcnJvciA9IG5ldyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvcihbZXJyXSwgb2JqZWN0LCAnSlNPTiB2YWxpZGF0aW9uIGZhaWxlZCBwb3N0IGRlY29kZScpXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyB2YWxpZGF0aW9uRXJyb3JcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHRocm93IGVyclxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWNvZGVPYmplY3QhXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhIEpTT04gb2JqZWN0IG9yIFN0cmluZyByZXR1cm5pbmcgYmFjayB0aGUgb2JqZWN0IGlmIGl0IHdhcyBhYmxlIHRvIGJlIGRlY29kZWRcbiAgICAgKiBAcGFyYW0gb2JqZWN0T3JTdHJpbmcgLSBhcnJheSBvciBzdHJpbmcgKGNvbnRhaW4gSlNPTiBhcnJheSkgdG8gZGVjb2RlXG4gICAgICogQHBhcmFtIGNsYXNzVHlwZSAtIGRlY29kYWJsZSB0eXBlIHRvIGRlY29kZSBKU09OIGludG9cbiAgICAgKiBAcmV0dXJuIGFuIGFycmF5IG9mIGRlY29kZWQgb2JqZWN0cyBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGVBcnJheTxUIGV4dGVuZHMgb2JqZWN0PihcbiAgICAgICAgb2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3RbXSxcbiAgICAgICAgY2xhc3NUeXBlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCxcbiAgICApOiBbVF0gfCBudWxsIHtcbiAgICAgICAgaWYgKG9iamVjdE9yU3RyaW5nID09PSBudWxsIHx8IG9iamVjdE9yU3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBsZXQgb2JqZWN0czogb2JqZWN0W11cbiAgICAgICAgaWYgKHR5cGVvZiBvYmplY3RPclN0cmluZyA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBKU09OLnBhcnNlKG9iamVjdE9yU3RyaW5nKVxuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0T3JTdHJpbmcpKSB7XG4gICAgICAgICAgICBvYmplY3RzID0gb2JqZWN0T3JTdHJpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RlY29kZShvYmplY3QpIHNob3VsZCBiZSBhbiBBcnJheSBvZiBPYmplY3RzIG9yIGEgU3RyaW5nJylcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvYmplY3RzLm1hcDxUIHwgbnVsbD4oKG9iamVjdCkgPT4gdGhpcy5kZWNvZGU8VD4ob2JqZWN0LCBjbGFzc1R5cGUpKS5maWx0ZXIoKG9iamVjdCkgPT4gISFvYmplY3QpIGFzIFtUXVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBKU09OIG9iamVjdCBvciBTdHJpbmcgcmV0dXJuaW5nIGJhY2sgYSBtYXAgd2l0aCBrZXkgYXMgdGhlXG4gICAgICoganNvbiBrZXkgYW5kIHZhbHVlIGRlY29kZWQgdG8gdGhlIGRlY29kYWJsZSB0eXBlIHBhc3NlZCBpbiB0aGUgaW5wdXRcbiAgICAgKiBAcGFyYW0gb2JqZWN0T3JTdHJpbmcgLSBhcnJheSBvciBzdHJpbmcgKGNvbnRhaW4gSlNPTiBhcnJheSkgdG8gZGVjb2RlXG4gICAgICogQHBhcmFtIGNsYXNzVHlwZU9mVmFsdWUgLSBkZWNvZGFibGUgdHlwZSBvZiBqc29uIHZhbHVlcyB0byBkZWNvZGUgSlNPTiBpbnRvXG4gICAgICogQHJldHVybiBhIE1hcCB3aXRoIHRoZSB2YWx1ZSBjb250YWluaW5nIGRlY29kZWQgb2JqZWN0cyBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGVNYXA8VCBleHRlbmRzIG9iamVjdD4oXG4gICAgICAgIG9iamVjdE9yU3RyaW5nOiBzdHJpbmcgfCBKc29uT2JqZWN0LFxuICAgICAgICBjbGFzc1R5cGVPZlZhbHVlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCxcbiAgICApOiBNYXA8c3RyaW5nLCBUPiB8IG51bGwgIHtcbiAgICAgICAgaWYgKG9iamVjdE9yU3RyaW5nID09PSBudWxsIHx8IG9iamVjdE9yU3RyaW5nID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBpbnB1dE9iamVjdDogSnNvbk9iamVjdCA9ICh0eXBlb2Yob2JqZWN0T3JTdHJpbmcpID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgID8gSlNPTi5wYXJzZShvYmplY3RPclN0cmluZylcbiAgICAgICAgICAgIDogb2JqZWN0T3JTdHJpbmdcblxuICAgICAgICBjb25zdCBkZWNvZGVkTWFwOiBNYXA8c3RyaW5nLCBUID4gPSBuZXcgTWFwKClcbiAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgUmVmbGVjdC5vd25LZXlzKGlucHV0T2JqZWN0KSkge1xuICAgICAgICAgICAgY29uc3QgZGVjb2RlZFZhbHVlID0gdGhpcy5kZWNvZGU8VD4oaW5wdXRPYmplY3Rba2V5LnRvU3RyaW5nKCldLCBjbGFzc1R5cGVPZlZhbHVlKVxuICAgICAgICAgICAgaWYgKGRlY29kZWRWYWx1ZSkge1xuICAgICAgICAgICAgICAgIGRlY29kZWRNYXAuc2V0KGtleS50b1N0cmluZygpLCBkZWNvZGVkVmFsdWUpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZGVjb2RlZE1hcFxuICAgIH1cbn1cblxuXG5cbi8vXG4vLyBQcml2YXRlIGZ1bmN0aW9uc1xuLy9cblxuLyoqXG4gKiBDcmVhdGVzIGEgbWFyc2hhbGxlciBmb3IgYSBnaXZlbiB0eXBlIGRlY2xhcmF0aW9uIHRvIHVzZSBmb3IgY29udmVyc2lvblxuICpcbiAqIEBwYXJhbSB0eXBlIC0gZGVzaXJlZCBjb252ZXJzaW9uIHR5cGVcbiAqIEByZXR1cm4gY29udmVyc2lvbiBmdW5jdGlvbiBvciB1bmRlZmluZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlTWFyc2hhbGxlcih0eXBlOiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCB8IERlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCk6XG4gICAgKCh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiBhbnkpIHwgdW5kZWZpbmVkXG57XG4gICAgaWYgKGlzRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0KHR5cGUpKSB7XG4gICAgICAgIGxldCBjb2xsZWN0aW9uTWFyc2hhbGxlcjogQ29sbGVjdGlvbk1hcnNoYWxsZXJGdW5jdGlvbiB8IHVuZGVmaW5lZFxuICAgICAgICBpZiAoUmVmbGVjdC5nZXRPd25NZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZSwgdHlwZS5jb2xsZWN0aW9uKSkge1xuICAgICAgICAgICAgY29sbGVjdGlvbk1hcnNoYWxsZXIgPSAodmFsdWU6IGFueSwgaXRlbU1hcmhzYWxsZXI/OiBNYXJzaGFsbGVyRnVuY3Rpb24sIHN0cmljdD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnYm9vbGVhbidcbiAgICAgICAgICAgICAgICAgICAgfHwgdHlwZW9mIHZhbHVlID09PSAnbnVtYmVyJ1xuICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgICAgICAgIHx8ICh0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gSnNvbkRlY29kZXIuZGVjb2RlKHZhbHVlLCB0eXBlLmNvbGxlY3Rpb24pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgJHt0eXBlb2YgdmFsdWV9IGNhbm5vdCBiZSBjb252ZXJ0ZWQgdG8gJHt0eXBlLmNvbGxlY3Rpb24ubmFtZX1gKVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbGxlY3Rpb25NYXJzaGFsbGVyID0gY29sbGVjdGlvbk1hcnNoYWxsZXJGb3JUeXBlKHR5cGUuY29sbGVjdGlvbilcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghY29sbGVjdGlvbk1hcnNoYWxsZXIpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgZWxlbWVudE1hcnNoYWxsZXIgPSBjcmVhdGVNYXJzaGFsbGVyKHR5cGUuZWxlbWVudClcblxuICAgICAgICAvLyBJZiB0aGUgZWxlbWVudCB0eXBlIGlzIGRlY29kYWJsZVxuICAgICAgICBpZiAoIWVsZW1lbnRNYXJzaGFsbGVyICYmIFJlZmxlY3QuZ2V0TWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHR5cGUuZWxlbWVudCkpIHtcbiAgICAgICAgICAgIGVsZW1lbnRNYXJzaGFsbGVyID0gKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gSnNvbkRlY29kZXIuZGVjb2RlPHR5cGVvZiB0eXBlPih2YWx1ZSwgdHlwZS5lbGVtZW50IGFzIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0KVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICh2YWx1ZTogYW55LCBzdHJpY3Q/OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gY29sbGVjdGlvbk1hcnNoYWxsZXIhKHZhbHVlLCBlbGVtZW50TWFyc2hhbGxlciwgc3RyaWN0KVxuICAgICAgICB9XG4gICAgfSBlbHNlIGlmIChSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCB0eXBlKSkge1xuICAgICAgICByZXR1cm4gKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBKc29uRGVjb2Rlci5kZWNvZGU8dHlwZW9mIHR5cGU+KHZhbHVlLCB0eXBlKVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIG1hcnNoYWxsZXJGb3JUeXBlKHR5cGUpXG59XG5cbi8qKlxuICogRXZhbHVhdGVzIGEgcHJvcGVydHkgb2YgYW4gb2JqZWN0IChiZWluZyBkZWNvZGVkKSBiYXNlZCBvbiBhIG1hcCBlbnRyeSBmb3IgdGhlIGRlY29kZXIuXG4gKlxuICogQHBhcmFtIG9iamVjdCAtIG9iamVjdCBiZWluZyBkZWNvZGVkXG4gKiBAcGFyYW0gbWFwRW50cnkgLSBkZWNvZGVyIG1hcCBlbnRyeVxuICogQHBhcmFtIGRlY29kZU9iamVjdCAtIG9iamVjdCBiZWluZyBwb3B1bGF0ZWQgYnkgdGhlIGRlY29kZXJcbiAqIEBwYXJhbSBzdHJpY3QgLSB3aGVuIHRydWUsIHBhcnNpbmcgaXMgc3RyaWN0IGFuZCB0aHJvd3MgYSBUeXBlRXJyb3IgaWYgdGhlIHZhbHVlIGNhbm5vdCBiZSBjb252ZXJ0ZWRcbiAqIEByZXR1cm5zIGV2YWx1YXRlZCBwcm9wZXJ0eSB2YWx1ZVxuICpcbiAqIEB0aHJvd3MgVHlwZUVycm9yXG4gKi9cbmZ1bmN0aW9uIGV2YWx1YXRlUHJvcGVydHlWYWx1ZShcbiAgICBvYmplY3Q6IG9iamVjdCxcbiAgICBtYXBFbnRyeTogRGVjb2Rlck1hcEVudHJ5LFxuICAgIGRlY29kZU9iamVjdDogb2JqZWN0LFxuICAgIHN0cmljdDogYm9vbGVhbiA9IGZhbHNlLFxuKTogYW55IHtcbiAgICBpZiAoIW9iamVjdCkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuICAgIGlmICghbWFwRW50cnkpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIC8vIEVuc3VyZSBjb25zaXN0ZW50IHVzZSBvZiBEZWNvZGVyTWFwRW50cnlcbiAgICBsZXQgZGVjb2Rlck1hcEVudHJ5OiBEZWNvZGVyTWFwRW50cnlcbiAgICBpZiAodHlwZW9mIG1hcEVudHJ5ID09PSAnc3RyaW5nJykge1xuICAgICAgICBkZWNvZGVyTWFwRW50cnkgPSB7XG4gICAgICAgICAgICBrZXk6IG1hcEVudHJ5LFxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgZGVjb2Rlck1hcEVudHJ5ID0gbWFwRW50cnlcbiAgICB9XG5cbiAgICAvLyBMb29rIHVwIHRoZSBwcm9wZXJ0eSBrZXkgcGF0aCBpbiB0aGUgSlNPTiBvYmplY3RcbiAgICBjb25zdCBrZXlQYXRocyA9IGRlY29kZXJNYXBFbnRyeS5rZXkuc3BsaXQoL0B8XFwuLylcbiAgICBsZXQgdmFsdWU6IGFueSA9IG9iamVjdFxuICAgIGRvIHtcbiAgICAgICAgY29uc3QgcGF0aCA9IGtleVBhdGhzLnNoaWZ0KCkhXG4gICAgICAgIGlmICghcGF0aCkge1xuICAgICAgICAgICAgY29udGludWVcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIENhbiBvbmx5IGluc3BlY3Qgb2JqZWN0IHZhbHVlcywgZmFpbCBpZiB3ZSBjYW5ub3QgcmVzb2x2ZSB0aGUgdmFsdWVcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHZhbHVlICE9PSAnc3RyaW5nJyAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICAgIC8vIFRPRE86IFRocm93IGVycm9yP1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG4gICAgICAgIHZhbHVlID0gUmVmbGVjdC5nZXQodmFsdWUsIHBhdGgpXG4gICAgfSB3aGlsZSAoa2V5UGF0aHMubGVuZ3RoID4gMCAmJiB2YWx1ZSAhPT0gbnVsbCAmJiB2YWx1ZSAhPT0gdW5kZWZpbmVkKVxuXG4gICAgLy8gSWYgdGhlcmUgaXMgYW4gdW5kZWZpbmVkIHZhbHVlIHJldHVybiBpdCAoZG8gbm90IHJldHVybiBvbiBudWxsKVxuICAgIGlmICh2YWx1ZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICAvLyBDaGVjayBhbnkgdHlwZSBjb252ZXJzaW9uXG4gICAgaWYgKGRlY29kZXJNYXBFbnRyeS50eXBlKSB7XG4gICAgICAgIGNvbnN0IG1hcnNoYWxsZXIgPSBjcmVhdGVNYXJzaGFsbGVyKGRlY29kZXJNYXBFbnRyeS50eXBlKVxuICAgICAgICBpZiAobWFyc2hhbGxlcikge1xuICAgICAgICAgICAgdmFsdWUgPSBtYXJzaGFsbGVyKHZhbHVlLCBzdHJpY3QpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc3RyaWN0KSB7XG4gICAgICAgICAgICAgICAgY29uc3Qgcm9vdFR5cGUgPVxuICAgICAgICAgICAgICAgICAgICBpc0RlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldChkZWNvZGVyTWFwRW50cnkudHlwZSkgPyBkZWNvZGVyTWFwRW50cnkudHlwZS5jb2xsZWN0aW9uIDogZGVjb2Rlck1hcEVudHJ5LnR5cGVcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3Jvb3RUeXBlLm5hbWV9IGlzIG5vdCBhIEpTT04gZGVjb2RhYmxlIHR5cGVgKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cblxuICAgICAgICAvLyBJZiB0aGVyZSBpcyBubyB2YWx1ZSwgaXQgc2hvdWxkIGJlIHNraXBwZWRcbiAgICAgICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkZWNvZGVyTWFwRW50cnkubWFwRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIHZhbHVlID0gZGVjb2Rlck1hcEVudHJ5Lm1hcEZ1bmN0aW9uLmNhbGwoZGVjb2RlT2JqZWN0LCB2YWx1ZSwgb2JqZWN0KVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogVmFsaWRhdGVzIGEgc2NoZW1hIGRlZmluZWQgb24gYSB0YXJnZXQgYWdhaW5zdCB0aGUgc291cmNlIEpTT04uXG4gKiBJZiB0aGUgSlNPTiBpcyBub3QgdmFsaWQgdGhlbiBhIEpzb25EZWNvZGVyVmFsaWRhdG9yRXJyb3IgZXhjZXB0aW9uIGlzIHRocm93blxuICpcbiAqIEBwYXJhbSB0YXJnZXQgLSB0YXJnZXQgY2xhc3MgdG8gdGFrZSBkZWZpbmVkIHNjaGVtYSBmcm9tXG4gKiBAcGFyYW0ganNvbiAtIEpTT04gb2JqZWN0XG4gKiBAcmV0dXJucyB0cnVlIGlmIHRoZSBzY2hlbWEgd2FzIHZhbGlkIChKc29uRGVjb2RlclZhbGlkYXRvckVycm9yIGV4Y2VwdGlvbiB0aHJvd24gb3RoZXJ3aXNlKVxuICovXG5mdW5jdGlvbiB2YWxpZGF0ZWRTb3VyY2VKc29uKHRhcmdldDogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQsIGpzb246IEpzb25PYmplY3QpOiBib29sZWFuIHtcbiAgICAvLyBJZiB0aGVyZSBpcyBub3RoaW5nIHRvIHZhbGlkYXRlIHRoZW4gaXQncyB2YWxpZFxuICAgIGlmICghUmVmbGVjdC5oYXNNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHRhcmdldCkpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBGZXRjaCBhbiBleGlzdGluZyB2YWxpZGF0b3JcbiAgICBsZXQgdmFsaWRhdG9yID0gUmVmbGVjdC5nZXRPd25NZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWFWYWxpZGF0b3IsIHRhcmdldCkgYXMgVmFsaWRhdGVGdW5jdGlvbiB8IHVuZGVmaW5lZFxuICAgIC8vIENyZWF0ZSBhIG5ldyB2YWxpZGF0b3IgaWYgb25lIGhhcyBub3QgYWxyZWFkeSBiZWVuIGNyZWF0ZWRcbiAgICBpZiAoIXZhbGlkYXRvcikge1xuICAgICAgICB2YWxpZGF0b3IgPSBjcmVhdGVTY2hlbWFWYWxpZGF0b3IodGFyZ2V0KVxuICAgICAgICBpZiAodmFsaWRhdG9yKSB7XG4gICAgICAgICAgICBSZWZsZWN0LmRlZmluZU1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYVZhbGlkYXRvciwgdmFsaWRhdG9yLCB0YXJnZXQpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBObyB2YWxpZGF0b3IgKHNob3VsZCBub3QgaGFwcGVuKVxuICAgIGlmICghdmFsaWRhdG9yKSB7XG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgfVxuXG4gICAgLy8gQXR0ZW1wdCB2YWxpZGF0aW9uIGFuZCByZXBvcnQgZXJyb3JzXG4gICAgY29uc3QgdmFsaWRhdG9yUmVzdWx0ID0gdmFsaWRhdG9yKGpzb24pXG4gICAgaWYgKHR5cGVvZiB2YWxpZGF0b3JSZXN1bHQgPT09ICdib29sZWFuJykge1xuICAgICAgICBpZiAoIXZhbGlkYXRvclJlc3VsdCkge1xuICAgICAgICAgICAgLy8gQ29sbGVjdCB0aGUgZXJyb3JzIHByb2R1Y2VkIGJ5IHRoZSB2YWxpZGF0b3JcbiAgICAgICAgICAgIGNvbnN0IGVycm9ycyA9IHZhbGlkYXRvci5lcnJvcnNcbiAgICAgICAgICAgIGNvbnN0IHZhbGlkYXRpb25FcnJvcnM6IEpzb25WYWxpZGF0aW9uRXJyb3JbXSA9IFtdXG4gICAgICAgICAgICBpZiAoZXJyb3JzKSB7XG4gICAgICAgICAgICAgICAgZXJyb3JzLm1hcCgoZXJyb3I6IEVycm9yT2JqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGxldCBhanZFcnJvcjogRXJyb3JPYmplY3QgfCB1bmRlZmluZWQgPSBlcnJvclxuXG4gICAgICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBleHBsaWNpdCBlcnJvciBtZXNzYWdlc1xuICAgICAgICAgICAgICAgICAgICBsZXQgdGVtcGxhdGVFcnJvck1lc3NhZ2U6IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBsZXQgcHJvcGVydHlQYXRoOiBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZvcm1hdEVycm9yTWVzc2FnZSA9IGZhbHNlXG4gICAgICAgICAgICAgICAgICAgIGlmIChlcnJvci5rZXl3b3JkID09PSAnZXJyb3JNZXNzYWdlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcGFyYW1zOiBhbnkgPSBlcnJvci5wYXJhbXNcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOnByZWZlci1jb25kaXRpb25hbC1leHByZXNzaW9uXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoJ2Vycm9ycycgaW4gcGFyYW1zICYmIEFycmF5LmlzQXJyYXkocGFyYW1zLmVycm9ycykgJiYgcGFyYW1zLmVycm9ycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWp2RXJyb3IgPSBwYXJhbXMuZXJyb3JzWzBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gY29udmVydEpzb25Qb2ludGVyVG9LZXlQYXRoKGFqdkVycm9yIS5kYXRhUGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZUVycm9yTWVzc2FnZSA9IGVycm9yLm1lc3NhZ2UhXG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBTaG91bGQgZm9ybWF0IHRoZSBlcnJvciBtZXNzYWdlc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvcm1hdEVycm9yTWVzc2FnZSA9IHRydWVcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYWp2RXJyb3IgPSB1bmRlZmluZWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSAnPz8/J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZSFcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9IGNvbnZlcnRKc29uUG9pbnRlclRvS2V5UGF0aChlcnJvci5kYXRhUGF0aClcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRXJyb3JNZXNzYWdlID0gcHJvcGVydHlQYXRoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgPyBgJyR7cHJvcGVydHlQYXRofScgJHtlcnJvci5tZXNzYWdlfWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA6IHRlbXBsYXRlRXJyb3JNZXNzYWdlID0gYE9iamVjdCAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGFqdkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCdzIHBvc3NpYmxlIGZvciB0aGUgZXJyb3IgcGFyYW1ldGVyIHRvIGJlIGFuIGFycmF5LlxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gVG8gcGxheSBpdCBzYWZlLCBlbnN1cmUgd2UgaGF2ZSBhbiBhcnJheSB0byBpdGVyYXRlIG92ZXJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IGVycm9yUGFyYW1zOiBhbnlbXSA9IFtdLmNvbmNhdChhanZFcnJvci5wYXJhbXMgYXMgYW55KVxuICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQYXJhbXMuZm9yRWFjaChlcnJvclBhcmFtID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIWFqdkVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhanZFcnJvci5rZXl3b3JkID09PSAnZGVwZW5kZW5jaWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9IHByb3BlcnR5UGF0aCA/IGAke3Byb3BlcnR5UGF0aH0uJHtlcnJvclBhcmFtLnByb3BlcnR5fWAgOiBlcnJvclBhcmFtLnByb3BlcnR5XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhhY2sgdG8gZW5zdXJlIHRoZXJlIGlzIGFsd2F5cyBhIHByb3BlcnR5IHBhdGggdmFyaWFibGVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JQYXJhbS5wcm9wZXJ0eVBhdGggPSBwcm9wZXJ0eVBhdGhcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBlcnJvck1lc3NhZ2UgPSBTdHJpbmcodGVtcGxhdGVFcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZvcm1hdEVycm9yTWVzc2FnZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zdCB0ZW1wbGF0ZVJlZ0V4ID0gLyh7eyhbYS16MC05XFwtX10rKX19KS9naVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgbWF0Y2ggPSB0ZW1wbGF0ZVJlZ0V4LmV4ZWMoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aGlsZSAobWF0Y2gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gbWF0Y2hbMl1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChwcm9wZXJ0eSBpbiBlcnJvclBhcmFtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IHZhbHVlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5ID09PSAncHJvcGVydHlQYXRoJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghZXJyb3JQYXJhbVtwcm9wZXJ0eV0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gJ29iamVjdCdcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBgJyR7ZXJyb3JQYXJhbVtwcm9wZXJ0eV19J2BcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlID0gYCR7ZXJyb3JNZXNzYWdlLnNsaWNlKDAsIG1hdGNoLmluZGV4KX1gICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHt2YWx1ZX1gICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgJHtlcnJvck1lc3NhZ2Uuc2xpY2UodGVtcGxhdGVSZWdFeC5sYXN0SW5kZXgpfWBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2ggPSB0ZW1wbGF0ZVJlZ0V4LmV4ZWMoZXJyb3JNZXNzYWdlKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFqdkVycm9yLmtleXdvcmQgPT09ICdyZXF1aXJlZCcgfHwgYWp2RXJyb3Iua2V5d29yZCA9PT0gJ2RlcGVuZGVuY2llcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEpzb25WYWxpZGF0b3JQcm9wZXJ0eU1pc3NpbmdFcnJvcihcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGgsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVycm9yUGFyYW0gYXMgUmVxdWlyZWRQYXJhbXMpLm1pc3NpbmdQcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmIChhanZFcnJvci5rZXl3b3JkID09PSAnYWRkaXRpb25hbFByb3BlcnRpZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25FcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBKc29uVmFsaWRhdG9yUHJvcGVydHlVbnN1cHBvcnRlZEVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgKGVycm9yUGFyYW0gYXMgQWRkaXRpb25hbFByb3BlcnRpZXNQYXJhbXMpLmFkZGl0aW9uYWxQcm9wZXJ0eSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbGlkYXRpb25FcnJvcnMucHVzaChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ldyBKc29uVmFsaWRhdG9yUHJvcGVydHlWYWx1ZUVycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUZyb21Kc29uUG9pbnRlcihhanZFcnJvciEuZGF0YVBhdGgsIGpzb24pLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRocm93IGEgc2luZ2xlIGVycm9yIHdpdGggYWxsIHRoZSBzcGVjaWZpYyB2YWxpZGF0aW9uXG4gICAgICAgICAgICB0aHJvdyBuZXcgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IodmFsaWRhdGlvbkVycm9ycywganNvbilcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIHRocm93IFR5cGVFcnJvcignQXN5bmMgc2NoZW1hIHZhbGlkYXRpb24gbm90IHN1cHBvcnRlZCcpXG4gICAgfVxuXG4gICAgcmV0dXJuIHRydWVcbn1cblxuLyoqXG4gKiBDcmVhdGUgYSBuZXcgc2NoZW1hIHZhbGlkYXRvciBmb3IgYSB0YXJnZXQuIElmIHRoZSB0YXJnZXQgZG9lcyBub3Qgc3VwcG9ydCBKU09OIHNjaGVtYSBubyB2YWxpZGF0b3IgZnVuY3Rpb24gd2lsbCBiZSByZXR1cm5lZFxuICpcbiAqIEBwYXJhbSB0YXJnZXQgLSB0YXJnZXQgY2xhc3MgdG8gdGFrZSBkZWZpbmVkIHNjaGVtYSwgYW5kIHNjaGVtYSByZWZlcmVuY2VzIGZyb21cbiAqIEByZXR1cm5zIHZhbGlkYXRvciBmdW5jdGlvbiB0byB2YWxpZGF0ZSBzY2hlbWFzIHdpdGgsIG9yIHVuZGVmaW5lZCBpZiB0aGVyZSBpcyBubyB2YWxpZGF0aW9uIG5lZWRlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVTY2hlbWFWYWxpZGF0b3IodGFyZ2V0OiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCk6IGFqdi5WYWxpZGF0ZUZ1bmN0aW9uIHwgdW5kZWZpbmVkIHtcbiAgICBjb25zdCBtZXRhZGF0YVNjaGVtYTogSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSA9IFJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCB0YXJnZXQpXG4gICAgaWYgKCFtZXRhZGF0YVNjaGVtYSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgLy8gU2NoZW1hIG9wdGlvbnNcbiAgICBjb25zdCBzY2hlbWFDb21waWxlciA9IGFqdih7XG4gICAgICAgIGFsbEVycm9yczogdHJ1ZSxcbiAgICAgICAgYXN5bmM6IGZhbHNlLFxuICAgICAgICB2ZXJib3NlOiB0cnVlLFxuICAgICAgICBmb3JtYXQ6ICdmdWxsJyxcbiAgICAgICAganNvblBvaW50ZXJzOiB0cnVlLCAvLyBSZXF1aXJlZCBmb3IgYWp2RXJyb3JzXG4gICAgfSlcbiAgICBhanZFcnJvcnMoc2NoZW1hQ29tcGlsZXIpXG5cbiAgICAvLyBGbGF0dGVuIGFsbCB0aGUgcmVmZXJlbmNlcyBhbmQgZW5zdXJlIHRoZXJlIGlzIG9ubHkgb25lIHZlcnNpb24gb2YgZWFjaFxuICAgIGNvbnN0IHJlZmVyZW5jZVNjaGVtYXMgPSBmbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyh0YXJnZXQpLnJlZHVjZSgocmVzdWx0LCByZWZlcmVuY2UpID0+IHtcbiAgICAgICAgaWYgKCFyZXN1bHQuaGFzKHJlZmVyZW5jZS4kaWQhKSkge1xuICAgICAgICAgICAgcmVzdWx0LnNldChyZWZlcmVuY2UuJGlkISwgcmVmZXJlbmNlKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3VsdFxuICAgIH0sIG5ldyBNYXA8c3RyaW5nLCBKc29uRGVjb2RhYmxlU2NoZW1hPigpKVxuXG4gICAgLy8gQWRkIGFsbCByZWZlcmVuY2VzIGFuZCBjb21waWxlXG4gICAgZm9yIChjb25zdCByZWZlcmVuY2VTY2hlbWEgb2YgcmVmZXJlbmNlU2NoZW1hcy52YWx1ZXMoKSkge1xuICAgICAgICBzY2hlbWFDb21waWxlci5hZGRTY2hlbWEocmVmZXJlbmNlU2NoZW1hKVxuICAgIH1cbiAgICBjb25zdCB2YWxpZGF0b3IgPSBzY2hlbWFDb21waWxlci5jb21waWxlKG1ldGFkYXRhU2NoZW1hLnNjaGVtYSlcblxuICAgIHJldHVybiB2YWxpZGF0b3Jcbn1cblxuLyoqXG4gKiBGbGF0dGVucyBhbGwgc2NoZW1hIHJlZmVyZW5jZXMgZnJvbSB0aGUgdGFyZ2V0IGRvd25cbiAqXG4gKiBAcGFyYW0gdGFyZ2V0IC0gdGFyZ2V0IGNsYXNzIHRvIHRha2UgZGVmaW5lZCBzY2hlbWEgcmVmZXJlbmNlcyBmcm9tXG4gKiBAcGFyYW0gW2luY2x1ZGVSb290U2NoZW1hPWZhbHNlXSAtIFVzZWQgZm9yIHJlY3Vyc2lvblxuICogQHJldHVybnMgRmxhdHRlbmVkIHNjaGVtYXMgdG8gYWRkIGFzIHJlZmVyZW5jZSBkZWZpbml0aW9uc1xuICovXG5mdW5jdGlvbiBmbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyhcbiAgICB0YXJnZXQ6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IHwgSnNvbkRlY29kYWJsZVNjaGVtYSxcbiAgICBpbmNsdWRlUm9vdFNjaGVtYTogYm9vbGVhbiA9IGZhbHNlKTogSnNvbkRlY29kYWJsZVNjaGVtYVtdXG57XG4gICAgY29uc3Qgc2NoZW1hczogSnNvbkRlY29kYWJsZVNjaGVtYVtdID0gW11cblxuICAgIGNvbnN0IG1ldGFkYXRhU2NoZW1hOiBKc29uRGVjb2RlclNjaGVtYU1ldGFkYXRhID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHRhcmdldClcbiAgICBpZiAobWV0YWRhdGFTY2hlbWEpIHtcbiAgICAgICAgaWYgKCEoJyRzY2hlbWEnIGluIG1ldGFkYXRhU2NoZW1hLnNjaGVtYSkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYE1pc3NpbmcgJyRzY2hlbWEnIGRlY2xhcmF0aW9uIGluICR7dGFyZ2V0Lm5hbWUgfHwgdGFyZ2V0LiRpZH0gc2NoZW1hYClcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpbmNsdWRlUm9vdFNjaGVtYSkge1xuICAgICAgICAgICAgY29uc3QgbXV0YWJsZVNjaGVtYTogSnNvbkRlY29kYWJsZVNjaGVtYSA9IHsuLi5tZXRhZGF0YVNjaGVtYS5zY2hlbWF9XG4gICAgICAgICAgICBpZiAoIW11dGFibGVTY2hlbWEuJGlkKSB7XG4gICAgICAgICAgICAgICAgLy8gVXNlIHRoZSB0YXJnZXQgbmFtZSBhcyB0aGUgSURcbiAgICAgICAgICAgICAgICBtdXRhYmxlU2NoZW1hLiRpZCA9IGAjLyR7dGFyZ2V0Lm5hbWV9YFxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2NoZW1hcy5wdXNoKG11dGFibGVTY2hlbWEpXG4gICAgICAgIH1cblxuICAgICAgICAvLyBGbGF0dGVuIHJlZmVyZW5jZSBzY2hlbWFzLlxuICAgICAgICAvLyBUaGVzZSBjb3VsZCBiZSBjbGFzcyBkZWNsYXJhdGlvbnMgd2l0aCBzY2hlbWFzIGF0dGFjaGVkIG9yIHNjaGVtYXMgdGhlbXNlbHZlc1xuICAgICAgICBpZiAobWV0YWRhdGFTY2hlbWEucmVmZXJlbmNlcyAmJiBBcnJheS5pc0FycmF5KG1ldGFkYXRhU2NoZW1hLnJlZmVyZW5jZXMpKSB7XG4gICAgICAgICAgICBtZXRhZGF0YVNjaGVtYS5yZWZlcmVuY2VzLmZvckVhY2gocmVmZXJlbmNlID0+IHtcbiAgICAgICAgICAgICAgICBpZiAoISFSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgcmVmZXJlbmNlKSkge1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWFzLnB1c2goLi4uZmxhdHRlblNjaGVtYVJlZmVyZW5jZXMocmVmZXJlbmNlLCB0cnVlKSlcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCckc2NoZW1hJyBpbiByZWZlcmVuY2UpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hcy5wdXNoKHJlZmVyZW5jZSBhcyBKc29uRGVjb2RhYmxlU2NoZW1hKVxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYE1pc3NpbmcgJyRzY2hlbWEnIGRlY2xhcmF0aW9uIGluIHNjaGVtYSByZWZlcmVuY2VzIGZvciAke3RhcmdldC5uYW1lfWApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEVudW1lcmF0aW9uIHRoZSBkZWNvZGVyIG1hcCB0byBhdXRvbWF0aWNhbGx5IGluamVjdCBzY2hlbWEgcmVmZXJlbmNlc1xuICAgICAgICBjb25zdCBkZWNvZGVyTWFwID0gUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJNYXAsIHRhcmdldCkgYXMgRGVjb2Rlck1hcCB8IHVuZGVmaW5lZFxuICAgICAgICBpZiAoZGVjb2Rlck1hcCkge1xuICAgICAgICAgICAgZm9yIChjb25zdCBrZXkgb2YgUmVmbGVjdC5vd25LZXlzKGRlY29kZXJNYXApKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFwRW50eSA9IFJlZmxlY3QuZ2V0KGRlY29kZXJNYXAsIGtleSlcbiAgICAgICAgICAgICAgICBpZiAobWFwRW50eSAmJiBtYXBFbnR5LnR5cGUgJiYgUmVmbGVjdC5oYXNNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIG1hcEVudHkudHlwZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgc2NoZW1hcy5wdXNoKC4uLmZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKG1hcEVudHkudHlwZSBhcyBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCwgdHJ1ZSkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNjaGVtYXNcbn1cblxuLyoqXG4gKiBFeHRyYWN0cyB0aGUgdmFsdWUgZnJvbSBhIGpzb24gb2JqZWN0IGJhc2VkIG9uIGEgSlNPTiBwb2ludGVyIHBhdGhcbiAqXG4gKiBAcGFyYW0gcG9pbnRlciAtIHBvaW50ZXIgcGF0aFxuICogQHBhcmFtIGpzb24gLSBzb3VyY2UgSlNPTiBvYmplY3RcbiAqIEByZXR1cm5zIGEgdmFsdWUsIG9yIHVuZGVmaW5lZCBpZiBub3QgYXZhaWxhYmxlXG4gKi9cbmZ1bmN0aW9uIHZhbHVlRnJvbUpzb25Qb2ludGVyKHBvaW50ZXI6IHN0cmluZywganNvbjogSnNvbk9iamVjdCk6IGFueSB7XG4gICAgY29uc3Qga2V5cyA9IHBvaW50ZXIuc3BsaXQoJy8nKS5maWx0ZXIocGFydCA9PiAhIXBhcnQpXG5cbiAgICBsZXQgdmFsdWUgPSBqc29uXG4gICAgd2hpbGUgKGtleXMubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBrZXkgPSBrZXlzLnNoaWZ0KCkhXG4gICAgICAgIGlmICghKGtleSBpbiB2YWx1ZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIHZhbHVlID0gdmFsdWVba2V5XVxuICAgIH1cblxuICAgIHJldHVybiB2YWx1ZVxufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgSlNPTiBwb2ludGVyIHBhdGggdG8gYSBrZXkgcGF0aCB0aGF0IGlzIG1vcmUgaHVtYW4gZnJpZW5kbHlcbiAqXG4gKiBAcGFyYW0gcG9pbnRlciAtIHBvaW50ZXIgcGF0aFxuICogQHBhcmFtIG90aGVyS2V5cyAtIG90aGVyIGtleXMgdG8gYXBwZW5kIHRvIHRoZSByZXN1bHQga2V5IHBhdGhcbiAqIEByZXR1cm5zIEpTT04ga2V5IHBhdGhcbiAqL1xuZnVuY3Rpb24gY29udmVydEpzb25Qb2ludGVyVG9LZXlQYXRoKHBvaW50ZXI6IHN0cmluZywgLi4ub3RoZXJLZXlzOiBzdHJpbmdbXSk6IHN0cmluZyB7XG4gICAgY29uc3QgcGFydHMgPSBwb2ludGVyLnNwbGl0KCcvJykuZmlsdGVyKHBhcnQgPT4gISFwYXJ0KVxuICAgIGlmIChvdGhlcktleXMgJiYgb3RoZXJLZXlzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgcGFydHMucHVzaCguLi5vdGhlcktleXMpXG4gICAgfVxuXG4gICAgbGV0IGRvdFBhdGggPSAnJ1xuICAgIHdoaWxlIChwYXJ0cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHBhcnQgPSBwYXJ0cy5zaGlmdCgpIVxuICAgICAgICBpZiAoL15bMC05XSskLy50ZXN0KHBhcnQpKSB7XG4gICAgICAgICAgICBkb3RQYXRoICs9IGBbJHtwYXJ0fV1gXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoZG90UGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgZG90UGF0aCArPSAnLidcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGRvdFBhdGggKz0gcGFydFxuICAgICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRvdFBhdGhcbn1cbiJdfQ==