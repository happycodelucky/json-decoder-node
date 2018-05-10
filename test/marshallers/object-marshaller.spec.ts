import * as chai from 'chai'
import { toObject } from '../../src/marshallers/object-marshaller'

// @ts-ignore
import { context, only, skip, suite, test, timeout } from 'mocha-typescript'

// Set up chai
const expect = chai.expect

@suite('Unit: toObject')
// @ts-ignore
export class ObjectTests {

    @test('undefined tests')
    testUndefined() {
        expect(toObject(undefined)).to.be.undefined

        // Strict mode

        expect(toObject(undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toObject(null)).to.be.null

        // Strict mode

        expect(toObject(null, true)).to.be.null
    }

    @test('array value tests')
    testArrayValues() {
        const object1 = {
            foo: 'bar',
        }
        expect(toObject([1, '2', object1])).to.be.deep.equal({ value: [1, '2', object1] })
        expect(toObject([])).to.be.deep.equal({ value: [] })

        // Strict mode

        expect(toObject([1, '2', object1], true)).to.be.deep.equal({ value: [1, '2', object1] })
        expect(toObject([], true)).to.be.deep.equal({ value: [] })
    }

    @test('boolean value tests')
    testBooleanValues() {
        expect(toObject(true)).to.be.deep.equal({ value: true })
        expect(toObject(false)).to.be.deep.equal({ value: false })

        // Strict mode

        expect(toObject(true, true)).to.be.deep.equal({ value: true })
        expect(toObject(false, true)).to.be.deep.equal({ value: false })
    }

    @test('number value tests')
    testNumberValues() {
        expect(toObject(-123)).to.be.deep.equal({ value: -123 })
        expect(toObject(0)).to.be.deep.equal({ value: 0 })
        expect(toObject(123)).to.be.deep.equal({ value: 123 })
        expect(toObject(123.456)).to.be.deep.equal({ value: 123.456 })

        // Strict mode

        expect(toObject(-123, true)).to.be.deep.equal({ value: -123 })
        expect(toObject(0, true)).to.be.deep.equal({ value: 0 })
        expect(toObject(123, true)).to.be.deep.equal({ value: 123 })
        expect(toObject(123.456, true)).to.be.deep.equal({ value: 123.456 })
    }

    @test('string value tests')
    testStringValues() {
        expect(toObject('')).to.be.deep.equal({ value: '' })
        expect(toObject('foo')).to.be.deep.equal({ value: 'foo' })

        // Strict mode
        expect(toObject('', true)).to.be.deep.equal({ value: '' })
        expect(toObject('foo', true)).to.be.deep.equal({ value: 'foo' })
    }

    @test('object value tests')
    testObjectValues() {
        const object1 = {
            foo: 'bar',
        }
        expect(toObject(object1)).to.be.equal(object1)
        const object2 = new Set([1, 1, 4])
        expect(toObject(object2)).to.be.equal(object2)

        // Strict mode

        expect(toObject(object1, true)).to.be.equal(object1)
        expect(toObject(object2, true)).to.be.equal(object2)
    }
}