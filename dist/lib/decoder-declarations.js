"use strict";
/**
 * @module json-decoder
 *
 * Declarations for the JSON decoder as used internally by the
 */
Object.defineProperty(exports, "__esModule", { value: true });
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
    decoderCompleted: Symbol.for('decoder.decoderCompleted')
};
/**
 * Type guard for collection targets
 * @param target
 */
function isDecoderPrototypalCollectionTarget(target) {
    return 'collection' in target && 'element' in target;
}
exports.isDecoderPrototypalCollectionTarget = isDecoderPrototypalCollectionTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2Rlci1kZWNsYXJhdGlvbnMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvZGVjb2Rlci1kZWNsYXJhdGlvbnMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7O0FBRUg7O0dBRUc7QUFDVSxRQUFBLG1CQUFtQixHQUFHO0lBQy9COztPQUVHO0lBQ0gsU0FBUyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsbUJBQW1CLENBQUM7SUFDMUM7O09BRUc7SUFDSCxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0lBQy9DOztPQUVHO0lBQ0gsVUFBVSxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDO0lBQ3JDOztPQUVHO0lBQ0gsZ0JBQWdCLEVBQUUsTUFBTSxDQUFDLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQztJQUNqRDs7T0FFRztJQUNILGNBQWMsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLGlCQUFpQixDQUFDO0lBQzdDOztPQUVHO0lBQ0gsT0FBTyxFQUFFLE1BQU0sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQUM7SUFDdEM7O09BRUc7SUFDSCxnQkFBZ0IsRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLDBCQUEwQixDQUFDO0NBQzNELENBQUE7QUF5QkQ7OztHQUdHO0FBQ0gsNkNBQW9ELE1BQVc7SUFDM0QsTUFBTSxDQUFDLFlBQVksSUFBSSxNQUFNLElBQUksU0FBUyxJQUFJLE1BQU0sQ0FBQTtBQUN4RCxDQUFDO0FBRkQsa0ZBRUMifQ==