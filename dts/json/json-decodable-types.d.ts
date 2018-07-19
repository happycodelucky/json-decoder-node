export * from '../decoder/decodable-types';
import { ArrayConvertable, ConvertableBasicConstructionType, ConvertableBasicType } from '../decoder/decodable-types';
export interface JsonConvertable<T = any> {
    fromJSON(json: {}): T | null | undefined;
}
export interface JsonConvertableFunction<T = any> {
    (json: JsonObject): T | null | undefined;
}
export declare function isJSONConvertable(type: any): type is JsonConvertable;
export interface JsonConvertableCollectionType {
    '0': typeof Array | typeof Set | typeof Map | ArrayConvertable<ConvertableBasicType>;
    '1'?: ConvertableBasicConstructionType | JsonConvertableFunction | JsonConvertable;
}
export declare type JsonDecodableType = ConvertableBasicConstructionType | JsonConvertable | JsonConvertableCollectionType;
export interface JsonObject extends Record<string, any> {
}
