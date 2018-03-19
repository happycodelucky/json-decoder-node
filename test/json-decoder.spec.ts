/**
 * @module json-decoder
 */

import * as chai from 'chai'
import { context, skip, suite, test, timeout, only } from 'mocha-typescript'
import { JsonDecoder } from '../src'

// Set up chai
const expect = chai.expect
chai.should()

@suite('Unit: JsonDecoder')
class ArrayTests {

    @test('undefined tests')
    testUndefined() {
        expect(toArray(undefined)).to.be.undefined

        // Strict mode

        expect(toArray(undefined, undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toArray(null)).to.be.undefined

        // Strict mode

        expect(() => toArray(null, undefined, true)).to.throw(TypeError)
    }

    @test('value tests')
    testValues() {
        toArray(0)!.should.be.deep.equal([0])
        toArray(1)!.should.be.deep.equal([1])
        toArray('')!.should.be.deep.equal([''])
        toArray('foo')!.should.be.deep.equal(['foo'])
    }

    @test('object value tests')
    testObjectValues() {
        const value1 = {}
        toArray(value1)!.should.be.deep.equal([value1])

        const value2 = {
            name: 'foo',
            other: {
                bar: 1
            }
        }
        toArray(value2)!.should.be.deep.equal([value2])
    }

    @test('array value tests')
    testArrayValues() {
        const value1 = []
        toArray(value1)!.should.be.equal(value1)

        const value2 = [0]
        toArray(value2)!.should.be.equal(value2)

        const value3 = [1]
        toArray(value3)!.should.be.equal(value3)

        const value4 = ['']
        toArray(value4)!.should.be.equal(value4)

        const value5 = ['foo']
        toArray(value5)!.should.be.equal(value5)

        const value6 = [{}]
        toArray(value6)!.should.be.equal(value6)

        const value7 = [{
            name: 'foo',
            other: {
                bar: 1
            }
        }]
        toArray(value7)!.should.be.equal(value7)
    }
}