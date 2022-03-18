"use strict";
/**
 * @module json-decoder
 *
 * JSON specific types an interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isJSONConvertable = void 0;
const tslib_1 = require("tslib");
tslib_1.__exportStar(require("../decoder/decodable-types"), exports);
/**
 * Type assertion for JsonConvertable types
 * @param type - type to check for conformance
 */
function isJSONConvertable(type) {
    return 'fromJSON' in type;
}
exports.isJSONConvertable = isJSONConvertable;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoianNvbi1kZWNvZGFibGUtdHlwZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvanNvbi9qc29uLWRlY29kYWJsZS10eXBlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7R0FJRzs7OztBQUVILHFFQUEwQztBQTBCMUM7OztHQUdHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsSUFBUztJQUN2QyxPQUFPLFVBQVUsSUFBSSxJQUFJLENBQUE7QUFDN0IsQ0FBQztBQUZELDhDQUVDIn0=