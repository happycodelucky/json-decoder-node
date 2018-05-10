
import { JsonDecoder, jsonDecodable, jsonProperty, jsonPropertyAlias, jsonSchema, jsonType } from '../'
import { JsonDecoderValidationError } from '../json/json-decoder-errors';

@jsonDecodable()
@jsonSchema({
    $schema: 'http://json-schema.org/draft-07/schema',
    description: 'Sub type',
    type: 'object',
    required: ['value'],
    properties: {
        value: {
            type: ['string', 'number'],
        },
    },
    errorMessage: {
        _: 'should be a number or a string representing a number',
        required: {
            value: 'should be defined as a string or number value',
        },
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
            subType: 'missing fool',
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
            value: 1,
        },
    }, Test)

    console.log(t!.toString())
} catch (err) {
    console.error((err as JsonDecoderValidationError).validationErrors[0].message)
}
