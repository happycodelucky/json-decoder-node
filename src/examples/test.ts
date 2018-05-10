
import { JsonDecoder, jsonDecodable, jsonProperty, jsonPropertyAlias, jsonSchema, jsonType } from '../'
import { JsonDecoderValidationError } from '../json/json-decoder-errors';

@jsonDecodable()
@jsonSchema({
    $schema: 'http://json-schema.org/draft-07/schema',
    description: 'Sub type',
    type: 'object',
    required: ['value', 'testValue'],
    dependencies: {
        value: ['testValue'],
    },
    additionalProperties: false,
    properties: {
        value: {
            type: ['string', 'number'],
        },
        testValue: {
            type: 'boolean',
        },
    },
    errorMessage: {
        _: '{{propertyPath}} should be a number or a string representing a number',
        required: {
            value: '{{propertyPath}} should be defined as a string or number value',
            testValue: '',
        },
        dependencies: {
            value: 'Using {{propertyPath}} required {{missingProperty}} be set',
        },
        additionalProperties: 'FAIL! {{additionalProperty}}',
    },
})
class SubType {
    @jsonPropertyAlias('value')
    @jsonType(Number)
    itemValue!: number
}

@jsonDecodable()
@jsonSchema({
    $schema: 'http://json-schema.org/draft-07/schema',
    type: 'object',
    description: 'schema for find-and-load requests',
    required: [ 'subType' ],
    properties: {
        subType: {
            $ref: '#/SubType',
        },
    },
    errorMessage: {
        required: {
            subType: '{{missingProperty}} missing fool from {{propertyPath}}',
        },
    },
})
class Test {
    @jsonProperty
    @jsonType(SubType)
    subType!: SubType

    toString() {
        return `itemValue: ${this.subType.itemValue}`
    }
}

try {
    const t = JsonDecoder.decode<Test>({
        subType: {
        //     value: 1,
        //    testValue: true,
           wayne: false,
           //john: false,
        },
    }, Test)

    console.log(t!.toString())
} catch (err) {
    console.error((err as JsonDecoderValidationError).validationErrors[0].message)
}
