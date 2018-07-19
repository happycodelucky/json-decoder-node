export interface ConvertableFunction {
    (value: any): any;
}
export declare type ConvertableBasicType = boolean | number | string | object;
export declare type ConvertableBasicConstructionType = typeof Boolean | typeof Number | typeof String | typeof Object | ConvertableFunction;
export interface ArrayConvertable<E, T = any> {
    fromArray(array: Array<E>): T | null | undefined;
}
export interface ArrayConvertableFunction<E, T = any> {
    (array: Array<E>): T | null | undefined;
}
export declare function isArrayConvertable<E>(type: any): type is ArrayConvertable<E>;
export interface ConvertableCollectionType {
    '0': typeof Array | typeof Set | typeof Map | ArrayConvertable<ConvertableBasicType> | ArrayConvertableFunction<ConvertableBasicType>;
    '1': ConvertableBasicConstructionType;
}
export declare type ConvertableType = ConvertableBasicConstructionType | ConvertableCollectionType;
