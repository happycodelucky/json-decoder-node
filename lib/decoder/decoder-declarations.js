"use strict";
/**
 * Declarations for the JSON decoder as used internally by the
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isDecoderPrototypalCollectionTarget = exports.DecoderMetadataKeys = void 0;
/**
 * Reflection metadata keys
 */
exports.DecoderMetadataKeys = {
    /**
     * Metadata on the decodable class
     */
    decodable: Symbol.for('decoder.decodable'),
    /**
     * Decoder options set during declaration
     */
    decodableOptions: Symbol.for('decoder.options'),
    /**
     * Represents the decoder map as part of a class
     */
    decoderMap: Symbol.for('decoder.map'),
    /**
     * Decoder notifiers handlers
     */
    decoderNotifiers: Symbol.for('decoder.notifiers'),
    /**
     * Decoder factory function to provide alternative objects to decode on to
     */
    decoderFactory: Symbol.for('decoder.factory'),
    /**
     * Custom decoder function on the class or prototype
     */
    decoder: Symbol.for('decoder.decoder'),
    /**
     * Custom decoder completion function on class prototype
     */
    decoderCompleted: Symbol.for('decoder.decoderCompleted'),
};
/**
 * Type guard for collection targets
 * @param target - target to test
 * @returns true if the target is a DecoderPrototypalCollectionTarget
 */
function isDecoderPrototypalCollectionTarget(target) {
    return 'collection' in target && 'element' in target;
}
exports.isDecoderPrototypalCollectionTarget = isDecoderPrototypalCollectionTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2Rlci1kZWNsYXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZGVjb2Rlci9kZWNvZGVyLWRlY2xhcmF0aW9ucy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7O0dBRUc7OztBQUVIOztHQUVHO0FBQ1UsUUFBQSxtQkFBbUIsR0FBRztJQUMvQjs7T0FFRztJQUNILFNBQVMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDO0lBQzFDOztPQUVHO0lBQ0gsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztJQUMvQzs7T0FFRztJQUNILFVBQVUsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQztJQUNyQzs7T0FFRztJQUNILGdCQUFnQixFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUM7SUFDakQ7O09BRUc7SUFDSCxjQUFjLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQztJQUM3Qzs7T0FFRztJQUNILE9BQU8sRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0lBQ3RDOztPQUVHO0lBQ0gsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQywwQkFBMEIsQ0FBQztDQUMzRCxDQUFBO0FBeUJEOzs7O0dBSUc7QUFDSCxTQUFnQixtQ0FBbUMsQ0FBQyxNQUFXO0lBQzNELE9BQU8sWUFBWSxJQUFJLE1BQU0sSUFBSSxTQUFTLElBQUksTUFBTSxDQUFBO0FBQ3hELENBQUM7QUFGRCxrRkFFQyJ9