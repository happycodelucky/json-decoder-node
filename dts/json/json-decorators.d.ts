import 'reflect-metadata';
import { DecoderConstructableTarget, DecoderPrototypalTarget } from '../decoder/decoder-declarations';
import { DecoderPrototypalCollectionTarget } from '../decoder/decoder-declarations';
import { JsonConvertable } from './json-decodable-types';
export interface JsonDecodableOptions {
    strict?: boolean;
    useConstructor?: boolean;
}
export declare function jsonDecodable(options?: JsonDecodableOptions): <T extends DecoderPrototypalTarget>(target: T) => T & JsonConvertable<any>;
export interface JsonDecodableSchema extends Record<string, any> {
    $schema: string;
    $id?: string;
}
export interface JsonDecoderSchemaMetadata {
    schema: JsonDecodableSchema;
    references?: (JsonDecodableSchema | DecoderPrototypalTarget)[];
}
export declare function jsonSchema(schema: JsonDecodableSchema, ...references: (JsonDecodableSchema | DecoderPrototypalTarget)[]): <T extends DecoderPrototypalTarget>(target: T) => T;
export declare function jsonContext<T extends DecoderConstructableTarget>(target: T, key: string): void;
export declare function jsonProperty<T extends DecoderConstructableTarget>(target: T, key: string): void;
export declare function jsonPropertyAlias(keyPath: string): (target: DecoderConstructableTarget, key: string) => void;
export declare function jsonType(type: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget, mapFunction?: (value: any) => any): (target: DecoderConstructableTarget, key: string) => void;
export declare function jsonDecoderFactory(target: DecoderPrototypalTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export declare function jsonDecoder(target: DecoderConstructableTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export declare function jsonDecoderCompleted(target: DecoderConstructableTarget, key: string, descriptor: PropertyDescriptor): PropertyDescriptor;
export declare function jsonNotify(keyPath: string, type?: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget): <T extends DecoderConstructableTarget>(target: T, key: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
