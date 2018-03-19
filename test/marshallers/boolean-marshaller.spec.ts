/**
 * @module json-decoder
 */

import * as chai from 'chai'
import { toBoolean } from '../../src/marshallers/boolean-marshaller'

// @ts-ignore
import { context, skip, suite, test, timeout, only } from 'mocha-typescript'

// Set up chai
const expect = chai.expect
chai.should()

@suite('Unit: toBoolean')
// @ts-ignore
class BooleanTests {

    @test('undefined tests')
    testUndefined() {
        expect(toBoolean(undefined)).to.be.undefined

        // Strict mode

        expect(toBoolean(undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toBoolean(null)).to.be.false

        // Strict mode

        expect(toBoolean(null, true)).to.be.false
    }

    @test('boolean value tests')
    testBooleanValues() {
        expect(toBoolean(true)).to.be.true
        expect(toBoolean(false)).to.be.false

        // Strict mode

        expect(toBoolean(true, true)).to.be.true
        expect(toBoolean(false, true)).to.be.false
    }

    @test('number value tests')
    testNumberValues() {
        expect(toBoolean(1)).to.be.true
        expect(toBoolean(0)).to.be.false

        expect(toBoolean(1234)).to.be.true
        expect(toBoolean(0.1234)).to.be.true
        expect(toBoolean(0.0)).to.be.false
        expect(toBoolean(1.0)).to.be.true

        // Strict mode

        expect(toBoolean(1, true)).to.be.true
        expect(toBoolean(0, true)).to.be.false
        expect(toBoolean(0.0, true)).to.be.false
        expect(toBoolean(1.0, true)).to.be.true

        expect(() => toBoolean(-1, true)).to.throw(TypeError)
        expect(() => toBoolean(2, true)).to.throw(TypeError)
        expect(() => toBoolean(1234, true)).to.throw(TypeError)
        expect(() => toBoolean(0.1234, true)).to.throw(TypeError)
    }

    @test('string value tests')
    testStringValues() {
        expect(toBoolean('true')).to.be.true
        expect(toBoolean('TRUE')).to.be.true
        expect(toBoolean('True')).to.be.true
        expect(toBoolean('     TrUe      ')).to.be.true

        expect(toBoolean('yes')).to.be.true
        expect(toBoolean('YES')).to.be.true
        expect(toBoolean('Yes')).to.be.true
        expect(toBoolean('     yEs      ')).to.be.true

        expect(toBoolean('1')).to.be.true
        expect(toBoolean('     1      ')).to.be.true

        expect(toBoolean('false')).to.be.false
        expect(toBoolean('FALSE')).to.be.false
        expect(toBoolean('False')).to.be.false
        expect(toBoolean('     fAlSe      ')).to.be.false

        expect(toBoolean('no')).to.be.false
        expect(toBoolean('NO')).to.be.false
        expect(toBoolean('No')).to.be.false
        expect(toBoolean('     nO      ')).to.be.false

        expect(toBoolean('0')).to.be.false
        expect(toBoolean('     0      ')).to.be.false

        expect(toBoolean('2')).to.be.undefined
        expect(toBoolean('')).to.be.undefined
        expect(toBoolean(' ')).to.be.undefined
        expect(toBoolean('  ')).to.be.undefined
        expect(toBoolean('abcdef')).to.be.undefined

        expect(toBoolean('truea')).to.be.undefined
        expect(toBoolean('atrue')).to.be.undefined
        expect(toBoolean('yesa')).to.be.undefined
        expect(toBoolean('ayes')).to.be.undefined
        expect(toBoolean('1a')).to.be.undefined
        expect(toBoolean('a1')).to.be.undefined

        expect(toBoolean('falsea')).to.be.undefined
        expect(toBoolean('afalse')).to.be.undefined
        expect(toBoolean('noa')).to.be.undefined
        expect(toBoolean('ano')).to.be.undefined
        expect(toBoolean('0a')).to.be.undefined
        expect(toBoolean('a0')).to.be.undefined

        // Strict mode

        expect(toBoolean('true', true)).to.be.true
        expect(toBoolean('TRUE', true)).to.be.true
        expect(toBoolean('True', true)).to.be.true
        expect(toBoolean('     TrUe      ', true)).to.be.true

        expect(toBoolean('yes', true)).to.be.true
        expect(toBoolean('YES', true)).to.be.true
        expect(toBoolean('Yes', true)).to.be.true
        expect(toBoolean('     yEs      ', true)).to.be.true

        expect(toBoolean('1', true)).to.be.true
        expect(toBoolean('     1      ', true)).to.be.true

        expect(toBoolean('false', true)).to.be.false
        expect(toBoolean('FALSE', true)).to.be.false
        expect(toBoolean('False', true)).to.be.false
        expect(toBoolean('     fAlSe      ', true)).to.be.false

        expect(toBoolean('no', true)).to.be.false
        expect(toBoolean('NO', true)).to.be.false
        expect(toBoolean('No', true)).to.be.false
        expect(toBoolean('     nO      ', true)).to.be.false

        expect(toBoolean('0', true)).to.be.false
        expect(toBoolean('     0      ', true)).to.be.false

        expect(() => toBoolean('2', true)).to.throw(TypeError)
        expect(() => toBoolean('', true)).to.throw(TypeError)
        expect(() => toBoolean('abcdef', true)).to.throw(TypeError)
    }

    @test('array value tests')
    testArrayValues() {
        toBoolean([true])!.should.be.true
        toBoolean(['true'])!.should.be.true
        toBoolean(['yes'])!.should.be.true
        toBoolean([1])!.should.be.true
        toBoolean([false])!.should.be.false
        toBoolean(['false'])!.should.be.false
        toBoolean(['no'])!.should.be.false
        toBoolean([0])!.should.be.false

        toBoolean([[[true]]])!.should.be.true
        toBoolean([[['true']]])!.should.be.true
        toBoolean([[['yes']]])!.should.be.true
        toBoolean([[[1]]])!.should.be.true
        toBoolean([[[false]]])!.should.be.false
        toBoolean([[['false']]])!.should.be.false
        toBoolean([[['no']]])!.should.be.false
        toBoolean([[[0]]])!.should.be.false

        expect(() => toBoolean([true], true)).to.throw(TypeError)
        expect(() => toBoolean([false], true)).to.throw(TypeError)
        expect(() => toBoolean([[[true]]], true)).to.throw(TypeError)
        expect(() => toBoolean([[[false]]], true)).to.throw(TypeError)
    }
}