# JSON Decoder

![TypeScript Version](https://img.shields.io/badge/typescript-2.6.3-blue.svg) 
![Code Style](https://img.shields.io/badge/codestyle-TypeScript-green.svg)
![](https://img.shields.io/badge/node-8.9.3-green.svg) 
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/pryomoax/json-decoder/master/LICENSE)

`json-decoder` allowes TypeScript and JavaScript projects to adorn class declarations with JSON decoding decorators to support automatic decoding and marshalling of JSON objects to full prototype objects.

**This module is not read for consumption and is a work in progress**

## Release Notes

| Version | Description                              |
| :-----: | ---------------------------------------- |
|  0.1.0  | In Progress  |

## Distributions

This module is written using [TypeScript](http://typescriptlang.org) and distributed with the following JavaScript support:

-  [`json-decoder/dist`](./master/node/dist)

A TypeScript compiler is not required to consume this module

## Usage

### Installation

To install the module use either [`npm`](npmjs.org) or [`yarn`](https://yarnpkg.com).

#### yarn

> ```bash
> $ yarn add git+https://github.com/pryomoax/json-decoder
> ```

#### npm

> ```bash
> $ npm install -S git+https://github.com/pryomoax/json-decoder
> ```

## Modern Decorators

[Decorators for Javascript](https://github.com/tc39/proposal-decorators) are not formally part of the ES standard, but are natively supported through Babel or TypeScript. `json-decoder` uses decorators as its primary declartive syntax to attach semantics to class declarations.

It is possible to use `json-decoder` with pure JavaScript using explicit functions but not all things are supported.

## Simple Declarations

Simpliest of all declarations is to declare a class as JSON decodable by using the `@jsonDecoable` class decorator. This is required to declare decoding support.

Prototype properties can be decorated with `@jsonProperty`, inheriting the prototype property name as the name of the JSON property to map the value to.

> ```Javascript
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

To decode an `Account` class, use `JsonDecoder.decode` with a JSON object  (or JSON string) and the decoable class to decode, in this case `Account`

> ```Javascript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
> 
> const json = {
>   id: 1001,
>   name: 'John Smith',
> }
> // Decode the above JSON for 'Account' class
> const account = JsonDecoder.decode(json, Account)
> ```

## Property Aliases

The class you are authoring and the JSON used as a source might not be a one to one match. You class may want to use different property names or even structure the representation different to the source JSON.

This is where "aliases" come in and the `jsonAliasProperty` comes into play.

The following uses the decorator describing the JSON property `accountId` mapped to the class prototype property `id`.

> ```Javascript
> import { jsonDecodable, jsonAliasProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // Alias 'id' to 'accountId' property
>   @jsonAliasProperty('accountId')
>   public readonly id: number
>   
>   // ...
> }
> ```

Note the JSON object below is using `accountId` instead of `id`

> ```Javascript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
> 
> const json = {
>   accountId: 1001,
>   name: 'John Smith',
> }
> const account = JsonDecoder.decode(json, Account)
> ```

The decoder will automatically map the `id` value based on the alias given in the `@jsonAliasProperty`.

### Property key paths

Simple property renaming does not help with restructing the original JSON. The decoder can help here too with **Key Paths** alias. Key paths are dot/@-notion paths to JSON values.

If the desire was to flatten a JSON object's properties this can be achieved by using a path similar to that used in TypeScript/JavaScript itself

> ```Javascript
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

> ```Javascript
> import { jsonDecodable, jsonAliasProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   @jsonAliasProperty('name.title')
>   public readonly title: string
>
>   @jsonAliasProperty('name.fullName')
>   public readonly fullName: string
>   
>   // ...
> }
> ```

The `@`-notation can be used to address indexes of arrays if needed.

> ```Javascript
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

> ```Javascript
> import { jsonDecodable, jsonAliasProperty, jsonProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // ...
>   
>   @jsonAliasProperty('profiles@0')
>   public readonly primaryProfile: number
>   
>   @jsonProperty
>   public readonly profiles: Array<number>
>   
>   // ...
> }
> ```

Key paths can be a long as the JSON supports. `property.arr@0.anotherProperty.YAP` will attempt to look up `YAP`, the end value. If at any point any sub-property returns `undefined` then `undefined` will be returned. If `null` is returned for any but the last property then `undefined` will be returned, else `null` will be returned.

`@` and `.` are synonmous with one another (subject to change) but provide a more readable structure of intent. That is '.' sub-property, '@' index. `a.b.c` is the same as `a@b@c`. 

### Root Indexing

As a convenience, you may use `@index` as an alias, which will attempt to map a source JSON object that is an array, at `index` to the class prototype property.

Using an example of a message protocol from a network request, the message is composed of a `[header, body]` structure. 

> ```Javascript
> [
>   { message: 'ACCOUNT' },
>   { name: 'John Smith' },
> ]
> ```

Decoding the above message use `@jsonAliasProperty('@1.name')`, where `@1` represents the body of the message.

> ```Javascript
> import { jsonDecodable, jsonAliasProperty } from './json-decoder'
>
> @jsonDecodable()
> class AccountMessage {
>   // ...
>   
>   @jsonAliasProperty('@1.name')
>   public readonly name: string
>   
>   // ...
> }
> ```

## Type Marshalling

Type marhalling is an in-built feature of the decoder. Type marshalling allows a property of one type to be automatically converted into another. This allows more flexibility and implicit type conversion to happen automatically.

The `@jsonAliasProperty` accepts a second argument which is the class to marshal the property value to.

> ```Javascript
> import { jsonDecodable, jsonAliasProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // Use 'Number' marshalling
>   @jsonAliasProperty('id', Number)
>   public readonly id: number
> }
> ```

The above will attempt to convert a JSON property value of `id` into a `Number`. The marshalling attempts to perform a smart conversion based on the property in the JSON. For `Numbers` this could be Integers or Floats, and supports Base10, Base16 (Hex) and Base2 (Binary) number strings similar to JavaScript notation.

> ```Javascript
> import { JsonDecoder } from 'json-decoder'
> import { Account } from './account'
>
> const json = {
>   id: '0x3E9',
>   name: 'John Smith',
> }
> const account = JsonDecoder.decode(json, Account)
> ```

### Array Marshalling

JSON is also full of array structures and to support the marshaller an array convention can be used to indicate the marshaller type. Instead of using just `Type` use `[Type]` (an array of one type element).

```javascript
{
  id: 1001,
  profiles: ['2001', '2002', '2451'],
}
```
To marshal `profiles` into an `Array` of `Number`

> ```Javascript
> import { jsonDecodable, jsonAliasProperty } from './json-decoder'
>
> @jsonDecodable()
> class Account {
>   // ...
>   
>   @jsonAliasProperty('profiles', [Number])
>   public readonly profiles: Array<number>
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

Finally, with marshaling arrays, a JSON property with an array can be marshalled into a single property value. In this case only the first element of the array is taken.

> ```javascript
> {
>   id: 1001,
>   profiles: ['2001', '2002', '2451'],
> }
> ```

> ```Javascript
>   // Marshal `profiles` into a single value
>   @jsonAliasProperty('profiles', Number)
>   public readonly primaryProfile: number
>
>   // ...
>   
>   @jsonAliasProperty('profiles', [Number])
>   public readonly profiles: Array<number>
> ```

When decoded `primaryProfile` will be set to `2001` as a `Number`
