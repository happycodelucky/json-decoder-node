"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _1 = require("../");
const _2 = require("../");
var Roles;
(function (Roles) {
    Roles["Guest"] = "guest";
    Roles["User"] = "user";
    Roles["Admin"] = "admin";
})(Roles || (Roles = {}));
let NumberAliasExamples = 
//@jsonSchema
class NumberAliasExamples {
};
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Number)
], NumberAliasExamples.prototype, "decimal", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Number)
], NumberAliasExamples.prototype, "hex", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Number)
], NumberAliasExamples.prototype, "binary", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Number)
], NumberAliasExamples.prototype, "float", void 0);
NumberAliasExamples = tslib_1.__decorate([
    _1.jsonDecodable({})
    //@jsonSchema
], NumberAliasExamples);
const json = {
    decimal: '1001',
    hex: '0xFF',
    binary: '0b10101010',
    float: '12.3E-5'
};
// const example = JsonDecoder.decode(json, NumberAliasExamples)
// console.log('NumberAliasExamples')
// console.log(JSON.stringify(example, undefined, '  '))
let BooleanAliasExamples = 
//@jsonSchema
class BooleanAliasExamples {
};
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Boolean)
], BooleanAliasExamples.prototype, "string", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Boolean)
], BooleanAliasExamples.prototype, "number", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, Boolean)
], BooleanAliasExamples.prototype, "reverseArray", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias(undefined, [Boolean])
], BooleanAliasExamples.prototype, "toArray", void 0);
BooleanAliasExamples = tslib_1.__decorate([
    _1.jsonDecodable({})
    //@jsonSchema
], BooleanAliasExamples);
const json2 = {
    string: 'true',
    number: 1,
    reverseArray: ['false', true],
    toArray: true
};
const example2 = _1.JsonDecoder.decode(json2, BooleanAliasExamples);
console.log('BooleanAliasExamples');
console.log(JSON.stringify(example2, undefined, '  '));
let AliasExamples = class AliasExamples {
};
tslib_1.__decorate([
    _2.jsonPropertyAlias('simple')
], AliasExamples.prototype, "simple", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('nested.simple')
], AliasExamples.prototype, "nestedSimple", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('nested.array@1', String)
], AliasExamples.prototype, "nestedArrayAt1", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('nested.doubleNested')
], AliasExamples.prototype, "doubleNestedSimpleObject", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('nested.doubleNested.simpleNumber')
], AliasExamples.prototype, "doubleNestedSimpleNumber", void 0);
AliasExamples = tslib_1.__decorate([
    _1.jsonDecodable({})
], AliasExamples);
const aliasJson = {
    simple: 'simple',
    nested: {
        simple: 'nested-simple',
        array: ['nested-array-0', 'nested-array-1'],
        doubleNested: {
            simpleNumber: 5
        }
    }
};
const aliasExample = _1.JsonDecoder.decode(aliasJson, AliasExamples);
console.log('AliasExamples');
console.log(JSON.stringify(aliasExample, undefined, '  '));
let MapFunctionExamples = class MapFunctionExamples {
};
tslib_1.__decorate([
    _2.jsonPropertyAlias('values', [Number], (values) => values.map((value) => value.toString()))
], MapFunctionExamples.prototype, "base10String", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('values', [Number], (values) => values.map((value) => `0x${value.toString(16).toUpperCase()}`))
], MapFunctionExamples.prototype, "base16String", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('values', [Number], (values) => values.reduce((value, acc) => {
        return acc + value;
    }, 0))
], MapFunctionExamples.prototype, "accumalator", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('welcome', String, (value) => value
        .split('')
        .reverse()
        .join(''))
], MapFunctionExamples.prototype, "string", void 0);
MapFunctionExamples = tslib_1.__decorate([
    _1.jsonDecodable({})
], MapFunctionExamples);
const mapFunctionJson = {
    welcome: 'Hello World',
    values: ['1', '0b101', '0xFF', '2.3333']
};
const mapFunctionExample = _1.JsonDecoder.decode(mapFunctionJson, MapFunctionExamples);
console.log('MapFunctionExamples');
console.log(JSON.stringify(mapFunctionExample, undefined, '  '));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWxpYXMtcHJvcGVydGllcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2V4YW1wbGVzL2FsaWFzLXByb3BlcnRpZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsMEJBQWdEO0FBQ2hELDBCQUE2RztBQUU3RyxJQUFLLEtBSUo7QUFKRCxXQUFLLEtBQUs7SUFDTix3QkFBZSxDQUFBO0lBQ2Ysc0JBQWEsQ0FBQTtJQUNiLHdCQUFlLENBQUE7QUFDbkIsQ0FBQyxFQUpJLEtBQUssS0FBTCxLQUFLLFFBSVQ7QUFJRCxJQUFNLG1CQUFtQjtBQUR6QixhQUFhO0FBQ2I7Q0FhQyxDQUFBO0FBVkc7SUFEQyxvQkFBaUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO29EQUNOO0FBRy9CO0lBREMsb0JBQWlCLENBQUMsU0FBUyxFQUFFLE1BQU0sQ0FBQztnREFDVjtBQUczQjtJQURDLG9CQUFpQixDQUFDLFNBQVMsRUFBRSxNQUFNLENBQUM7bURBQ1A7QUFHOUI7SUFEQyxvQkFBaUIsQ0FBQyxTQUFTLEVBQUUsTUFBTSxDQUFDO2tEQUNSO0FBWjNCLG1CQUFtQjtJQUZ4QixnQkFBYSxDQUFDLEVBQUUsQ0FBQztJQUNsQixhQUFhO0dBQ1AsbUJBQW1CLENBYXhCO0FBRUQsTUFBTSxJQUFJLEdBQUc7SUFDVCxPQUFPLEVBQUUsTUFBTTtJQUNmLEdBQUcsRUFBRSxNQUFNO0lBQ1gsTUFBTSxFQUFFLFlBQVk7SUFDcEIsS0FBSyxFQUFFLFNBQVM7Q0FDbkIsQ0FBQTtBQUVELGdFQUFnRTtBQUNoRSxxQ0FBcUM7QUFDckMsd0RBQXdEO0FBSXhELElBQU0sb0JBQW9CO0FBRDFCLGFBQWE7QUFDYjtDQWFDLENBQUE7QUFWRztJQURDLG9CQUFpQixDQUFDLFNBQVMsRUFBRSxPQUFPLENBQUM7b0RBQ1A7QUFHL0I7SUFEQyxvQkFBaUIsQ0FBQyxTQUFTLEVBQUUsT0FBTyxDQUFDO29EQUNQO0FBRy9CO0lBREMsb0JBQWlCLENBQUMsU0FBUyxF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