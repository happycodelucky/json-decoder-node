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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL2pzb24vanNvbi1kZWNvZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUlBLDRCQUF5QjtBQUV6QiwyQkFBMEI7QUFFMUIsd0NBQXVDO0FBSXZDLDBFQUE4RjtBQUM5RiwwRUFBd0g7QUFDeEgsd0RBQXlGO0FBR3pGLDREQUEyRjtBQUczRiwrREFBa0U7QUFFbEUsaURBQXdEO0FBQ3hELHFFQUErRjtBQUMvRixxRUFBbUg7QUFNbkgsTUFBYSxXQUFXO0lBT3BCLE1BQU0sQ0FBQyxNQUFNLENBQW1CLGNBQW1DLEVBQUUsU0FBa0M7O1FBQ25HLElBQUksY0FBYyxLQUFLLElBQUksSUFBSSxjQUFjLEtBQUssU0FBUyxFQUFFO1lBQ3pELE9BQU8sSUFBSSxDQUFBO1NBQ2Q7UUFHRCxJQUFJLE1BQWMsQ0FBQTtRQUNsQixJQUFJLE9BQU8sY0FBYyxLQUFLLFFBQVEsRUFBRTtZQUVwQyxNQUFNLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxjQUFjLENBQWUsQ0FBQTtTQUNwRDthQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxPQUFPLGNBQWMsS0FBSyxRQUFRLEVBQUU7WUFFNUUsTUFBTSxHQUFHLGNBQWMsQ0FBQTtTQUMxQjthQUFNO1lBQ0gsTUFBTSxJQUFJLFNBQVMsQ0FBQyxnREFBZ0QsQ0FBQyxDQUFBO1NBQ3hFO1FBRUQsSUFBSSxZQUFrQyxDQUFBO1FBR3RDLE1BQU0sYUFBYSxHQUFHLE9BQU8sQ0FBQyxXQUFXLENBQUMsMENBQW1CLENBQUMsY0FBYyxFQUFFLFNBQVMsQ0FBeUIsQ0FBQTtRQUNoSCxJQUFJLGFBQWEsRUFBRTtZQUNmLFlBQVksR0FBRyxhQUFhLENBQUMsSUFBSSxDQUFDLFNBQVMsRUFBRSxNQUFNLENBQU0sQ0FBQTtZQUd6RCxJQUFJLFlBQVksS0FBSyxJQUFJLEVBQUU7Z0JBQ3ZCLE9BQU8sSUFB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LEdBQUcsSUFBSSxLQUFLLENBQUMsRUFBRTtZQUNqQixPQUFPLFNBQVMsQ0FBQTtTQUNuQjtRQUVELEtBQUssR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUE7S0FDckI7SUFFRCxPQUFPLEtBQUssQ0FBQTtBQUNoQixDQUFDO0FBU0QsU0FBUywyQkFBMkIsQ0FBQyxPQUFlLEVBQUUsR0FBRyxTQUFtQjtJQUN4RSxNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQTtJQUN2RCxJQUFJLFNBQVMsSUFBSSxTQUFTLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNuQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsU0FBUyxDQUFDLENBQUE7S0FDM0I7SUFFRCxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUE7SUFDaEIsT0FBTyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRTtRQUNyQixNQUFNLElBQUksR0FBRyxLQUFLLENBQUMsS0FBSyxFQUFHLENBQUE7UUFDM0IsSUFBSSxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO1lBQ3ZCLE9BQU8sSUFBSSxJQUFJLElBQUksR0FBRyxDQUFBO1NBQ3pCO2FBQU07WUFDSCxJQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO2dCQUNwQixPQUFPLElBQUksR0FBRyxDQUFBO2FBQ2pCO1lBQ0QsT0FBTyxJQUFJLElBQUksQ0FBQTtTQUNsQjtLQUNKO0lBRUQsT0FBTyxPQUFPLENBQUE7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogSlNPTiBzcGVjaWZpYyBkZWNvZGVyIGFuZCBkZWNvcmF0b3JzXG4gKi9cblxuaW1wb3J0ICdyZWZsZWN0LW1ldGFkYXRhJ1xuXG5pbXBvcnQgKiBhcyBhanYgZnJvbSAnYWp2J1xuLy8gQHRzLWlnbm9yZVxuaW1wb3J0ICogYXMgYWp2RXJyb3JzIGZyb20gJ2Fqdi1lcnJvcnMnXG5cbmltcG9ydCB7IEFkZGl0aW9uYWxQcm9wZXJ0aWVzUGFyYW1zLCBFcnJvck9iamVjdCwgUmVxdWlyZWRQYXJhbXMsIFZhbGlkYXRlRnVuY3Rpb24gfSBmcm9tICdhanYnXG5cbmltcG9ydCB7IERlY29kZXJNZXRhZGF0YUtleXMsIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLWRlY2xhcmF0aW9ucydcbmltcG9ydCB7IERlY29kZXJQcm90b3R5cGFsQ29sbGVjdGlvblRhcmdldCwgaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQgfSBmcm9tICcuLi9kZWNvZGVyL2RlY29kZXItZGVjbGFyYXRpb25zJ1xuaW1wb3J0IHsgRGVjb2Rlck1hcCwgRGVjb2Rlck1hcEVudHJ5LCBkZWNvZGVyTWFwRm9yVGFyZ2V0IH0gZnJvbSAnLi4vZGVjb2Rlci9kZWNvZGVyLW1hcCdcblxuaW1wb3J0IHsgQ29sbGVjdGlvbk1hcnNoYWxsZXJGdW5jdGlvbiwgTWFyc2hhbGxlckZ1bmN0aW9uIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5pbXBvcnQgeyBjb2xsZWN0aW9uTWFyc2hhbGxlckZvclR5cGUsIG1hcnNoYWxsZXJGb3JUeXBlIH0gZnJvbSAnLi4vbWFyc2hhbGxlcnMvbWFyc2hhbGxlcnMnXG5cbmltcG9ydCB7IEpzb25PYmplY3QgfSBmcm9tICcuL2pzb24tZGVjb2RhYmxlLXR5cGVzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJWYWxpZGF0aW9uRXJyb3IgfSBmcm9tICcuL2pzb24tZGVjb2Rlci1lcnJvcnMnXG5pbXBvcnQgeyBKc29uRGVjb2RhYmxlT3B0aW9ucywgSnNvbkRlY29kYWJsZVNjaGVtYSwgSnNvbkRlY29kZXJTY2hlbWFNZXRhZGF0YSB9IGZyb20gJy4vanNvbi1kZWNvcmF0b3JzJ1xuaW1wb3J0IHsgSnNvbkRlY29kZXJNZXRhZGF0YUtleXMgfSBmcm9tICcuL2pzb24tc3ltYm9scydcbmltcG9ydCB7IEpzb25WYWxpZGF0aW9uRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVZhbHVlRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5pbXBvcnQgeyBKc29uVmFsaWRhdG9yUHJvcGVydHlNaXNzaW5nRXJyb3IsIEpzb25WYWxpZGF0b3JQcm9wZXJ0eVVuc3VwcG9ydGVkRXJyb3IgfSBmcm9tICcuL2pzb24tdmFsaWRhdGlvbi1lcnJvcnMnXG5cbi8qKlxuICogSlNPTiBkZWNvZGVyIGZvciBKU09OIGRlY29kYWJsZSBjbGFzc2VzXG4gKi9cbi8vIHRzbGludDpkaXNhYmxlOm5vLXVubmVjZXNzYXJ5LWNsYXNzXG5leHBvcnQgY2xhc3MgSnNvbkRlY29kZXIge1xuICAgIC8qKlxuICAgICAqIERlY29kZXMgYSBKU09OIG9iamVjdCBvciBTdHJpbmcgcmV0dXJuaW5nIGJhY2sgdGhlIG9iamVjdCBpZiBpdCB3YXMgYWJsZSB0byBiZSBkZWNvZGVkXG4gICAgICogQHBhcmFtIG9iamVjdE9yU3RyaW5nIC0gYXJyYXkgb3Igc3RyaW5nIChjb250YWluIEpTT04gb2JqZWN0KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlIC0gZGVjb2RhYmxlIHR5cGUgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYSBkZWNvZGVkIG9iamVjdCBvZiBgY2xhc3NUeXBlYFxuICAgICAqL1xuICAgIHN0YXRpYyBkZWNvZGU8VCBleHRlbmRzIG9iamVjdD4ob2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3QsIGNsYXNzVHlwZTogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpOiBUIHwgbnVsbCB7XG4gICAgICAgIGlmIChvYmplY3RPclN0cmluZyA9PT0gbnVsbCB8fCBvYmplY3RPclN0cmluZyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRXh0cmFjdCBvdXIgSlNPTiBvYmplY3RcbiAgICAgICAgbGV0IG9iamVjdDogb2JqZWN0XG4gICAgICAgIGlmICh0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAvLyBXaWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiB0aGUgSlNPTiBoYXMgYSBzeW50YXggZXJyb3JcbiAgICAgICAgICAgIG9iamVjdCA9IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpIGFzIEpzb25PYmplY3RcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KG9iamVjdE9yU3RyaW5nKSB8fCB0eXBlb2Ygb2JqZWN0T3JTdHJpbmcgPT09ICdvYmplY3QnKSB7XG4gICAgICAgICAgICAvLyBBcnJheXMgYXJlIG9iamVjdHMgdG9vLCBhbmQgY2FuIGJlIHF1ZXJpZWQgd2l0aCBAMC52YWx1ZVxuICAgICAgICAgICAgb2JqZWN0ID0gb2JqZWN0T3JTdHJpbmdcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2RlY29kZShvYmplY3QpIHNob3VsZCBiZSBhbiBPYmplY3Qgb3IgYSBTdHJpbmcnKVxuICAgICAgICB9XG5cbiAgICAgICAgbGV0IGRlY29kZU9iamVjdDogVCB8IHVuZGVmaW5lZCB8IG51bGxcblxuICAgICAgICAvLyBDcmVhdGUgb3VyIGRlY29kaW5nIG9iamVjdCB1c2luZyBhIGRlY29kZXIgZnVuY3Rpb24gaWYgcmVnaXN0ZXJlZFxuICAgICAgICBjb25zdCBvYmplY3RGYWN0b3J5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kZXJGYWN0b3J5LCBjbGFzc1R5cGUpIGFzIEZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChvYmplY3RGYWN0b3J5KSB7XG4gICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBvYmplY3RGYWN0b3J5LmNhbGwoY2xhc3NUeXBlLCBvYmplY3QpIGFzIFRcblxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGludmFsaWRhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFdpdGggYSBuZXcgb2JqZWN0IGNhbiBjb21lIGEgbmV3IGRlY29kZXIgY29uZmlndXJhdGlvblxuICAgICAgICAgICAgaWYgKGRlY29kZU9iamVjdCAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NUeXBlID0gZGVjb2RlT2JqZWN0LmNvbnN0cnVjdG9yXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIWRlY29kZU9iamVjdCkge1xuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGVPcHRpb25zLCBjbGFzc1R5cGUpIGFzIEpzb25EZWNvZGFibGVPcHRpb25zIHwgdW5kZWZpbmVkXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAmJiAob3B0aW9ucy51c2VDb25zdHJ1Y3RvciA/PyBmYWxzZSkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBjb25zdHJ1Y3RhYmxlID0gY2xhc3NUeXBlIGFzIE9iamVjdENvbnN0cnVjdG9yXG4gICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0ID0gbmV3IGNvbnN0cnVjdGFibGUoKSBhcyBUXG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBvYmplY3QsIHdpdGhvdXQgY2FsbGluZyB0aGUgY29uc3RydWN0b3JcbiAgICAgICAgICAgICAgICBkZWNvZGVPYmplY3QgPSBPYmplY3QuY3JlYXRlKGNsYXNzVHlwZS5wcm90b3R5cGUpIGFzIFRcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFZhbGlkYXRlIHRoZSBKU09OXG4gICAgICAgIC8vIFRoaXMgd2lsbCB0aHJvdyBhbiBleGNlcHRpb24gaWYgbm90IHZhbGlkXG4gICAgICAgIHZhbGlkYXRlZFNvdXJjZUpzb24oY2xhc3NUeXBlLCBvYmplY3QpXG5cbiAgICAgICAgLy8gQ2hlY2sgaWYgYSBjb250ZXh0IG5lZWRzIHRvIGJlIHNldFxuICAgICAgICBjb25zdCBjb250ZXh0S2V5ID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5jb250ZXh0LCBjbGFzc1R5cGUpIGFzIHN0cmluZyB8IHVuZGVmaW5lZFxuICAgICAgICBpZiAoY29udGV4dEtleSAhPT0gdW5kZWZpbmVkICYmIGNvbnRleHRLZXkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgUmVmbGVjdC5kZWZpbmVQcm9wZXJ0eShkZWNvZGVPYmplY3QsIGNvbnRleHRLZXksIHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogb2JqZWN0LFxuICAgICAgICAgICAgICAgIGVudW1lcmFibGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgIHdyaXRhYmxlOiBmYWxzZSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cblxuICAgICAgICAvLyBXYWxrIHRoZSBwcm90b3R5cGUgY2hhaW4sIGFkZGluZyB0aGUgY29uc3RydWN0b3IgZnVuY3Rpb25zIGluIHJldmVyc2Ugb3JkZXJcbiAgICAgICAgY29uc3QgY2xhc3NDb25zdHJ1Y3RvcnM6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0W10gPSBbXVxuICAgICAgICBsZXQgcHJvdG90eXBlID0gY2xhc3NUeXBlLnByb3RvdHlwZVxuICAgICAgICB3aGlsZSAocHJvdG90eXBlICE9PSBPYmplY3QucHJvdG90eXBlKSB7XG4gICAgICAgICAgICBpZiAoISFSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCBwcm90b3R5cGUuY29uc3RydWN0b3IpKSB7XG4gICAgICAgICAgICAgICAgY2xhc3NDb25zdHJ1Y3RvcnMudW5zaGlmdChwcm90b3R5cGUuY29uc3RydWN0b3IpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBwcm90b3R5cGUgPSBSZWZsZWN0LmdldFByb3RvdHlwZU9mKHByb3RvdHlwZSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEl0ZXJhdGUgdGhyb3VnaCB0aGUgY2xhc3MgaGVpcmFyY2h5XG4gICAgICAgIGZvciAoY29uc3QgY29uc3RydWN0b3Igb2YgY2xhc3NDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBhIGJlZm9yZSBkZWNvZGUgZnVuY3Rpb24gb24gYSBjb25zdHJ1Y3RvciBmdW5jdGlvbidzIHByb3RvdHlwZVxuICAgICAgICAgICAgY29uc3QgZGVjb2RlciA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyLCBjb25zdHJ1Y3Rvci5wcm90b3R5cGUpIGFzIEZ1bmN0aW9uXG4gICAgICAgICAgICBpZiAoZGVjb2Rlcikge1xuICAgICAgICAgICAgICAgIGNvbnN0IGFsdGVybmF0aXZlRGVjb2RlT2JqZWN0ID0gZGVjb2Rlci5jYWxsKGRlY29kZU9iamVjdCwgb2JqZWN0KVxuICAgICAgICAgICAgICAgIC8vIENoZWNrIGZvciBpbnZhbGlkYXRpb25cbiAgICAgICAgICAgICAgICBpZiAoYWx0ZXJuYXRpdmVEZWNvZGVPYmplY3QgPT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIExvb2sgdXAgZGVjb2RlciBtYXAgZm9yIHRoZSBjb25zdHJ1Y3RvciBmdW5jdGlvblxuICAgICAgICAgICAgY29uc3QgZGVjb2Rlck1hcCA9IGRlY29kZXJNYXBGb3JUYXJnZXQoY29uc3RydWN0b3IpXG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoZGVjb2Rlck1hcCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXBFbnRyeSA9IFJlZmxlY3QuZ2V0KGRlY29kZXJNYXAsIGtleSkgYXMgRGVjb2Rlck1hcEVudHJ5XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWUgPSBldmFsdWF0ZVByb3BlcnR5VmFsdWUob2JqZWN0LCBtYXBFbnRyeSwgZGVjb2RlT2JqZWN0KVxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgIFJlZmxlY3Quc2V0KGRlY29kZU9iamVjdCwga2V5LCB2YWx1ZSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBJdGVyYXRlIHRocm91Z2ggdGhlIGNsYXNzIGhlaXJhcmNoeSBmb3IgcHJvdG90eXBlIGRlY29kZXJzLCB0aGlzIHRpbWUgY2FsbGluZyBhbGwgdGhlIHByb3BlcnR5IG5vdGlmaWVyc1xuICAgICAgICAvLyBUaGlzIGlzIGRvbmUgYWZ0ZXIgYWxsIG1hcHBlZCBwcm9wZXJ0aWVzIGhhdmUgYmVlbiBhc3NpZ25lZFxuICAgICAgICBmb3IgKGNvbnN0IGNvbnN0cnVjdG9yIG9mIGNsYXNzQ29uc3RydWN0b3JzKSB7XG4gICAgICAgICAgICBjb25zdCBwcm9wZXJ0eU5vdGlmaWVycyA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoXG4gICAgICAgICAgICAgICAgRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyTm90aWZpZXJzLFxuICAgICAgICAgICAgICAgIGNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgKSBhcyBNYXA8c3RyaW5nLCBEZWNvZGVyTWFwRW50cnlbXT4gfCB1bmRlZmluZWRcblxuICAgICAgICAgICAgaWYgKHByb3BlcnR5Tm90aWZpZXJzKSB7XG4gICAgICAgICAgICAgICAgZm9yIChjb25zdCBoYW5kbGVycyBvZiBwcm9wZXJ0eU5vdGlmaWVycy52YWx1ZXMoKSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKGNvbnN0IGhhbmRsZXIgb2YgaGFuZGxlcnMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHZhbHVlID0gZXZhbHVhdGVQcm9wZXJ0eVZhbHVlKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGtleTogaGFuZGxlci5rZXksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGhhbmRsZXIudHlwZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlY29kZU9iamVjdCxcbiAgICAgICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogQ2FwdHVyZSBlcnJvcnMgZnJvbSBoYW5kbGVyc1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGhhbmRsZXIubWFwRnVuY3Rpb24hLmNhbGwoZGVjb2RlT2JqZWN0LCB2YWx1ZSwgb2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gSXRlcmF0ZSB0aHJvdWdoIHRoZSBjbGFzcyBoZWlyYXJjaHkgZm9yIHByb3RvdHlwZSBkZWNvZGVycywgY2FsbGluZyB0aGUgZGVjb2RlciBjb21wbGV0ZSBmdW5jdGlvblxuICAgICAgICAvLyBUaGlzIGRvbmUgYWZ0ZXIgYWxsIHBvdGVudGlhbCBhc3NpZ21lbnRzXG4gICAgICAgIGZvciAoY29uc3QgY29uc3RydWN0b3Igb2YgY2xhc3NDb25zdHJ1Y3RvcnMpIHtcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBhIGFmdGVyIGRlY29kZSBwcm90b3R5cGUgZnVuY3Rpb25cbiAgICAgICAgICAgIGNvbnN0IGRlY29kZXJDb21wbGV0ZSA9IFJlZmxlY3QuZ2V0T3duTWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGVyQ29tcGxldGVkLCBjb25zdHJ1Y3Rvci5wcm90b3R5cGUpXG4gICAgICAgICAgICBpZiAoZGVjb2RlckNvbXBsZXRlKSB7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgY29tcGxldGVPYmplY3Q6IGFueSA9IGRlY29kZXJDb21wbGV0ZS5jYWxsKGRlY29kZU9iamVjdCwgb2JqZWN0KVxuICAgICAgICAgICAgICAgICAgICAvLyBDaGVjayBmb3IgaW52YWxpZGF0aW9uXG4gICAgICAgICAgICAgICAgICAgIGlmIChjb21wbGV0ZU9iamVjdCA9PT0gbnVsbCB8fCBjb21wbGV0ZU9iamVjdCA9PT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIHN3YXBwZWQgZGVjb2RlIG9iamVjdFxuICAgICAgICAgICAgICAgICAgICBpZiAoY29tcGxldGVPYmplY3QgJiYgY29tcGxldGVPYmplY3QgIT09IGRlY29kZU9iamVjdCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVjb2RlT2JqZWN0ID0gY29tcGxldGVPYmplY3RcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyIGluc3RhbmNlb2YgSnNvblZhbGlkYXRpb25FcnJvcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvbkVycm9yID0gbmV3IEpzb25EZWNvZGVyVmFsaWRhdGlvbkVycm9yKFtlcnJdLCBvYmplY3QsICdKU09OIHZhbGlkYXRpb24gZmFpbGVkIHBvc3QgZGVjb2RlJylcbiAgICAgICAgICAgICAgICAgICAgICAgIHRocm93IHZhbGlkYXRpb25FcnJvclxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgZXJyXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGRlY29kZU9iamVjdCFcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBEZWNvZGVzIGEgSlNPTiBvYmplY3Qgb3IgU3RyaW5nIHJldHVybmluZyBiYWNrIHRoZSBvYmplY3QgaWYgaXQgd2FzIGFibGUgdG8gYmUgZGVjb2RlZFxuICAgICAqIEBwYXJhbSBvYmplY3RPclN0cmluZyAtIGFycmF5IG9yIHN0cmluZyAoY29udGFpbiBKU09OIGFycmF5KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlIC0gZGVjb2RhYmxlIHR5cGUgdG8gZGVjb2RlIEpTT04gaW50b1xuICAgICAqIEByZXR1cm4gYW4gYXJyYXkgb2YgZGVjb2RlZCBvYmplY3RzIG9mIGBjbGFzc1R5cGVgXG4gICAgICovXG4gICAgc3RhdGljIGRlY29kZUFycmF5PFQgZXh0ZW5kcyBvYmplY3Q+KFxuICAgICAgICBvYmplY3RPclN0cmluZzogc3RyaW5nIHwgSnNvbk9iamVjdFtdLFxuICAgICAgICBjbGFzc1R5cGU6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LFxuICAgICk6IFtUXSB8IG51bGwge1xuICAgICAgICBpZiAob2JqZWN0T3JTdHJpbmcgPT09IG51bGwgfHwgb2JqZWN0T3JTdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBvYmplY3RzOiBvYmplY3RbXVxuICAgICAgICBpZiAodHlwZW9mIG9iamVjdE9yU3RyaW5nID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgb2JqZWN0cyA9IEpTT04ucGFyc2Uob2JqZWN0T3JTdHJpbmcpXG4gICAgICAgIH0gZWxzZSBpZiAoQXJyYXkuaXNBcnJheShvYmplY3RPclN0cmluZykpIHtcbiAgICAgICAgICAgIG9iamVjdHMgPSBvYmplY3RPclN0cmluZ1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignZGVjb2RlKG9iamVjdCkgc2hvdWxkIGJlIGFuIEFycmF5IG9mIE9iamVjdHMgb3IgYSBTdHJpbmcnKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG9iamVjdHMubWFwPFQgfCBudWxsPigob2JqZWN0KSA9PiB0aGlzLmRlY29kZTxUPihvYmplY3QsIGNsYXNzVHlwZSkpLmZpbHRlcigob2JqZWN0KSA9PiAhIW9iamVjdCkgYXMgW1RdXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRGVjb2RlcyBhIEpTT04gb2JqZWN0IG9yIFN0cmluZyByZXR1cm5pbmcgYmFjayBhIG1hcCB3aXRoIGtleSBhcyB0aGVcbiAgICAgKiBqc29uIGtleSBhbmQgdmFsdWUgZGVjb2RlZCB0byB0aGUgZGVjb2RhYmxlIHR5cGUgcGFzc2VkIGluIHRoZSBpbnB1dFxuICAgICAqIEBwYXJhbSBvYmplY3RPclN0cmluZyAtIGFycmF5IG9yIHN0cmluZyAoY29udGFpbiBKU09OIGFycmF5KSB0byBkZWNvZGVcbiAgICAgKiBAcGFyYW0gY2xhc3NUeXBlT2ZWYWx1ZSAtIGRlY29kYWJsZSB0eXBlIG9mIGpzb24gdmFsdWVzIHRvIGRlY29kZSBKU09OIGludG9cbiAgICAgKiBAcmV0dXJuIGEgTWFwIHdpdGggdGhlIHZhbHVlIGNvbnRhaW5pbmcgZGVjb2RlZCBvYmplY3RzIG9mIGBjbGFzc1R5cGVgXG4gICAgICovXG4gICAgc3RhdGljIGRlY29kZU1hcDxUIGV4dGVuZHMgb2JqZWN0PihcbiAgICAgICAgb2JqZWN0T3JTdHJpbmc6IHN0cmluZyB8IEpzb25PYmplY3QsXG4gICAgICAgIGNsYXNzVHlwZU9mVmFsdWU6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LFxuICAgICk6IE1hcDxzdHJpbmcsIFQ+IHwgbnVsbCAge1xuICAgICAgICBpZiAob2JqZWN0T3JTdHJpbmcgPT09IG51bGwgfHwgb2JqZWN0T3JTdHJpbmcgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGxcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlucHV0T2JqZWN0OiBKc29uT2JqZWN0ID0gKHR5cGVvZihvYmplY3RPclN0cmluZykgPT09ICdzdHJpbmcnKVxuICAgICAgICAgICAgPyBKU09OLnBhcnNlKG9iamVjdE9yU3RyaW5nKVxuICAgICAgICAgICAgOiBvYmplY3RPclN0cmluZ1xuXG4gICAgICAgIGNvbnN0IGRlY29kZWRNYXA6IE1hcDxzdHJpbmcsIFQgPiA9IG5ldyBNYXAoKVxuICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoaW5wdXRPYmplY3QpKSB7XG4gICAgICAgICAgICBjb25zdCBkZWNvZGVkVmFsdWUgPSB0aGlzLmRlY29kZTxUPihpbnB1dE9iamVjdFtrZXkudG9TdHJpbmcoKV0sIGNsYXNzVHlwZU9mVmFsdWUpXG4gICAgICAgICAgICBpZiAoZGVjb2RlZFZhbHVlKSB7XG4gICAgICAgICAgICAgICAgZGVjb2RlZE1hcC5zZXQoa2V5LnRvU3RyaW5nKCksIGRlY29kZWRWYWx1ZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBkZWNvZGVkTWFwXG4gICAgfVxufVxuXG5cblxuLy9cbi8vIFByaXZhdGUgZnVuY3Rpb25zXG4vL1xuXG4vKipcbiAqIENyZWF0ZXMgYSBtYXJzaGFsbGVyIGZvciBhIGdpdmVuIHR5cGUgZGVjbGFyYXRpb24gdG8gdXNlIGZvciBjb252ZXJzaW9uXG4gKlxuICogQHBhcmFtIHR5cGUgLSBkZXNpcmVkIGNvbnZlcnNpb24gdHlwZVxuICogQHJldHVybiBjb252ZXJzaW9uIGZ1bmN0aW9uIG9yIHVuZGVmaW5lZFxuICovXG5mdW5jdGlvbiBjcmVhdGVNYXJzaGFsbGVyKHR5cGU6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0IHwgRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0KTpcbiAgICAoKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IGFueSkgfCB1bmRlZmluZWRcbntcbiAgICBpZiAoaXNEZWNvZGVyUHJvdG90eXBhbENvbGxlY3Rpb25UYXJnZXQodHlwZSkpIHtcbiAgICAgICAgbGV0IGNvbGxlY3Rpb25NYXJzaGFsbGVyOiBDb2xsZWN0aW9uTWFyc2hhbGxlckZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChSZWZsZWN0LmdldE93bk1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2RhYmxlLCB0eXBlLmNvbGxlY3Rpb24pKSB7XG4gICAgICAgICAgICBjb2xsZWN0aW9uTWFyc2hhbGxlciA9ICh2YWx1ZTogYW55LCBpdGVtTWFyaHNhbGxlcj86IE1hcnNoYWxsZXJGdW5jdGlvbiwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdib29sZWFuJ1xuICAgICAgICAgICAgICAgICAgICB8fCB0eXBlb2YgdmFsdWUgPT09ICdudW1iZXInXG4gICAgICAgICAgICAgICAgICAgIHx8IHR5cGVvZiB2YWx1ZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgICAgICAgfHwgKHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBKc29uRGVjb2Rlci5kZWNvZGUodmFsdWUsIHR5cGUuY29sbGVjdGlvbilcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHN0cmljdCkge1xuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGAke3R5cGVvZiB2YWx1ZX0gY2Fubm90IGJlIGNvbnZlcnRlZCB0byAke3R5cGUuY29sbGVjdGlvbi5uYW1lfWApXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29sbGVjdGlvbk1hcnNoYWxsZXIgPSBjb2xsZWN0aW9uTWFyc2hhbGxlckZvclR5cGUodHlwZS5jb2xsZWN0aW9uKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCFjb2xsZWN0aW9uTWFyc2hhbGxlcikge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBlbGVtZW50TWFyc2hhbGxlciA9IGNyZWF0ZU1hcnNoYWxsZXIodHlwZS5lbGVtZW50KVxuXG4gICAgICAgIC8vIElmIHRoZSBlbGVtZW50IHR5cGUgaXMgZGVjb2RhYmxlXG4gICAgICAgIGlmICghZWxlbWVudE1hcnNoYWxsZXIgJiYgUmVmbGVjdC5nZXRNZXRhZGF0YShEZWNvZGVyTWV0YWRhdGFLZXlzLmRlY29kYWJsZSwgdHlwZS5lbGVtZW50KSkge1xuICAgICAgICAgICAgZWxlbWVudE1hcnNoYWxsZXIgPSAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBKc29uRGVjb2Rlci5kZWNvZGU8dHlwZW9mIHR5cGU+KHZhbHVlLCB0eXBlLmVsZW1lbnQgYXMgRGVjb2RlclByb3RvdHlwYWxUYXJnZXQpXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gKHZhbHVlOiBhbnksIHN0cmljdD86IGJvb2xlYW4pID0+IHtcbiAgICAgICAgICAgIHJldHVybiBjb2xsZWN0aW9uTWFyc2hhbGxlciEodmFsdWUsIGVsZW1lbnRNYXJzaGFsbGVyLCBzdHJpY3QpXG4gICAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFJlZmxlY3QuZ2V0TWV0YWRhdGEoRGVjb2Rlck1ldGFkYXRhS2V5cy5kZWNvZGFibGUsIHR5cGUpKSB7XG4gICAgICAgIHJldHVybiAodmFsdWU6IGFueSwgc3RyaWN0PzogYm9vbGVhbikgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIEpzb25EZWNvZGVyLmRlY29kZTx0eXBlb2YgdHlwZT4odmFsdWUsIHR5cGUpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbWFyc2hhbGxlckZvclR5cGUodHlwZSlcbn1cblxuLyoqXG4gKiBFdmFsdWF0ZXMgYSBwcm9wZXJ0eSBvZiBhbiBvYmplY3QgKGJlaW5nIGRlY29kZWQpIGJhc2VkIG9uIGEgbWFwIGVudHJ5IGZvciB0aGUgZGVjb2Rlci5cbiAqXG4gKiBAcGFyYW0gb2JqZWN0IC0gb2JqZWN0IGJlaW5nIGRlY29kZWRcbiAqIEBwYXJhbSBtYXBFbnRyeSAtIGRlY29kZXIgbWFwIGVudHJ5XG4gKiBAcGFyYW0gZGVjb2RlT2JqZWN0IC0gb2JqZWN0IGJlaW5nIHBvcHVsYXRlZCBieSB0aGUgZGVjb2RlclxuICogQHBhcmFtIHN0cmljdCAtIHdoZW4gdHJ1ZSwgcGFyc2luZyBpcyBzdHJpY3QgYW5kIHRocm93cyBhIFR5cGVFcnJvciBpZiB0aGUgdmFsdWUgY2Fubm90IGJlIGNvbnZlcnRlZFxuICogQHJldHVybnMgZXZhbHVhdGVkIHByb3BlcnR5IHZhbHVlXG4gKlxuICogQHRocm93cyBUeXBlRXJyb3JcbiAqL1xuZnVuY3Rpb24gZXZhbHVhdGVQcm9wZXJ0eVZhbHVlKFxuICAgIG9iamVjdDogb2JqZWN0LFxuICAgIG1hcEVudHJ5OiBEZWNvZGVyTWFwRW50cnksXG4gICAgZGVjb2RlT2JqZWN0OiBvYmplY3QsXG4gICAgc3RyaWN0OiBib29sZWFuID0gZmFsc2UsXG4pOiBhbnkge1xuICAgIGlmICghb2JqZWN0KSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG4gICAgaWYgKCFtYXBFbnRyeSkge1xuICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgfVxuXG4gICAgLy8gRW5zdXJlIGNvbnNpc3RlbnQgdXNlIG9mIERlY29kZXJNYXBFbnRyeVxuICAgIGxldCBkZWNvZGVyTWFwRW50cnk6IERlY29kZXJNYXBFbnRyeVxuICAgIGlmICh0eXBlb2YgbWFwRW50cnkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGRlY29kZXJNYXBFbnRyeSA9IHtcbiAgICAgICAgICAgIGtleTogbWFwRW50cnksXG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBkZWNvZGVyTWFwRW50cnkgPSBtYXBFbnRyeVxuICAgIH1cblxuICAgIC8vIExvb2sgdXAgdGhlIHByb3BlcnR5IGtleSBwYXRoIGluIHRoZSBKU09OIG9iamVjdFxuICAgIGNvbnN0IGtleVBhdGhzID0gZGVjb2Rlck1hcEVudHJ5LmtleS5zcGxpdCgvQHxcXC4vKVxuICAgIGxldCB2YWx1ZTogYW55ID0gb2JqZWN0XG4gICAgZG8ge1xuICAgICAgICBjb25zdCBwYXRoID0ga2V5UGF0aHMuc2hpZnQoKSFcbiAgICAgICAgaWYgKCFwYXRoKSB7XG4gICAgICAgICAgICBjb250aW51ZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ2FuIG9ubHkgaW5zcGVjdCBvYmplY3QgdmFsdWVzLCBmYWlsIGlmIHdlIGNhbm5vdCByZXNvbHZlIHRoZSB2YWx1ZVxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdmFsdWUgIT09ICdzdHJpbmcnICYmICFBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgICAgLy8gVE9ETzogVGhyb3cgZXJyb3I/XG4gICAgICAgICAgICByZXR1cm4gdW5kZWZpbmVkXG4gICAgICAgIH1cbiAgICAgICAgdmFsdWUgPSBSZWZsZWN0LmdldCh2YWx1ZSwgcGF0aClcbiAgICB9IHdoaWxlIChrZXlQYXRocy5sZW5ndGggPiAwICYmIHZhbHVlICE9PSBudWxsICYmIHZhbHVlICE9PSB1bmRlZmluZWQpXG5cbiAgICAvLyBJZiB0aGVyZSBpcyBhbiB1bmRlZmluZWQgdmFsdWUgcmV0dXJuIGl0IChkbyBub3QgcmV0dXJuIG9uIG51bGwpXG4gICAgaWYgKHZhbHVlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgIH1cblxuICAgIC8vIENoZWNrIGFueSB0eXBlIGNvbnZlcnNpb25cbiAgICBpZiAoZGVjb2Rlck1hcEVudHJ5LnR5cGUpIHtcbiAgICAgICAgY29uc3QgbWFyc2hhbGxlciA9IGNyZWF0ZU1hcnNoYWxsZXIoZGVjb2Rlck1hcEVudHJ5LnR5cGUpXG4gICAgICAgIGlmIChtYXJzaGFsbGVyKSB7XG4gICAgICAgICAgICB2YWx1ZSA9IG1hcnNoYWxsZXIodmFsdWUsIHN0cmljdClcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzdHJpY3QpIHtcbiAgICAgICAgICAgICAgICBjb25zdCByb290VHlwZSA9XG4gICAgICAgICAgICAgICAgICAgIGlzRGVjb2RlclByb3RvdHlwYWxDb2xsZWN0aW9uVGFyZ2V0KGRlY29kZXJNYXBFbnRyeS50eXBlKSA/IGRlY29kZXJNYXBFbnRyeS50eXBlLmNvbGxlY3Rpb24gOiBkZWNvZGVyTWFwRW50cnkudHlwZVxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYCR7cm9vdFR5cGUubmFtZX0gaXMgbm90IGEgSlNPTiBkZWNvZGFibGUgdHlwZWApXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIHZhbHVlLCBpdCBzaG91bGQgYmUgc2tpcHBlZFxuICAgICAgICBpZiAodmFsdWUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGRlY29kZXJNYXBFbnRyeS5tYXBGdW5jdGlvbikge1xuICAgICAgICAgICAgdmFsdWUgPSBkZWNvZGVyTWFwRW50cnkubWFwRnVuY3Rpb24uY2FsbChkZWNvZGVPYmplY3QsIHZhbHVlLCBvYmplY3QpXG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gdmFsdWVcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZXMgYSBzY2hlbWEgZGVmaW5lZCBvbiBhIHRhcmdldCBhZ2FpbnN0IHRoZSBzb3VyY2UgSlNPTi5cbiAqIElmIHRoZSBKU09OIGlzIG5vdCB2YWxpZCB0aGVuIGEgSnNvbkRlY29kZXJWYWxpZGF0b3JFcnJvciBleGNlcHRpb24gaXMgdGhyb3duXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hIGZyb21cbiAqIEBwYXJhbSBqc29uIC0gSlNPTiBvYmplY3RcbiAqIEByZXR1cm5zIHRydWUgaWYgdGhlIHNjaGVtYSB3YXMgdmFsaWQgKEpzb25EZWNvZGVyVmFsaWRhdG9yRXJyb3IgZXhjZXB0aW9uIHRocm93biBvdGhlcndpc2UpXG4gKi9cbmZ1bmN0aW9uIHZhbGlkYXRlZFNvdXJjZUpzb24odGFyZ2V0OiBEZWNvZGVyUHJvdG90eXBhbFRhcmdldCwganNvbjogSnNvbk9iamVjdCk6IGJvb2xlYW4ge1xuICAgIC8vIElmIHRoZXJlIGlzIG5vdGhpbmcgdG8gdmFsaWRhdGUgdGhlbiBpdCdzIHZhbGlkXG4gICAgaWYgKCFSZWZsZWN0Lmhhc01ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KSkge1xuICAgICAgICByZXR1cm4gdHJ1ZVxuICAgIH1cblxuICAgIC8vIEZldGNoIGFuIGV4aXN0aW5nIHZhbGlkYXRvclxuICAgIGxldCB2YWxpZGF0b3IgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYVZhbGlkYXRvciwgdGFyZ2V0KSBhcyBWYWxpZGF0ZUZ1bmN0aW9uIHwgdW5kZWZpbmVkXG4gICAgLy8gQ3JlYXRlIGEgbmV3IHZhbGlkYXRvciBpZiBvbmUgaGFzIG5vdCBhbHJlYWR5IGJlZW4gY3JlYXRlZFxuICAgIGlmICghdmFsaWRhdG9yKSB7XG4gICAgICAgIHZhbGlkYXRvciA9IGNyZWF0ZVNjaGVtYVZhbGlkYXRvcih0YXJnZXQpXG4gICAgICAgIGlmICh2YWxpZGF0b3IpIHtcbiAgICAgICAgICAgIFJlZmxlY3QuZGVmaW5lTWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hVmFsaWRhdG9yLCB2YWxpZGF0b3IsIHRhcmdldClcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIE5vIHZhbGlkYXRvciAoc2hvdWxkIG5vdCBoYXBwZW4pXG4gICAgaWYgKCF2YWxpZGF0b3IpIHtcbiAgICAgICAgcmV0dXJuIHRydWVcbiAgICB9XG5cbiAgICAvLyBBdHRlbXB0IHZhbGlkYXRpb24gYW5kIHJlcG9ydCBlcnJvcnNcbiAgICBjb25zdCB2YWxpZGF0b3JSZXN1bHQgPSB2YWxpZGF0b3IoanNvbilcbiAgICBpZiAodHlwZW9mIHZhbGlkYXRvclJlc3VsdCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgIGlmICghdmFsaWRhdG9yUmVzdWx0KSB7XG4gICAgICAgICAgICAvLyBDb2xsZWN0IHRoZSBlcnJvcnMgcHJvZHVjZWQgYnkgdGhlIHZhbGlkYXRvclxuICAgICAgICAgICAgY29uc3QgZXJyb3JzID0gdmFsaWRhdG9yLmVycm9yc1xuICAgICAgICAgICAgY29uc3QgdmFsaWRhdGlvbkVycm9yczogSnNvblZhbGlkYXRpb25FcnJvcltdID0gW11cbiAgICAgICAgICAgIGlmIChlcnJvcnMpIHtcbiAgICAgICAgICAgICAgICBlcnJvcnMubWFwKChlcnJvcjogRXJyb3JPYmplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGFqdkVycm9yOiBFcnJvck9iamVjdCB8IHVuZGVmaW5lZCA9IGVycm9yXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGV4cGxpY2l0IGVycm9yIG1lc3NhZ2VzXG4gICAgICAgICAgICAgICAgICAgIGxldCB0ZW1wbGF0ZUVycm9yTWVzc2FnZTogc3RyaW5nXG4gICAgICAgICAgICAgICAgICAgIGxldCBwcm9wZXJ0eVBhdGg6IHN0cmluZ1xuICAgICAgICAgICAgICAgICAgICBsZXQgZm9ybWF0RXJyb3JNZXNzYWdlID0gZmFsc2VcbiAgICAgICAgICAgICAgICAgICAgaWYgKGVycm9yLmtleXdvcmQgPT09ICdlcnJvck1lc3NhZ2UnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zdCBwYXJhbXM6IGFueSA9IGVycm9yLnBhcmFtc1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6cHJlZmVyLWNvbmRpdGlvbmFsLWV4cHJlc3Npb25cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICgnZXJyb3JzJyBpbiBwYXJhbXMgJiYgQXJyYXkuaXNBcnJheShwYXJhbXMuZXJyb3JzKSAmJiBwYXJhbXMuZXJyb3JzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhanZFcnJvciA9IHBhcmFtcy5lcnJvcnNbMF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwcm9wZXJ0eVBhdGggPSBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgoYWp2RXJyb3IhLmRhdGFQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRlbXBsYXRlRXJyb3JNZXNzYWdlID0gZXJyb3IubWVzc2FnZSFcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNob3VsZCBmb3JtYXQgdGhlIGVycm9yIG1lc3NhZ2VzXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9ybWF0RXJyb3JNZXNzYWdlID0gdHJ1ZVxuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhanZFcnJvciA9IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCA9ICc/Pz8nXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBlcnJvci5tZXNzYWdlIVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gY29udmVydEpzb25Qb2ludGVyVG9LZXlQYXRoKGVycm9yLmRhdGFQYXRoKVxuICAgICAgICAgICAgICAgICAgICAgICAgdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBwcm9wZXJ0eVBhdGhcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICA/IGAnJHtwcm9wZXJ0eVBhdGh9JyAke2Vycm9yLm1lc3NhZ2V9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIDogdGVtcGxhdGVFcnJvck1lc3NhZ2UgPSBgT2JqZWN0ICR7ZXJyb3IubWVzc2FnZX1gXG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEl0J3MgcG9zc2libGUgZm9yIHRoZSBlcnJvciBwYXJhbWV0ZXIgdG8gYmUgYW4gYXJyYXkuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUbyBwbGF5IGl0IHNhZmUsIGVuc3VyZSB3ZSBoYXZlIGFuIGFycmF5IHRvIGl0ZXJhdGUgb3ZlclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgZXJyb3JQYXJhbXM6IGFueVtdID0gW10uY29uY2F0KGFqdkVycm9yLnBhcmFtcyBhcyBhbnkpXG4gICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBhcmFtcy5mb3JFYWNoKGVycm9yUGFyYW0gPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghYWp2RXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGFqdkVycm9yLmtleXdvcmQgPT09ICdkZXBlbmRlbmNpZXMnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoID0gcHJvcGVydHlQYXRoID8gYCR7cHJvcGVydHlQYXRofS4ke2Vycm9yUGFyYW0ucHJvcGVydHl9YCA6IGVycm9yUGFyYW0ucHJvcGVydHlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gSGFjayB0byBlbnN1cmUgdGhlcmUgaXMgYWx3YXlzIGEgcHJvcGVydHkgcGF0aCB2YXJpYWJsZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvclBhcmFtLnByb3BlcnR5UGF0aCA9IHByb3BlcnR5UGF0aFxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbGV0IGVycm9yTWVzc2FnZSA9IFN0cmluZyh0ZW1wbGF0ZUVycm9yTWVzc2FnZSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZm9ybWF0RXJyb3JNZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHRlbXBsYXRlUmVnRXggPSAvKHt7KFthLXowLTlcXC1fXSspfX0pL2dpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBtYXRjaCA9IHRlbXBsYXRlUmVnRXguZXhlYyhlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChtYXRjaCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcHJvcGVydHkgPSBtYXRjaFsyXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHByb3BlcnR5IGluIGVycm9yUGFyYW0pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocHJvcGVydHkgPT09ICdwcm9wZXJ0eVBhdGgnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFlcnJvclBhcmFtW3Byb3BlcnR5XSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSAnb2JqZWN0J1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdmFsdWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IGAnJHtlcnJvclBhcmFtW3Byb3BlcnR5XX0nYFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvck1lc3NhZ2UgPSBgJHtlcnJvck1lc3NhZ2Uuc2xpY2UoMCwgbWF0Y2guaW5kZXgpfWAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke3ZhbHVlfWAgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGAke2Vycm9yTWVzc2FnZS5zbGljZSh0ZW1wbGF0ZVJlZ0V4Lmxhc3RJbmRleCl9YFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtYXRjaCA9IHRlbXBsYXRlUmVnRXguZXhlYyhlcnJvck1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoYWp2RXJyb3Iua2V5d29yZCA9PT0gJ3JlcXVpcmVkJyB8fCBhanZFcnJvci5rZXl3b3JkID09PSAnZGVwZW5kZW5jaWVzJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWxpZGF0aW9uRXJyb3JzLnB1c2goXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuZXcgSnNvblZhbGlkYXRvclByb3BlcnR5TWlzc2luZ0Vycm9yKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb3BlcnR5UGF0aCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3JQYXJhbSBhcyBSZXF1aXJlZFBhcmFtcykubWlzc2luZ1Byb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKGFqdkVycm9yLmtleXdvcmQgPT09ICdhZGRpdGlvbmFsUHJvcGVydGllcycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEpzb25WYWxpZGF0b3JQcm9wZXJ0eVVuc3VwcG9ydGVkRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAoZXJyb3JQYXJhbSBhcyBBZGRpdGlvbmFsUHJvcGVydGllc1BhcmFtcykuYWRkaXRpb25hbFByb3BlcnR5LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yTWVzc2FnZSkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFsaWRhdGlvbkVycm9ycy5wdXNoKFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmV3IEpzb25WYWxpZGF0b3JQcm9wZXJ0eVZhbHVlRXJyb3IoXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcHJvcGVydHlQYXRoLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlRnJvbUpzb25Qb2ludGVyKGFqdkVycm9yIS5kYXRhUGF0aCwganNvbiksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3JNZXNzYWdlKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gVGhyb3cgYSBzaW5nbGUgZXJyb3Igd2l0aCBhbGwgdGhlIHNwZWNpZmljIHZhbGlkYXRpb25cbiAgICAgICAgICAgIHRocm93IG5ldyBKc29uRGVjb2RlclZhbGlkYXRpb25FcnJvcih2YWxpZGF0aW9uRXJyb3JzLCBqc29uKVxuICAgICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgVHlwZUVycm9yKCdBc3luYyBzY2hlbWEgdmFsaWRhdGlvbiBub3Qgc3VwcG9ydGVkJylcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZVxufVxuXG4vKipcbiAqIENyZWF0ZSBhIG5ldyBzY2hlbWEgdmFsaWRhdG9yIGZvciBhIHRhcmdldC4gSWYgdGhlIHRhcmdldCBkb2VzIG5vdCBzdXBwb3J0IEpTT04gc2NoZW1hIG5vIHZhbGlkYXRvciBmdW5jdGlvbiB3aWxsIGJlIHJldHVybmVkXG4gKlxuICogQHBhcmFtIHRhcmdldCAtIHRhcmdldCBjbGFzcyB0byB0YWtlIGRlZmluZWQgc2NoZW1hLCBhbmQgc2NoZW1hIHJlZmVyZW5jZXMgZnJvbVxuICogQHJldHVybnMgdmFsaWRhdG9yIGZ1bmN0aW9uIHRvIHZhbGlkYXRlIHNjaGVtYXMgd2l0aCwgb3IgdW5kZWZpbmVkIGlmIHRoZXJlIGlzIG5vIHZhbGlkYXRpb24gbmVlZGVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZVNjaGVtYVZhbGlkYXRvcih0YXJnZXQ6IERlY29kZXJQcm90b3R5cGFsVGFyZ2V0KTogYWp2LlZhbGlkYXRlRnVuY3Rpb24gfCB1bmRlZmluZWQge1xuICAgIGNvbnN0IG1ldGFkYXRhU2NoZW1hOiBKc29uRGVjb2RlclNjaGVtYU1ldGFkYXRhID0gUmVmbGVjdC5nZXRNZXRhZGF0YShKc29uRGVjb2Rlck1ldGFkYXRhS2V5cy5zY2hlbWEsIHRhcmdldClcbiAgICBpZiAoIW1ldGFkYXRhU2NoZW1hKSB7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWRcbiAgICB9XG5cbiAgICAvLyBTY2hlbWEgb3B0aW9uc1xuICAgIGNvbnN0IHNjaGVtYUNvbXBpbGVyID0gYWp2KHtcbiAgICAgICAgYWxsRXJyb3JzOiB0cnVlLFxuICAgICAgICBhc3luYzogZmFsc2UsXG4gICAgICAgIHZlcmJvc2U6IHRydWUsXG4gICAgICAgIGZvcm1hdDogJ2Z1bGwnLFxuICAgICAgICBqc29uUG9pbnRlcnM6IHRydWUsIC8vIFJlcXVpcmVkIGZvciBhanZFcnJvcnNcbiAgICB9KVxuICAgIGFqdkVycm9ycyhzY2hlbWFDb21waWxlcilcblxuICAgIC8vIEZsYXR0ZW4gYWxsIHRoZSByZWZlcmVuY2VzIGFuZCBlbnN1cmUgdGhlcmUgaXMgb25seSBvbmUgdmVyc2lvbiBvZiBlYWNoXG4gICAgY29uc3QgcmVmZXJlbmNlU2NoZW1hcyA9IGZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKHRhcmdldCkucmVkdWNlKChyZXN1bHQsIHJlZmVyZW5jZSkgPT4ge1xuICAgICAgICBpZiAoIXJlc3VsdC5oYXMocmVmZXJlbmNlLiRpZCEpKSB7XG4gICAgICAgICAgICByZXN1bHQuc2V0KHJlZmVyZW5jZS4kaWQhLCByZWZlcmVuY2UpXG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0XG4gICAgfSwgbmV3IE1hcDxzdHJpbmcsIEpzb25EZWNvZGFibGVTY2hlbWE+KCkpXG5cbiAgICAvLyBBZGQgYWxsIHJlZmVyZW5jZXMgYW5kIGNvbXBpbGVcbiAgICBmb3IgKGNvbnN0IHJlZmVyZW5jZVNjaGVtYSBvZiByZWZlcmVuY2VTY2hlbWFzLnZhbHVlcygpKSB7XG4gICAgICAgIHNjaGVtYUNvbXBpbGVyLmFkZFNjaGVtYShyZWZlcmVuY2VTY2hlbWEpXG4gICAgfVxuICAgIGNvbnN0IHZhbGlkYXRvciA9IHNjaGVtYUNvbXBpbGVyLmNvbXBpbGUobWV0YWRhdGFTY2hlbWEuc2NoZW1hKVxuXG4gICAgcmV0dXJuIHZhbGlkYXRvclxufVxuXG4vKipcbiAqIEZsYXR0ZW5zIGFsbCBzY2hlbWEgcmVmZXJlbmNlcyBmcm9tIHRoZSB0YXJnZXQgZG93blxuICpcbiAqIEBwYXJhbSB0YXJnZXQgLSB0YXJnZXQgY2xhc3MgdG8gdGFrZSBkZWZpbmVkIHNjaGVtYSByZWZlcmVuY2VzIGZyb21cbiAqIEBwYXJhbSBbaW5jbHVkZVJvb3RTY2hlbWE9ZmFsc2VdIC0gVXNlZCBmb3IgcmVjdXJzaW9uXG4gKiBAcmV0dXJucyBGbGF0dGVuZWQgc2NoZW1hcyB0byBhZGQgYXMgcmVmZXJlbmNlIGRlZmluaXRpb25zXG4gKi9cbmZ1bmN0aW9uIGZsYXR0ZW5TY2hlbWFSZWZlcmVuY2VzKFxuICAgIHRhcmdldDogRGVjb2RlclByb3RvdHlwYWxUYXJnZXQgfCBKc29uRGVjb2RhYmxlU2NoZW1hLFxuICAgIGluY2x1ZGVSb290U2NoZW1hOiBib29sZWFuID0gZmFsc2UpOiBKc29uRGVjb2RhYmxlU2NoZW1hW11cbntcbiAgICBjb25zdCBzY2hlbWFzOiBKc29uRGVjb2RhYmxlU2NoZW1hW10gPSBbXVxuXG4gICAgY29uc3QgbWV0YWRhdGFTY2hlbWE6IEpzb25EZWNvZGVyU2NoZW1hTWV0YWRhdGEgPSBSZWZsZWN0LmdldE1ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgdGFyZ2V0KVxuICAgIGlmIChtZXRhZGF0YVNjaGVtYSkge1xuICAgICAgICBpZiAoISgnJHNjaGVtYScgaW4gbWV0YWRhdGFTY2hlbWEuc2NoZW1hKSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgTWlzc2luZyAnJHNjaGVtYScgZGVjbGFyYXRpb24gaW4gJHt0YXJnZXQubmFtZSB8fCB0YXJnZXQuJGlkfSBzY2hlbWFgKVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGluY2x1ZGVSb290U2NoZW1hKSB7XG4gICAgICAgICAgICBjb25zdCBtdXRhYmxlU2NoZW1hOiBKc29uRGVjb2RhYmxlU2NoZW1hID0gey4uLm1ldGFkYXRhU2NoZW1hLnNjaGVtYX1cbiAgICAgICAgICAgIGlmICghbXV0YWJsZVNjaGVtYS4kaWQpIHtcbiAgICAgICAgICAgICAgICAvLyBVc2UgdGhlIHRhcmdldCBuYW1lIGFzIHRoZSBJRFxuICAgICAgICAgICAgICAgIG11dGFibGVTY2hlbWEuJGlkID0gYCMvJHt0YXJnZXQubmFtZX1gXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzY2hlbWFzLnB1c2gobXV0YWJsZVNjaGVtYSlcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEZsYXR0ZW4gcmVmZXJlbmNlIHNjaGVtYXMuXG4gICAgICAgIC8vIFRoZXNlIGNvdWxkIGJlIGNsYXNzIGRlY2xhcmF0aW9ucyB3aXRoIHNjaGVtYXMgYXR0YWNoZWQgb3Igc2NoZW1hcyB0aGVtc2VsdmVzXG4gICAgICAgIGlmIChtZXRhZGF0YVNjaGVtYS5yZWZlcmVuY2VzICYmIEFycmF5LmlzQXJyYXkobWV0YWRhdGFTY2hlbWEucmVmZXJlbmNlcykpIHtcbiAgICAgICAgICAgIG1ldGFkYXRhU2NoZW1hLnJlZmVyZW5jZXMuZm9yRWFjaChyZWZlcmVuY2UgPT4ge1xuICAgICAgICAgICAgICAgIGlmICghIVJlZmxlY3QuZ2V0TWV0YWRhdGEoSnNvbkRlY29kZXJNZXRhZGF0YUtleXMuc2NoZW1hLCByZWZlcmVuY2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIHNjaGVtYXMucHVzaCguLi5mbGF0dGVuU2NoZW1hUmVmZXJlbmNlcyhyZWZlcmVuY2UsIHRydWUpKVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoJyRzY2hlbWEnIGluIHJlZmVyZW5jZSkge1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWFzLnB1c2gocmVmZXJlbmNlIGFzIEpzb25EZWNvZGFibGVTY2hlbWEpXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihgTWlzc2luZyAnJHNjaGVtYScgZGVjbGFyYXRpb24gaW4gc2NoZW1hIHJlZmVyZW5jZXMgZm9yICR7dGFyZ2V0Lm5hbWV9YClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gRW51bWVyYXRpb24gdGhlIGRlY29kZXIgbWFwIHRvIGF1dG9tYXRpY2FsbHkgaW5qZWN0IHNjaGVtYSByZWZlcmVuY2VzXG4gICAgICAgIGNvbnN0IGRlY29kZXJNYXAgPSBSZWZsZWN0LmdldE1ldGFkYXRhKERlY29kZXJNZXRhZGF0YUtleXMuZGVjb2Rlck1hcCwgdGFyZ2V0KSBhcyBEZWNvZGVyTWFwIHwgdW5kZWZpbmVkXG4gICAgICAgIGlmIChkZWNvZGVyTWFwKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGtleSBvZiBSZWZsZWN0Lm93bktleXMoZGVjb2Rlck1hcCkpIHtcbiAgICAgICAgICAgICAgICBjb25zdCBtYXBFbnR5ID0gUmVmbGVjdC5nZXQoZGVjb2Rlck1hcCwga2V5KVxuICAgICAgICAgICAgICAgIGlmIChtYXBFbnR5ICYmIG1hcEVudHkudHlwZSAmJiBSZWZsZWN0Lmhhc01ldGFkYXRhKEpzb25EZWNvZGVyTWV0YWRhdGFLZXlzLnNjaGVtYSwgbWFwRW50eS50eXBlKSkge1xuICAgICAgICAgICAgICAgICAgICBzY2hlbWFzLnB1c2goLi4uZmxhdHRlblNjaGVtYVJlZmVyZW5jZXMobWFwRW50eS50eXBlIGFzIERlY29kZXJQcm90b3R5cGFsVGFyZ2V0LCB0cnVlKSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gc2NoZW1hc1xufVxuXG4vKipcbiAqIEV4dHJhY3RzIHRoZSB2YWx1ZSBmcm9tIGEganNvbiBvYmplY3QgYmFzZWQgb24gYSBKU09OIHBvaW50ZXIgcGF0aFxuICpcbiAqIEBwYXJhbSBwb2ludGVyIC0gcG9pbnRlciBwYXRoXG4gKiBAcGFyYW0ganNvbiAtIHNvdXJjZSBKU09OIG9iamVjdFxuICogQHJldHVybnMgYSB2YWx1ZSwgb3IgdW5kZWZpbmVkIGlmIG5vdCBhdmFpbGFibGVcbiAqL1xuZnVuY3Rpb24gdmFsdWVGcm9tSnNvblBvaW50ZXIocG9pbnRlcjogc3RyaW5nLCBqc29uOiBKc29uT2JqZWN0KTogYW55IHtcbiAgICBjb25zdCBrZXlzID0gcG9pbnRlci5zcGxpdCgnLycpLmZpbHRlcihwYXJ0ID0+ICEhcGFydClcblxuICAgIGxldCB2YWx1ZSA9IGpzb25cbiAgICB3aGlsZSAoa2V5cy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IGtleSA9IGtleXMuc2hpZnQoKSFcbiAgICAgICAgaWYgKCEoa2V5IGluIHZhbHVlKSkge1xuICAgICAgICAgICAgcmV0dXJuIHVuZGVmaW5lZFxuICAgICAgICB9XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZVtrZXldXG4gICAgfVxuXG4gICAgcmV0dXJuIHZhbHVlXG59XG5cbi8qKlxuICogQ29udmVydHMgYSBKU09OIHBvaW50ZXIgcGF0aCB0byBhIGtleSBwYXRoIHRoYXQgaXMgbW9yZSBodW1hbiBmcmllbmRseVxuICpcbiAqIEBwYXJhbSBwb2ludGVyIC0gcG9pbnRlciBwYXRoXG4gKiBAcGFyYW0gb3RoZXJLZXlzIC0gb3RoZXIga2V5cyB0byBhcHBlbmQgdG8gdGhlIHJlc3VsdCBrZXkgcGF0aFxuICogQHJldHVybnMgSlNPTiBrZXkgcGF0aFxuICovXG5mdW5jdGlvbiBjb252ZXJ0SnNvblBvaW50ZXJUb0tleVBhdGgocG9pbnRlcjogc3RyaW5nLCAuLi5vdGhlcktleXM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgICBjb25zdCBwYXJ0cyA9IHBvaW50ZXIuc3BsaXQoJy8nKS5maWx0ZXIocGFydCA9PiAhIXBhcnQpXG4gICAgaWYgKG90aGVyS2V5cyAmJiBvdGhlcktleXMubGVuZ3RoID4gMCkge1xuICAgICAgICBwYXJ0cy5wdXNoKC4uLm90aGVyS2V5cylcbiAgICB9XG5cbiAgICBsZXQgZG90UGF0aCA9ICcnXG4gICAgd2hpbGUgKHBhcnRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcGFydCA9IHBhcnRzLnNoaWZ0KCkhXG4gICAgICAgIGlmICgvXlswLTldKyQvLnRlc3QocGFydCkpIHtcbiAgICAgICAgICAgIGRvdFBhdGggKz0gYFske3BhcnR9XWBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChkb3RQYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBkb3RQYXRoICs9ICcuJ1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZG90UGF0aCArPSBwYXJ0XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gZG90UGF0aFxufVxuIl19