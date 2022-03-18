import * as chai from 'chai'
import { suite, test } from '@testdeck/mocha'
import { jsonDecodable, jsonProperty, jsonSchema } from '../../src'
import { JsonDecoder } from '../../src'

const expect = chai.expect

const schema = {
    $id: "base-schema",
    $schema: "http://json-schema.org/draft-07/schema#",
    description: "Base schema",
    type: "object",
    additionalProperties: false,
    properties: {
        stringVal: { type: "string" }
    }
}

const otherSchema = {
    $id: "derived-schema",
    $schema: "http://json-schema.org/draft-07/schema#",
    description: "Derived schema",
    type: "object",
    additionalProperties: false,
    properties: {
        stringVal: { type: "string" },
        numericVal: { type: "integer" }
    }
}

const schema2019 = {
    $id: "base-schema",
    $schema: "https://json-schema.org/draft/2019-09/schema",
    description: "Base schema",
    type: "object",
    additionalProperties: false,
    properties: {
        stringVal: { type: "string" }
    }
}

const schema2020 = {
    $id: "base-schema",
    $schema: "https://json-schema.org/draft/2020-12/schema",
    description: "Base schema",
    type: "object",
    additionalProperties: false,
    properties: {
        stringVal: { type: "string" }
    }
}
@jsonSchema(schema)
@jsonDecodable({ useConstructor: true })
class BaseClass {
    @jsonProperty
    stringVal!: string
}

@jsonDecodable({ useConstructor: true })
class BaseClassNoSchema {
    @jsonProperty
    stringVal!: string
}

@jsonDecodable({ useConstructor: true })
class DerivedClassInheritedSchema extends BaseClass {
    @jsonProperty
    numericVal!: number
}

@jsonSchema(otherSchema)
@jsonDecodable({ useConstructor: true })
class DerivedClassSchemaOverride extends BaseClass {
    @jsonProperty
    numericVal!: number


}

@jsonSchema(otherSchema)
@jsonDecodable({ useConstructor: true })
class DerivedClassWithSchema extends BaseClassNoSchema {
    @jsonProperty
    numericVal!: number
}

@jsonSchema(schema2019)
@jsonDecodable({ useConstructor: true })
class Schema2019 extends BaseClassNoSchema {
    @jsonProperty
    numericVal!: number
}

@jsonSchema(schema2020)
@jsonDecodable({ useConstructor: true })
class Schema2020 extends BaseClassNoSchema {
    @jsonProperty
    numericVal!: number
}

@suite('Unit: JSON schema')
export class SchemaTests {
    @test('basic validation')
    testValidation() {
        const object = JsonDecoder.decode<BaseClass>({ stringVal: 'bar' }, BaseClass)!
        expect(object.stringVal).to.equal('bar')
    }

    @test('basic validation - fail')
    testValidationFail() {
        expect(
            () => {JsonDecoder.decode<BaseClass>({ stringVal: 5 }, BaseClass)}
        ).to.throw('JSON validation failed')
    }

    @test('additional properties validation - fail')
    testAdditionalPropertiesValidationFail() {
        expect(
            () => {JsonDecoder.decode<BaseClass>({ stringVal: 'foo', extraVal: 'bar' }, BaseClass)}
        ).to.throw('JSON validation failed')
    }

    @test('derived class with inherited schema validation')
    testDerivedClassInheritSchemaValidation() {
        const base = JsonDecoder.decode<BaseClass>({ stringVal: 'bar' }, BaseClass)!
        expect(base.stringVal).to.equal('bar')

        const derived = JsonDecoder.decode<DerivedClassInheritedSchema>({ stringVal: 'bar'}, DerivedClassSchemaOverride)!

        expect(derived.stringVal).to.equal('bar')
    }

    @test('derived class with inherited schema validation - fail')
    testDerivedClassInheritSchemaValidationFail() {
        const base = JsonDecoder.decode<BaseClass>({ stringVal: 'bar' }, BaseClass)!
        expect(base.stringVal).to.equal('bar')

        expect(
            () => {JsonDecoder.decode<DerivedClassInheritedSchema>({ stringVal: 5 }, DerivedClassInheritedSchema)}
        ).to.throw('JSON validation failed')

        expect(
            () => {JsonDecoder.decode<DerivedClassInheritedSchema>({ numericVal: 5 }, DerivedClassInheritedSchema)}
        ).to.throw('JSON validation failed')
    }

    @test('derived class with overridden schema validation')
    testDerivedClassOverrideSchemaValidation() {
        const base = JsonDecoder.decode<BaseClass>({ stringVal: 'bar' }, BaseClass)!
        expect(base.stringVal).to.equal('bar')

        const derived = JsonDecoder.decode<DerivedClassSchemaOverride>(
            {
                numericVal: 1,
                stringVal: 'bar'
            }, DerivedClassSchemaOverride)!

        expect(derived.numericVal).to.equal(1)
        expect(derived.stringVal).to.equal('bar')
    }

    @test('derived class with local schema validation (no inherited schema) - fail')
    testDerivedClassLocalSchemaValidation() {
        const base = JsonDecoder.decode<BaseClassNoSchema>({ stringVal: 'bar' }, BaseClassNoSchema)!
        expect(base.stringVal).to.equal('bar')

        const derived = JsonDecoder.decode<DerivedClassWithSchema>(
            {
                numericVal: 1,
                stringVal: 'bar'
            }, DerivedClassWithSchema)!

        expect(derived.numericVal).to.equal(1)
        expect(derived.stringVal).to.equal('bar')
    }

    @test('derived class with local schema validation (no inherited schema) - fail')
    testDerivedClassLocalSchemaValidationFail() {
        const base = JsonDecoder.decode<BaseClassNoSchema>({ stringVal: 'bar' }, BaseClassNoSchema)!
        expect(base.stringVal).to.equal('bar')

        expect(
            () => { JsonDecoder.decode<DerivedClassWithSchema>(
                {
                    numericVal: 1,
                    stringVal: 0
                }, DerivedClassWithSchema)}
        ).to.throw('JSON validation failed')
    }

    @test('basic validation - 2019 spec')
    testValidation2019() {
        const object = JsonDecoder.decode<Schema2019>({ stringVal: 'bar' }, Schema2019)!
        expect(object.stringVal).to.equal('bar')
    }

    @test('basic validation - 2020 spec')
    testValidation2020() {
        const object = JsonDecoder.decode<Schema2020>({ stringVal: 'bar' }, Schema2020)!
        expect(object.stringVal).to.equal('bar')
    }

}