"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const _1 = require("../");
const _2 = require("../");
let Account = Account_1 = 
//@jsonSchema()
class Account {
    /**
     * Will no be called because by default constructors will no longer be used
     * @jsonDecoder can be used on a static function to create the object as desired
     */
    constructor() {
        // PROBLEM!
        this.bar = 10;
        console.log('I\'m called only because of the of the use of \'useConstructor\'');
    }
    /**
     * A property handler, called when a property is found in the JSON. Multiple handler can be registered, if needs
     * be. Like an alias property, takes a key path and type to marshal the value to. The marshalled value is passed
     * to the handler.
     * @param value - marshaled value
     * @param jsonObject - Original JSON object used during decoding
     */
    fooHandler(value, jsonObject) {
        console.log(`called fooHandler(${value})`);
    }
    /**
     * Called as a custom (initial) decoder, called before any other decoder mapping internals.
     *
     * @param json - Original JSON object used during decoding
     * @return true|1|this|undefined to indicate to keep decoding, false|0|null to abort decoding. May also return
     * a new object of the same type to replace the object being decoded
     */
    decoder(json) {
        console.log(`Starting decode ${JSON.stringify(json)}`);
    }
    /**
     * A static variant, this acts as a factory function to perform decoding. If an instance version of
     * @jsonDecoder method exists, it will be called on the returned object.
     *
     * @param json - JSON objec to decode
     * @return Created object to use as the destination for a decode
     */
    // @jsonDecoder
    // private static decode(json: Object): Account | null {
    //     console.log(`Creating JSON object ${JSON.stringify(json)}`)
    //     if ('obj' in json) {
    //         // Example of calling the native constructor
    //         return new Account2()
    //     } else {
    //         return new Account()
    //     }
    // }
    /**
     * Called when decoding has completed, all properties assigned and handlers called.
     * Note, if the decoding has been aborted this will not be called
     *
     * @param json - Original JSON object used during decoding
     */
    decodeComplete(json) {
        console.log('Done decoding Account');
    }
    //
    // JSON
    //
    static fromJSON(stringOrObject) {
        return _1.JsonDecoder.decode(stringOrObject, Account_1);
    }
};
tslib_1.__decorate([
    _2.jsonContext
], Account.prototype, "context", void 0);
tslib_1.__decorate([
    _2.jsonProperty
], Account.prototype, "name", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('i', [Number], (values) => values.map(value => value * 2))
], Account.prototype, "index", void 0);
tslib_1.__decorate([
    _2.jsonPropertyAlias('obj.foo@1', [String])
], Account.prototype, "foo", void 0);
tslib_1.__decorate([
    _2.jsonPropertyHandler('obj.foo', [Number])
], Account.prototype, "fooHandler", null);
tslib_1.__decorate([
    _2.jsonDecoder
], Account.prototype, "decoder", null);
tslib_1.__decorate([
    _2.jsonDecoderCompleted
], Account.prototype, "decodeComplete", null);
Account = Account_1 = tslib_1.__decorate([
    _1.jsonDecodable({
        useConstructor: true,
    })
    //@jsonSchema()
], Account);
exports.Account = Account;
let Account2 = class Account2 extends Account {
    /**
     * Called when decoding has completed, all properties assigned and handlers called.
     * Note, if the decoding has been aborted this will not be called
     *
     * @param json - Original JSON object used during decoding
     */
    decodeComplete2(json) {
        console.log('Done decoding Account2');
    }
};
tslib_1.__decorate([
    _2.jsonPropertyAlias('obj.foo@0', Number)
], Account2.prototype, "foo0", void 0);
tslib_1.__decorate([
    _2.jsonDecoderCompleted
], Account2.prototype, "decodeComplete2", null);
Account2 = tslib_1.__decorate([
    _1.jsonDecodable({})
], Account2);
// Sample JSON
const json = [
    {
        name: 'test',
        i: '0b1001',
        obj: {
            foo: ['1', '2']
        },
    },
    {
        name: 'test2',
        i: '0xFF'
    }
];
// Decode JSON and create Account
const account = _1.JsonDecoder.decodeArray(json, Account);
if (account) {
}
var Account_1;
//const f: JsonConvertableCollectionType = [Array, Account]
//# sourceMappingURL=test.js.map