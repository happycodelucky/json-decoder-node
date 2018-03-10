"use strict";
/**
 * @module json-decoder
 *
 * Type and interfaces to support decoder mapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const decoder_declarations_1 = require("./decoder-declarations");
/**
 * Returns the decoder map for a given target class type
 *
 * @param target - target constructor function
 *
 * @return decoder map object to assign JSON decoding configuration to
 */
function decoderMapForTarget(target) {
    let map = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target) || target[decoder_declarations_1.DecoderMetadataKeys.decoderMap];
    if (map) {
        return map;
    }
    // Set an empty decoder map
    setDecoderMapForTarget(target, {});
    return Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target);
}
exports.decoderMapForTarget = decoderMapForTarget;
/**
 * Overrides the decoder map for a given target class type
 *
 * @param target - target constructor function
 * @param decoderMap - decoder map to assign to the class type
 */
function setDecoderMapForTarget(target, decoderMap) {
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, decoderMap, target);
}
exports.setDecoderMapForTarget = setDecoderMapForTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2Rlci1tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvZGVjb2Rlci1tYXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7O0dBSUc7O0FBRUgsNEJBQXlCO0FBQ3pCLGlFQUFvSjtBQTJDcEo7Ozs7OztHQU1HO0FBQ0gsNkJBQW9DLE1BQStCO0lBQy9ELElBQUksR0FBRyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBQyxJQUFJLE1BQU0sQ0FBQywwQ0FBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQTtJQUNsSCxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQTtJQUNkLENBQUM7SUFFRCwyQkFBMkI7SUFDM0Isc0JBQXNCLENBQUMsTUFBTSxFQUFFLEVBQUUsQ0FBQyxDQUFBO0lBQ2xDLE1BQU0sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUUsQ0FBQTtBQUMxRSxDQUFDO0FBVEQsa0RBU0M7QUFFRDs7Ozs7R0FLRztBQUNILGdDQUF1QyxNQUErQixFQUFFLFVBQXNCO0lBQzFGLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsVUFBVSxFQUFFLFVBQVUsRUFBRSxNQUFNLENBQUMsQ0FBQTtBQUM5RSxDQUFDO0FBRkQsd0RBRUMifQ==