export declare const DecoderMetadataKeys: {
    decodable: symbol;
    decodableOptions: symbol;
    decoderMap: symbol;
    decoderNotifiers: symbol;
    decoderFactory: symbol;
    decoder: symbol;
    decoderCompleted: symbol;
};
export interface DecoderConstructableTarget extends Record<string, any> {
    constructor: Function;
}
export interface DecoderPrototypalTarget extends Record<string, any> {
    name: string;
    prototype: object;
}
export interface DecoderPrototypalCollectionTarget {
    collection: DecoderPrototypalTarget;
    element: DecoderPrototypalTarget | DecoderPrototypalCollectionTarget;
}
export declare function isDecoderPrototypalCollectionTarget(target: any): target is DecoderPrototypalCollectionTarget;
