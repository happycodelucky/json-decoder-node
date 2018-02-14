import { JsonDecoder, jsonDecodable } from '../'
import { jsonProperty, jsonPropertyAlias, jsonPropertyHandler, jsonDecoder, jsonDecoderCompleted } from '../'

enum Roles {
    Guest = 'guest',
    User  = 'user',
    Admin = 'admin',
}

@jsonDecodable({})
//@jsonSchema
class NumberAliasExamples {

    // Use property name as key name, convert to Number
    @jsonPropertyAlias(undefined, Number)
    public readonly decimal: Number

    @jsonPropertyAlias(undefined, Number)
    public readonly hex: Number   
    
    @jsonPropertyAlias(undefined, Number)
    public readonly binary: Number

    @jsonPropertyAlias(undefined, Number)
    public readonly float: Number
}

const json = {
    decimal: '1001',
    hex: '0xFF',
    binary: '0b10101010',
    float: '12.3E-5',
}

// const example = JsonDecoder.decode(json, NumberAliasExamples)
// console.log('NumberAliasExamples')
// console.log(JSON.stringify(example, undefined, '  '))


@jsonDecodable({})
//@jsonSchema
class BooleanAliasExamples {

    // Use property name as key name, convert to Number
    @jsonPropertyAlias(undefined, Boolean)
    public readonly string: boolean

    @jsonPropertyAlias(undefined, Boolean)
    public readonly number: boolean   
    
    @jsonPropertyAlias(undefined, Boolean)
    public readonly reverseArray: boolean

    @jsonPropertyAlias(undefined, [Boolean])
    public readonly toArray: [boolean]
}

const json2 = {
    string: 'true',
    number: 1,
    reverseArray: ['false', true],
    toArray: true,
}

const example2 = JsonDecoder.decode(json2, BooleanAliasExamples)
console.log('BooleanAliasExamples')
console.log(JSON.stringify(example2, undefined, '  '))


@jsonDecodable({})
class AliasExamples {

    // Use property name as key name, convert to Number
    @jsonPropertyAlias('simple')
    public readonly simple: String

    @jsonPropertyAlias('nested.simple')
    public readonly nestedSimple: String
    
    @jsonPropertyAlias('nested.array@1', String)
    public readonly nestedArrayAt1: String

    @jsonPropertyAlias('nested.doubleNested')
    public readonly doubleNestedSimpleObject: Object

    @jsonPropertyAlias('nested.doubleNested.simpleNumber')
    public readonly doubleNestedSimpleNumber: Number
}

const aliasJson = {
    simple: 'simple',
    nested: {
        simple: 'nested-simple',
        array: ['nested-array-0', 'nested-array-1'],
        doubleNested: {
            simpleNumber: 5,
        }
    },

}

const aliasExample = JsonDecoder.decode(aliasJson, AliasExamples)
console.log('AliasExamples')
console.log(JSON.stringify(aliasExample, undefined, '  '))


@jsonDecodable({})
class MapFunctionExamples {

    // Convert to numbers and back to strings (Base10 strings)
    @jsonPropertyAlias('values', [Number], (values: Array<number>) => values.map(value => value.toString()))
    public readonly base10String: Array<string>

    @jsonPropertyAlias('values', [Number], (values: Array<number>) => values.map(value => `0x${value.toString(16).toUpperCase()}`))
    public readonly base16String: Array<string>    

    // Alias with map function, which actually a reduce
    @jsonPropertyAlias('values', [Number], (values: Array<number>) => values.reduce((value, acc) => { return acc + value}, 0))
    public readonly accumalator: number

    // Reverse the property string value
    @jsonPropertyAlias('welcome', String, (value: string) => value.split('').reverse().join(''))
    public readonly string: string
}

const mapFunctionJson = {
    welcome: 'Hello World',
    values: ['1', '0b101', '0xFF', '2.3333'],
}

const mapFunctionExample = JsonDecoder.decode(mapFunctionJson, MapFunctionExamples)
console.log('MapFunctionExamples')
console.log(JSON.stringify(mapFunctionExample, undefined, '  '))