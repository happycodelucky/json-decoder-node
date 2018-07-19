
import { JsonDecoder, jsonDecodable, jsonProperty, jsonType } from '../'
import { JsonDecoderValidationError } from '../json/json-decoder-errors'

@jsonDecodable({
    useConstructor: true,
})
class Test {

    @jsonProperty
    @jsonType(Boolean)
    test: boolean = false

}

// // @jsonDecodable()
// // @jsonSchema({
// //     $schema: 'http://json-schema.org/draft-07/schema',
// //     description: 'Sub type',
// //     type: 'object',
// //     required: ['value', 'testValue'],
// //     dependencies: {
// //         value: ['testValue'],
// //     },
// //     additionalProperties: false,
// //     properties: {
// //         value: {
// //             type: ['string', 'number'],
// //         },
// //         testValue: {
// //             type: 'boolean',
// //         },
// //     },
// //     errorMessage: {
// //         _: '{{propertyPath}} should be a number or a string representing a number',
// //         required: {
// //             value: '{{propertyPath}} should be defined as a string or number value',
// //             testValue: '',
// //         },
// //         dependencies: {
// //             value: 'Using {{propertyPath}} required {{missingProperty}} be set',
// //         },
// //         additionalProperties: 'FAIL! {{additionalProperty}}',
// //     },
// // })
// // class SubType {
// //     @jsonPropertyAlias('value')
// //     @jsonType(Number)
// //     itemValue!: number
// // }

// // @jsonDecodable()
// // @jsonSchema({
// //     $schema: 'http://json-schema.org/draft-07/schema',
// //     type: 'object',
// //     description: 'schema for find-and-load requests',
// //     required: [ 'subType' ],
// //     properties: {
// //         subType: {
// //             $ref: '#/SubType',
// //         },
// //     },
// //     errorMessage: {
// //         required: {
// //             subType: '{{missingProperty}} missing fool from {{propertyPath}}',
// //         },
// //     },
// // })
// // class Test {
// //     @jsonProperty
// //     @jsonType(SubType)
// //     subType!: SubType

// //     toString() {
// //         return `itemValue: ${this.subType.itemValue}`
// //     }
// // }


// @jsonDecodable()
// @jsonSchema(
//   {
//     $id: '//schemas.sonos.com/find:1/FindAndLoadRequest',
//     $schema: 'http://json-schema.org/draft-07/schema',
//     type: 'object',
//     required: ['foo'],
//     properties: {
//       foo: { type: 'integer' },
//       timezone: {
//         $ref: 'http://schemas.sonos.com/types/basic#/definitions/Timezone',
//       },
//       preferredServices: {
//         $ref: 'http://schemas.sonos.com/types/basic#/definitions/PreferredServices',
//       },
//       preferredServicesOnly: {
//         $ref: 'http://schemas.sonos.com/types/basic#/definitions/Boolean',
//       },
//     },
//     additionalProperties: false,
//     errorMessage: {
//       type: 'should be an object', // will not replace internal "type" error for the property "foo"
//       required: {
//         foo: 'should have property foo',
//       },
//       additionalProperties: 'should not have properties other than {{additionalProperty}}',
//     },
//   },
// // {
// //     $id: '//schemas.sonos.com/find:1/FindAndLoadRequest',
// //     $schema: 'http://json-schema.org/draft-07/schema',
// //     description: 'Schema for find:1 findAndLoad requests',
// //     type: 'object',
// //     required: [
// //       'timezone',
// //     ],
// //     dependencies: {
// //       preferredServicesOnly: [
// //         'preferredServices',
// //       ],
// //     },
// //     additionalProperties: false,
// //     properties: {
// //       timezone: {
// //         $ref: 'http://schemas.sonos.com/types/basic#/definitions/Timezone',
// //       },
// //       preferredServices: {
// //         $ref: 'http://schemas.sonos.com/types/basic#/definitions/PreferredServices',
// //       },
// //       preferredServicesOnly: {
// //         $ref: 'http://schemas.sonos.com/types/basic#/definitions/Boolean',
// //       },
// //     },
// //     errorMessages: {
// //       properties: {
// //         timezone: '{{propertyPath}} is missing and is required for all findAndLoad requests',
// //       }
// //       //_: 'Bummer',
// //       type: 'Totally invalid',
// //       // required: {
// //       //   timezone: '{{propertyPath}} is missing and is required for all findAndLoad requests',
// //       // },
// //       // depedencies: {
// //       //   preferredServicesOnly: '{{propertyPath}} requires {{property}} to be specified if used',
// //       // },
// //       // additionalProperties: 'findAndLoad does not support {{additionalProperty}}',
// //     },
// //     errorMessage: 'Ah shit {{property}} {{additionalProperty}} {{propertyPath}}',
// // },
//   {
//     $schema: 'http://json-schema.org/draft-07/schema',
//     $id: 'http://schemas.sonos.com/types/basic',
//     definitions: {
//       Boolean: {
//         type: 'boolean',
//         errorMessage: {
//           type: '{{propertyPath}} should be either \'true\' or \'false\'',
//         },
//       },
//       ContentServiceId: {
//         oneOf: [
//           {
//             type: 'string',
//             pattern: '^[a-zA-Z0-0-\\.]+$',
//           },
//           {
//             type: 'number',
//           },
//         ],
//         errorMessage: {
//           _: '{{propertyPath}} should be a string representing a service identifier, like \'apple-music\' or \'spotify',
//         },
//       },
//       PreferredServices: {
//         type: 'array',
//         minItems: 1,
//         items: {
//           $ref: '#/definitions/ContentServiceId',
//         },
//         errorMessage: {
//           _: '{{propertyPath}} should be an list of service identifers, like \'apple-music\' or \'spotify\'',
//           minItems: '{{propertyPath}} needs to have at least one service identifier if specified',
//           unique: '{{propertyPath}} should only include each service identifier once',
//         },
//       },
//       Timezone: {
//         type: 'string',
//         pattern: '^[zZ]$|([\\+-])(([0|1]?\\d)|(2[0-3]))(\\:[0|1|3|4][0|5])?$',
//         errorMessage: {
//           _: '{{propertyPath} has to be a valid ISO8601 string representing a time zone',
//         },
//       },
//     },
//   },
// )
// class Test {

// }

try {
    const t = JsonDecoder.decode<Test>({
      test: '1',
    }, Test, {
        lazyDecode: true,
    })
    console.log(t!.test)
    console.log(t!.test)
} catch (err) {
    console.error((err as JsonDecoderValidationError).validationErrors[0].message)
}
