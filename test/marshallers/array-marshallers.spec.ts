import * as chai from 'chai'
import { toArray } from '../../src/marshallers/array-marshaller'

// @ts-ignore
import { context, only, skip, suite, test, timeout } from 'mocha-typescript'

// Set up chai
const expect = chai.expect

@suite('Unit: toArray')
// @ts-ignore
class ArrayTests {

    @test('undefined tests')
    testUndefined() {
        expect(toArray(undefined)).to.be.undefined

        // Strict mode

        expect(toArray(undefined, undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toArray(null)).to.be.deep.equal([null])

        // Strict mode

        expect(toArray(null, undefined, true)).to.be.deep.equal([null])
    }

    @test('value tests')
    testValues() {
        expect(toArray(0)).to.be.deep.equal([0])
        expect(toArray(1)).to.be.deep.equal([1])
        expect(toArray('')).to.be.deep.equal([''])
        expect(toArray('foo')).to.be.deep.equal(['foo'])
    }

    @test('object value tests')
    testObjectValues() {
        const value1 = {}
        expect(toArray(value1)).to.be.deep.equal([value1])

        const value2 = {
            name: 'foo',
            other: {
                bar: 1,
            },
        }
        expect(toArray(value2)).to.be.deep.equal([value2])
    }

    @test('array value tests')
    testArrayValues() {
        const value1: any[] = []
        expect(toArray(value1)).to.be.equal(value1)

        const value2: any[] = [0]
        expect(toArray(value2)).to.be.equal(value2)

        const value3: any[] = [1]
        expect(toArray(value3)).to.be.equal(value3)

        const value4: any[] = ['']
        expect(toArray(value4)).to.be.equal(value4)

        const value5: any[] = ['foo']
        expect(toArray(value5)).to.be.equal(value5)

        const value6: any[] = [{}]
        expect(toArray(value6)).to.be.equal(value6)

        const value7: any[] = [{
            name: 'foo',
            other: {
                bar: 1,
            },
        }]
        expect(toArray(value7)).to.be.equal(value7)
    }
}