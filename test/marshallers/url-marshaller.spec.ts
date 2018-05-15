import * as chai from 'chai'
import { URL } from 'url'
import { toURL } from '../../src/marshallers/url-marshaller'

// @ts-ignore
import { context, only, skip, suite, test, timeout } from 'mocha-typescript'

// Set up chai
const expect = chai.expect

@suite('Unit: toURL')
// @ts-ignore
export class URLTests {

    @test('undefined tests')
    testUndefined() {
        expect(toURL(undefined)).to.be.undefined

        // Strict mode

        expect(toURL(undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toURL(null)).to.be.undefined

        // Strict mode

        expect(() => toURL(null, true)).to.throw(TypeError)
    }

    @test('array value tests')
    testArrayValues() {
        const object1 = {
            foo: 'bar',
        }
        expect(toURL([1, '2', object1])).to.be.undefined
        expect(toURL([])).to.be.undefined

        // Strict mode

        expect(() => toURL([1, '2', object1], true)).to.throw(TypeError)
        expect(() => toURL([], true)).to.throw(TypeError)
    }

    @test('boolean value tests')
    testBooleanValues() {
        expect(toURL(true)).to.be.undefined
        expect(toURL(false)).to.be.undefined

        // Strict mode

        expect(() => toURL(true, true)).to.throw(TypeError)
        expect(() => toURL(false, true)).to.throw(TypeError)
    }

    @test('number value tests')
    testNumberValues() {
        expect(toURL(-123)).to.be.undefined
        expect(toURL(0)).to.be.undefined
        expect(toURL(123)).to.be.undefined
        expect(toURL(123.456)).to.be.undefined

        // Strict mode

        expect(() => toURL(-123, true)).to.throw(TypeError)
        expect(() => toURL(0, true)).to.throw(TypeError)
        expect(() => toURL(123, true)).to.throw(TypeError)
        expect(() => toURL(123.456, true)).to.throw(TypeError)
    }

    @test('string value tests')
    testStringValues() {
        expect(toURL('')).to.be.undefined
        expect(toURL('foo')).to.be.undefined
        expect(toURL('http://www.test.com')).to.be.deep.equal(new URL('http://www.test.com'))
        expect(toURL('https://test.com?q=value&q2=1+2')).to.be.deep.equal(new URL('https://test.com?q=value&q2=1+2'))

        // Strict mode

        expect(() => toURL('', true)).to.throw(TypeError)
        expect(() => toURL('foo', true)).to.throw(TypeError)
        expect(toURL('http://www.test.com', true)).to.be.deep.equal(new URL('http://www.test.com'))
        expect(toURL('https://test.com?q=value&q2=1+2', true)).to.be.deep.equal(new URL('https://test.com?q=value&q2=1+2'))
    }

    @test('object value tests')
    testObjectValues() {
        const object1 = {
            foo: 'bar',
        }
        expect(toURL(object1)).to.be.undefined
        const object2 = new Set([1, 1, 4])
        expect(toURL(object2)).to.be.undefined

        // Strict mode

        expect(() => toURL(object1, true)).to.throw(TypeError)
        expect(() => toURL(object2, true)).to.throw(TypeError)
    }
}