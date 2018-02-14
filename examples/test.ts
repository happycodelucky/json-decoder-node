import { JsonDecoder, jsonDecodable } from '../'
import { jsonProperty, jsonPropertyAlias, jsonPropertyHandler, jsonDecoder, jsonDecoderCompleted } from '../'

@jsonDecodable({
    schema: {},
})
//@jsonSchema()
export class Account {

    /**
     * Simple JSON property, takes property name as key
     */
    @jsonProperty
    public readonly name: string

    /**
     * Aliased property, takes 'i' as the key, and marshals the value to an array of Number
     * There is also a map function that takes the marshaled results and applies a function to each
     */
    @jsonPropertyAlias('i', [Number], (values: Array<number>) => values.map(value => value * 2))
    public readonly index: Array<number>

    /**
     * Alias property that looks up a nested property. 
     * In this case, object 'obj', take the array value of 'foo' and use index '1' in foo's array
     */
    @jsonPropertyAlias('obj.foo@1', [String])
    public readonly foo: number

    // PROBLEM!
    public readonly bar: number = 10

    /**
     * Will no be called because by default constructors will no longer be used
     * @jsonDecoder can be used on a static function to create the object as desired
     */
    constructor() {
        console.log('I will never be called')
    }

    /**
     * A property handler, called when a property is found in the JSON. Multiple handler can be registered, if needs
     * be. Like an alias property, takes a key path and type to marshal the value to. The marshalled value is passed
     * to the handler.
     * @param value - marshaled value
     * @param jsonObject - Original JSON object used during decoding
     */
    @jsonPropertyHandler('obj.foo', [Number])
    public fooHandler(value: Array<number>, jsonObject: object) {
        console.log(`called fooHandler(${value})`)
    }

    /**
     * Called as a custom (initial) decoder, called before any other decoder mapping internals.
     * 
     * @param json - Original JSON object used during decoding
     * @return true|1|this|undefined to indicate to keep decoding, false|0|null to abort decoding. May also return
     * a new object of the same type to replace the object being decoded
     */
    @jsonDecoder
    private decoder(json: Object) {
        console.log(`Starting decode ${JSON.stringify(json)}`)
    }

    /**
     * A static variant, this acts as a factory function to perform decoding. If an instance version of 
     * @jsonDecoder method exists, it will be called on the returned object.
     * 
     * @param json - JSON objec to decode
     * @return Created object to use as the destination for a decode
     */
    @jsonDecoder
    private static decode(json: Object): Account | null {
        console.log(`Creating JSON object ${JSON.stringify(json)}`)

        if ('obj' in json) {
            // Example of calling the native constructor
            return new Account2()
        } else {
            return new Account()
        }

    }

    /**
     * Called when decoding has completed, all properties assigned and handlers called.
     * Note, if the decoding has been aborted this will not be called
     * 
     * @param json - Original JSON object used during decoding
     */
    @jsonDecoderCompleted
    private decodeComplete(json: object) {
        console.log('Done decoding Account')
    }

    //
    // JSON
    //

    static fromJSON(stringOrObject: string | object): Account | null {
        return JsonDecoder.decode(stringOrObject, Account)
    }
}

@jsonDecodable({})
class Account2 extends Account {

    /**
     * Alias property that looks up a nested property. 
     * In this case, object 'obj', take the array value of 'foo' and use index '1' in foo's array
     */
    @jsonPropertyAlias('obj.foo@0', Number)
    public readonly foo0: number

    /**
     * Called when decoding has completed, all properties assigned and handlers called.
     * Note, if the decoding has been aborted this will not be called
     * 
     * @param json - Original JSON object used during decoding
     */
    @jsonDecoderCompleted
    private decodeComplete2(json: object) {
        console.log('Done decoding Account2')
    }
}

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
]

// Decode JSON and create Account
const account = JsonDecoder.decodeArray(json, Account)
if (account){
    
}

//const f: JsonConvertableCollectionType = [Array, Account]