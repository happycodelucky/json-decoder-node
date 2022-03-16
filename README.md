
# JSON Decoder

![TypeScript Version](https://img.shields.io/badge/typescript-2.9.2-blue.svg)
![Code Style](https://img.shields.io/badge/codestyle-TypeScript-green.svg)
![](https://img.shields.io/badge/node-10.5.2-green.svg)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/pryomoax/json-decoder/master/LICENSE)

`json-decoder` allows TypeScript and JavaScript projects to adorn class declarations with JSON decoding decorators to support automatic decoding and marshalling of JSON objects to full prototype objects.

* [Installation](#installation)
* [Reflect Metadata](#reflect-metadata)
* [Simple Decoding](#simple-decoding)
* [Property Aliases](#property-aliases)
* [Type Marshalling](#type-marshalling---jsontype)
  * [Collection Marshalling](#collection-marshalling)
  * [Reverse Array Marshaling](#reverse-array-marshaling)
  * [Custom Marshaling](#custom-marshaling)
* [Custom Constructors](#custom-constructors)
* [JSON Schema Validation](#json-schema-validation)

## JavaScript Can Use JSON?

Of course it can, and the CommonJS module loader of Node.js even makes it easy to use `require('file.json')` so even loading JSON is easy!

With ES6, JavaScript introduced classes. And TypeScript uses classes way more as a first class citizen. Well in JavaScript it's simply to adopt a class prototype, and in TypeScript interfaces give JSON types.

It seems like there's isn't too much utility in `json-decoder`? These existing mechanisms are just fine if they work for you, but there are limitations of JSON:
- You get everything, not just what you want (all those extra properties)
- JSON properties might not be named appropriately or desired for your class needs
- JSON properties are limited in types, no support for `Map`, `Set`, `URL`, `Dates` or custom types
- JSON property values might need coercing, where there is a `String`, maybe a `Number`, or an object needs to be a custom object
- You may need a single property value pulled up from a sub-object property, or a single element of an array.
- Custom translation functions called to covert values
- And more...

## Usage

### Installation

To install the module use either  [`yarn`](https://yarnpkg.com) or [`npm`](npmjs.org)

#### yarn

> ```bash
> $ yarn add https://github.com/happycodelucky/json-decoder-node.git
> ```

#### npm

> ```bash
> $ npm install -S https://github.com/happycodelucky/json-decoder-node.git
> ```


### Reflect Metadata

[Reflect metadata](https://github.com/rbuckton/reflect-metadata) additions are not yet formally part of EcmaScript so are not available in JavaScript or Node.js. `reflect-metadata` is a package that must only be installed once per project. As such, it's is included here as a peer dependency.

To install in any project, use:

> ```bash
> $ yarn add reflect-metadata
> ```

To install in any model, use:

> ```bash
> $ yarn add --peer reflect-metadata
> ```

## Simple Decoding

Simplest of all declarations is to declare a class as JSON decodable by using the `@jsonDecoable` class decorator. This is required to declare decoding support.

Prototype properties can be decorated with `@jsonProperty`, inheriting the prototype property name as the name of the JSON property to map the value to.

> ```TypeScript
> import { jsonDecodable, jsonProperty } from './json-decoder'
>
> // Decodable Account class
> @jsonDecodable()
> class Account {
>   // Mapped 'id' property
>   @jsonProperty
>   public readonly id: number
>
>   // Mapped 'name' property
>   @jsonProperty
>   public readonly name: string
> }
> ```

To decode an `Account` class, use `JsonDecoder.decode` with a JSON object  (or JSON string) and the decodable class to decode, in this case `Account`

> ```TypeScript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
>
> const json = {
>   id: 1001,
>   name: 'John Smith',
> }
> // Decode the above JSON for 'Account' class
> const account = JsonDecoder.decode<Account>(json, Account)
> ```

## Property Aliases

The class you are authoring and the JSON used as a source might not be a one to one match. You class may want to use different property names or even structure the representation different to the source JSON.

This is where "aliases" come in and the `jsonPropertyAlias` comes into play.

The following uses the decorator describing the JSON property `accountId` mapped to the class prototype property `id`.

> ```TypeScript
> import { jsonDecodable, jsonPropertyAlias } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // Alias 'id' to 'accountId' property
>   @jsonPropertyAlias('account-id')
>   public readonly id: number
>
>   // ...
> }
> ```

Note the JSON object below is using `account-id` instead of `id`

> ```TypeScript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
>
> const json = {
>   'account-id': 1001,
>   name: 'John Smith',
> }
> const account = JsonDecoder.decode<Account>(json, Account)
> ```

The decoder will automatically map the `id` value based on the alias given in the `@jsonPropertyAlias`.

### Property key paths

Simple property renaming does not help with restructuring the original JSON. The decoder can help here too with **Key Paths** alias. Key paths are dot/@-notion paths to JSON values.

If the desire was to flatten a JSON object's properties this can be achieved by using a path similar to that used in TypeScript/JavaScript itself

> ```TypeScript
> {
>   id: 1001,
>   name: {
>     title: 'Dr',
>     fullName: 'John Smith',
>     suffix: 'III',
>   }
> }
> ```

The of interest `name` properties can be flatten

> ```TypeScript
> import { jsonDecodable, jsonPropertyAlias } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   @jsonPropertyAlias('name.title')
>   public readonly title: string
>
>   @jsonPropertyAlias('name.fullName')
>   public readonly fullName: string
>
>   // ...
> }
> ```

The `@`-notation can be used to address indexes of arrays if needed.

> ```TypeScript
> {
>   id: 1001,
>   name: {
>     title: 'Dr',
>     fullName: 'John Smith',
>     suffix: 'III',
>   },
>   profiles: [2001, 2002, 2451],
> }
> ```

The decode could map index `0` of `profiles` by using `profiles@0`. At the same time map all the profiles from the JSON.

> ```TypeScript
> import { jsonDecodable, jsonPropertyAlias, jsonProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // ...
>
>   @jsonPropertyAlias('profiles@0')
>   public readonly primaryProfile: number
>
>   @jsonProperty
>   public readonly profiles: Array<number>
>
>   // ...
> }
> ```

Key paths can be a long as the JSON supports. `property.arr@0.anotherProperty.YAP` will attempt to look up `YAP`, the end value. If at any point any sub-property returns `undefined` then `undefined` will be returned. If `null` is returned for any but the last property then `undefined` will be returned, else `null` will be returned.

`@` and `.` are synonymous with one another (subject to change) but provide a more readable structure of intent. That is '.' sub-property, '@' index. `a.b.c` is the same as `a@b@c`.

### Root Indexing

As a convenience, you may use `@index` as an alias, which will attempt to map a source JSON object that is an array, at `index` to the class prototype property.

Using an example of a message protocol from a network request, the message is composed of a `[header, body]` structure.

> ```TypeScript
> [
>   { message: 'ACCOUNT' },
>   { name: 'John Smith' },
> ]
> ```

Decoding the above message use `@jsonPropertyAlias('@1.name')`, where `@1` represents the body of the message.

> ```TypeScript
> import { jsonDecodable, jsonPropertyAlias } from './json-decoder'
>
> @jsonDecodable()
> class AccountMessage {
>   // ...
>
>   @jsonPropertyAlias('@1.name')
>   public readonly name: string
>
>   // ...
> }
> ```

## Type Marshalling

Type marshalling is a built-in feature of the decoder. Type marshalling allows a property of one type to be automatically converted into another. This allows more flexibility and implicit type conversion to happen automatically.

The `@jsonType` decorator allows the declaration of the class to marshal the property value to.  Natively supported types are:
* Array
* Boolean
* Date (as timestamp or string)
* Map
* Number
* Set
* URL

If class passed to `@jsonType()` is _also_ a `@jsonDecodable` class, then `json-decoder` will attempt to deserialize the object associated with the current `@jsonProperty` using the specified class.

> ```TypeScript
> import { jsonDecodable, jsonType } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // Use 'Number' marshalling
>   @jsonProperty
>   @jsonType(Number)
>   public readonly id: number
> }
> ```

The above will attempt to convert a JSON property value of `id` into a `Number`. The marshalling attempts to perform a smart conversion based on the property in the JSON. For `Number`s this could be Integers or Floats, and supports Base10, Base16 (Hex) and Base2 (Binary) number strings similar to JavaScript notation.

> ```TypeScript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
>
> const json = {
>   id: '0x3E9',
>   name: 'John Smith',
> }
> const account = JsonDecoder.decode<Account>(json, Account)
> ```

### Collection Marshalling

`jsonType` can also be used to marshal iterable collections such as `Array`, `Map` and `Set`.  To specify a collection with a specific type of element,  `@jsonType({ collection: Array | Map | Set, element: Type })` (an array of one type element).

```javascript
{
  id: 1001,
  profiles: ['2001', '2002', '2451'],
}
```
To marshal `profiles` into an `Array` of `Number`

> ```TypeScript
> import { jsonDecodable, jsonType } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // ...
>
>   @jsonType({ collection: Array, element: Number })
>   public readonly profiles: Array<number>
>
>   // ...
> }
> ```
`element` types can also be nested collections. For example:
> ```TypeScript
> import { jsonDecodable, jsonType } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // ...
>
>   @jsonType({ collection: Map, element: { collection: Map, element: String }})
>   public readonly nestedMap: Map<string, Map<string, string>>
>
>   // ...
> }
> ```


Array marshalling can also convert a single property value into an array. If the JSON object only had a single scalar property value instead, it will creating an `Array` of one element.

All element marshaling still apply here too

```javascript
{
  id: 1001,
  profiles: '2001',
}
```

### Reverse Array Marshaling

With marshaling arrays, a JSON property with an array can be marshalled into a single property value. In this case only the first element of the array is taken.

> ```javascript
> {
>   id: 1001,
>   profiles: ['2001', '2002', '2451'],
> }
> ```

> ```Javascript
>   // Marshal `profiles` into a single value
>   @jsonType(Number)
>   public readonly primaryProfile: number
>
>   // ...
>
>   @jsonType({ collection: Array, element: Number })
>   public readonly profiles: Array<number>
> ```

When decoded `primaryProfile` will be set to `2001` as a `Number`


### Custom Marshaling
Sometimes when marshaling a given attribute, one may wish to apply custom business logic to calculate the value that is assigned to the `@jsonProperty`.  To accomplish this, a function may be optionally passed as a second parameter to `@jsonType` with a signature of:

>```TypeScript
> (value: Type): OtherType
>```
For example, if a source JSON document contains an unbounded numeric value but once deserialized, it should be limited to a maximum decimal value:
> ```javascript
> {
>   id: 1001,
>   size: 9999,
> }
> ```

> ```TypeScript
>   const MAX_VALUE = 1000.01
>
>   @jsonType(Number)
>   public readonly id: number
>
>   @jsonPropertyAlias('size')
>   @jsonType(Number, (data: number): number => {
>       return Math.min(MAX_VALUE, data)
>   })
>   public readonly decimalSize: Number
> ```

## Custom Constructors
### `@jsonDecodable({ useConstructor: true })`
Sometimes when instantiating a `@jsonDecodable` class, it becomes necessary to execute some custom initialization code in the class constructor.  However, `json-decoder` will _not_ use the constructor unless directed to do so.  To cause the class constructor to get invoked when `decode()` is called, pass `{ useConstructor: true }` to `@jsonDecodable`.
>```TypeScript
> import { jsonDecodable, jsonType } from './json-decoder'
>
> @jsonDecodable({ useConstructor: true })
> class Account {
>    constructor() {
>       super()
>      // do custom initialization
>    }
>
>   @jsonProperty
>   @jsonType(Number)
>   public readonly id: number
> }
>```

### `jsonDecoderFactory`
Similarly, if one is using inheritance to describe `@jsonDecodable` classes, it may be desirable to call `decode` on a base class (which may be `abstract`), and dynamically instantiate a derived class based on the contents of the JSON.

>```TypeScript
>@jsonDecodable({ useConstructor: true })
>abstract class BaseClass {
>
>    @jsonProperty
>    name: string
>
>    @jsonProperty
>    id: number
>
>    @jsonDecoderFactory
>    static decoderClassFactory(json: JsonObject): DerivedClass_1 | DerivedClass_2 {
>        return json['some-attribute'] === 'some value'
>            ? new DerivedClass_1()
>            : new DerivedClass_2()
>    }
>
>    abstract toJSON(): JsonObject
>}
>```
## JSON Schema Validation
`json-decoder` supports validation of JSON documents using [JSON Schema](https://ajv.js.org/json-schema.html).  To enable schema validation, add the `@jsonSchema()` decorator to your class definition.

> ```TypeScript
> import { jsonDecodable, jsonType } from './json-decoder'
>
>interface MyData {
>  foo: number
>  bar?: string
>}
>
>const schema: JSONSchemaType<MyData> = {
>    $id: "http://schemas.example.com/my-data",
>    $schema: "http://json-schema.org/draft-07/schema#",
>    description: "This is my data.",
>    type: "object",
>    properties: {
>        foo: {type: "integer"},
>        bar: {type: "string", nullable: true}
>    },
>    required: ["foo"],
>    additionalProperties: false
>}
>
> @jsonDecodable({ useConstructor: true })
> @jsonSchema(schema)
> class Account {
>   // Use 'Number' marshalling
>   @jsonProperty
>   public readonly foo: number
>
>   @jsonProperty
>   bar?: string
> }
> ```
When `decode()` is called, the schema validation will be executed automatically.  If validation fails for any reason an `Error` will be thrown containing each of the validation errors encountered.