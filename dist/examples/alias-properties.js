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
//# sourceMappingURL=alias-properties.js.map