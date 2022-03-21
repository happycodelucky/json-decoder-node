"use strict";
/**
 * @module json-decoder
 *
 * Type and interfaces to support decoder mapping
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.decoderMapEntryForTarget = exports.decoderMapForTarget = void 0;
const decoder_declarations_1 = require("./decoder-declarations");
/**
 * Returns the decoder map for a given target class type
 *
 * @param target - target constructor function
 *
 * @return decoder map object to assign JSON decoding configuration to
 */
function decoderMapForTarget(target) {
    const map = Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target) ||
        Reflect.get(target, decoder_declarations_1.DecoderMetadataKeys.decoderMap);
    if (map) {
        return map;
    }
    // Set an empty decoder map
    Reflect.defineMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, {}, target);
    return Reflect.getOwnMetadata(decoder_declarations_1.DecoderMetadataKeys.decoderMap, target);
}
exports.decoderMapForTarget = decoderMapForTarget;
/**
 * Returns a decoder map entry given a entry key and a target class type
 *
 * @param key - property key on the target
 * @param target - target constructor function
 * @param decoderMap - decoder map to assign to the class type
 */
function decoderMapEntryForTarget(key, target) {
    const decoderMap = decoderMapForTarget(target);
    let entry = decoderMap[key];
    if (entry === undefined) {
        entry = {
            key,
        };
        decoderMap[key] = entry;
    }
    return entry;
}
exports.decoderMapEntryForTarget = decoderMapEntryForTarget;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVjb2Rlci1tYXAuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZGVjb2Rlci9kZWNvZGVyLW1hcC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7O0FBR0gsaUVBQXdIO0FBNEJ4SDs7Ozs7O0dBTUc7QUFDSCxTQUFnQixtQkFBbUIsQ0FBQyxNQUErQjtJQUMvRCxNQUFNLEdBQUcsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLDBDQUFtQixDQUFDLFVBQVUsRUFBRSxNQUFNLENBQUM7UUFDdEUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsMENBQW1CLENBQUMsVUFBVSxDQUFDLENBQUE7SUFDdkQsSUFBSSxHQUFHLEVBQUU7UUFDTCxPQUFPLEdBQUcsQ0FBQTtLQUNiO0lBRUQsMkJBQTJCO0lBQzNCLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsVUFBVSxFQUFFLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQTtJQUVsRSxPQUFPLE9BQU8sQ0FBQyxjQUFjLENBQUMsMENBQW1CLENBQUMsVUFBVSxFQUFFLE1BQU0sQ0FBZSxDQUFBO0FBQ3ZGLENBQUM7QUFYRCxrREFXQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLHdCQUF3QixDQUFDLEdBQVcsRUFBRSxNQUErQjtJQUNqRixNQUFNLFVBQVUsR0FBRyxtQkFBbUIsQ0FBQyxNQUFNLENBQUMsQ0FBQTtJQUM5QyxJQUFJLEtBQUssR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUE7SUFDM0IsSUFBSSxLQUFLLEtBQUssU0FBUyxFQUFFO1FBQ3JCLEtBQUssR0FBRztZQUNKLEdBQUc7U0FDTixDQUFBO1FBQ0QsVUFBVSxDQUFDLEdBQUcsQ0FBQyxHQUFHLEtBQUssQ0FBQTtLQUMxQjtJQUVELE9BQU8sS0FBSyxDQUFBO0FBQ2hCLENBQUM7QUFYRCw0REFXQyJ9