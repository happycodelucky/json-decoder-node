import { DecoderPrototypalCollectionTarget, DecoderPrototypalTarget } from './decoder-declarations';
export interface DecoderMapEntry {
    key: string;
    type?: object & (DecoderPrototypalTarget | DecoderPrototypalCollectionTarget);
    mapFunction?(value: any): any;
}
// @ts-ignore
export interface DecoderMap extends Record<string | number | symbol, DecoderMapEntry | undefined> {
}
export declare function decoderMapForTarget(target: DecoderPrototypalTarget): DecoderMap;
export declare function decoderMapEntryForTarget(key: string, target: DecoderPrototypalTarget): DecoderMapEntry;
