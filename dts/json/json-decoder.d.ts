import 'reflect-metadata';
import { DecoderPrototypalTarget } from '../decoder/decoder-declarations';
import { JsonObject } from './json-decodable-types';
export declare class JsonDecoder {
    static decode<T extends object>(objectOrString: string | JsonObject, classType: DecoderPrototypalTarget): T | null;
    static decodeArray<T extends object>(objectOrString: string | JsonObject[], classType: DecoderPrototypalTarget): [T] | null;
}
