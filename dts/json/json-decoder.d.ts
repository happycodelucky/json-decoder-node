/**
 * JSON specific decoder and decorators
 */
import 'reflect-metadata';
import { DecoderPrototypalTarget } from '../decoder/decoder-declarations';
import { JsonObject } from './json-decodable-types';
/**
 * JSON decoder for JSON decodable classes
 */
export declare class JsonDecoder {
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - array or string (contain JSON object) to decode
     * @param classType - decodable type to decode JSON into
     * @return a decoded object of `classType`
     */
    static decode<T extends object>(objectOrString: string | JsonObject, classType: DecoderPrototypalTarget): T | null;
    /**
     * Decodes a JSON object or String returning back the object if it was able to be decoded
     * @param objectOrString - array or string (contain JSON array) to decode
     * @param classType - decodable type to decode JSON into
     * @return an array of decoded objects of `classType`
     */
    static decodeArray<T extends object>(objectOrString: string | JsonObject[], classType: DecoderPrototypalTarget): [T] | null;
    /**
     * Decodes a JSON object or String returning back a map with key as the
     * json key and value decoded to the decodable type passed in the input
     * @param objectOrString - array or string (contain JSON array) to decode
     * @param classTypeOfValue - decodable type of json values to decode JSON into
     * @return a Map with the value containing decoded objects of `classType`
     */
    static decodeMap<T extends object>(objectOrString: string | JsonObject, classTypeOfValue: DecoderPrototypalTarget): Map<string, T> | null;
}
