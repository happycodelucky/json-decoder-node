import * as chai from 'chai'
import { toNumber } from '../../src/marshallers/number-marshaller'

// @ts-ignore
import { context, only, skip, suite, test, timeout } from '@testdeck/mocha'

// Set up chai
const expect = chai.expect
chai.should()

@suite('Unit: toNumber')
// @ts-ignore
export class NumberTests {

    @test('undefined tests')
    testUndefined() {
        expect(toNumber(undefined)).to.be.undefined

        // Strict mode

        expect(toNumber(undefined, true)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        toNumber(null)!.should.be.NaN

        // Strict mode

        expect(() => toNumber(null, true)).to.throw(TypeError)
    }

    @test('NaN tests')
    testNaN() {
        toNumber(Number.NaN)!.should.be.NaN
        toNumber('NaN')!.should.be.NaN

        toNumber('')!.should.be.NaN
        toNumber({})!.should.be.NaN
        toNumber({ foo: 'bar' })!.should.be.NaN
        toNumber({ foo: 1 })!.should.be.NaN
    }

    @test('boolean value tests')
    testBooleanValues() {
        toNumber(true)!.should.be.equal(1)
        toNumber(false)!.should.be.equal(0)

        // Strict mode

        toNumber(true, true)!.should.be.equal(1)
        toNumber(false, true)!.should.be.equal(0)
    }

    @test('array value tests')
    testArrayValues() {
        expect(toNumber([])).to.be.undefined
        toNumber([1])!.should.be.equal(1)
        toNumber([1, 2])!.should.be.equal(1)

        // Strict mode

        expect(() => toNumber([1], true)).to.throw(TypeError)
        expect(() => toNumber([], true)).to.throw(TypeError)
    }

    @test('string base2 integer value tests')
    testStringBase2IntegerValues() {
        toNumber('0b0')!.should.be.equal(0)
        toNumber('+0b0')!.should.be.equal(0)
        toNumber('-0b0')!.should.be.equal(-0)
        toNumber('0B0')!.should.be.equal(0)
        toNumber('+0B0')!.should.be.equal(0)
        toNumber('-0B0')!.should.be.equal(-0)
        toNumber('0b1')!.should.be.equal(1)
        toNumber('+0b1')!.should.be.equal(1)
        toNumber('-0b1')!.should.be.equal(-1)
        toNumber('0B1')!.should.be.equal(1)
        toNumber('+0B1')!.should.be.equal(1)
        toNumber('-0B1')!.should.be.equal(-1)
        toNumber('0b01')!.should.be.equal(1)
        toNumber('+0b01')!.should.be.equal(1)
        toNumber('-0b01')!.should.be.equal(-1)
        toNumber('0B01')!.should.be.equal(1)
        toNumber('+0B01')!.should.be.equal(1)
        toNumber('-0B01')!.should.be.equal(-1)
        toNumber('0b10')!.should.be.equal(2)
        toNumber('+0b10')!.should.be.equal(2)
        toNumber('-0b10')!.should.be.equal(-2)
        toNumber('0B10')!.should.be.equal(2)
        toNumber('+0B10')!.should.be.equal(2)
        toNumber('-0B10')!.should.be.equal(-2)
        toNumber('0b11111111')!.should.be.equal(255)
        toNumber('+0b11111111')!.should.be.equal(255)
        toNumber('-0b11111111')!.should.be.equal(-255)
        toNumber('0B11111111')!.should.be.equal(255)
        toNumber('+0B11111111')!.should.be.equal(255)
        toNumber('-0B11111111')!.should.be.equal(-255)

        toNumber('0b+0')!.should.be.NaN
        toNumber('0b-0')!.should.be.NaN
        toNumber('0b2')!.should.be.NaN
        toNumber('0b02')!.should.be.NaN
        toNumber('0b012')!.should.be.NaN
        toNumber('0b3')!.should.be.NaN
        toNumber('0b4')!.should.be.NaN
        toNumber('0b5')!.should.be.NaN
        toNumber('0b6')!.should.be.NaN
        toNumber('0b7')!.should.be.NaN
        toNumber('0b8')!.should.be.NaN
        toNumber('0b9')!.should.be.NaN
        toNumber('1b0')!.should.be.NaN
        toNumber('1b0')!.should.be.NaN

        toNumber('b0')!.should.be.NaN
        toNumber('+b0')!.should.be.NaN
        toNumber('-b0')!.should.be.NaN
        toNumber('B0')!.should.be.NaN
        toNumber('+B0')!.should.be.NaN
        toNumber('-B0')!.should.be.NaN
        toNumber('0b0a')!.should.be.NaN
        toNumber('+0b0a')!.should.be.NaN
        toNumber('-0b0a')!.should.be.NaN
        toNumber('0b0a')!.should.be.NaN
        toNumber('+0b0a')!.should.be.NaN
        toNumber('-0b0a')!.should.be.NaN
        toNumber('0b11111111a')!.should.be.NaN
        toNumber('+0b11111111a')!.should.be.NaN
        toNumber('-0b11111111a')!.should.be.NaN
        toNumber('0B11111111A')!.should.be.NaN
        toNumber('+0B11111111A')!.should.be.NaN
        toNumber('-0B11111111A')!.should.be.NaN
    }

    @test('string base10 integer value tests')
    testStringBase10IntegerValues() {
        toNumber('0')!.should.be.equal(0)
        toNumber('+0')!.should.be.equal(0)
        toNumber('-0')!.should.be.equal(0)
        toNumber('0000')!.should.be.equal(0)
        toNumber('+0000')!.should.be.equal(0)
        toNumber('-0000')!.should.be.equal(0)
        toNumber('1')!.should.be.equal(1)
        toNumber('+1')!.should.be.equal(1)
        toNumber('-1')!.should.be.equal(-1)
        toNumber('0001234')!.should.be.equal(1234)
        toNumber('+0001234')!.should.be.equal(1234)
        toNumber('-0001234')!.should.be.equal(-1234)
        toNumber('123')!.should.be.equal(123)
        toNumber('+123')!.should.be.equal(123)
        toNumber('-123')!.should.be.equal(-123)
        toNumber('1,234,567,890')!.should.be.equal(1234567890)
        toNumber('+1,234,567,890')!.should.be.equal(1234567890)
        toNumber('-1,234,567,890')!.should.be.equal(-1234567890)
        toNumber('000,000,000')!.should.be.equal(0)
        toNumber('+000,000,000')!.should.be.equal(0)
        toNumber('-000,000,000')!.should.be.equal(0)
        toNumber('123456789')!.should.be.equal(123456789)
        toNumber('+123456789')!.should.be.equal(123456789)
        toNumber('-123456789')!.should.be.equal(-123456789)
        toNumber('123456789,123456789')!.should.be.equal(123456789123456789)
        toNumber('+123456789,123456789')!.should.be.equal(123456789123456789)
        toNumber('-123456789,123456789')!.should.be.equal(-123456789123456789)
        toNumber('000,123456789,123456789')!.should.be.equal(123456789123456789)
        toNumber('+000,123456789,123456789')!.should.be.equal(123456789123456789)
        toNumber('-000,123456789,123456789')!.should.be.equal(-123456789123456789)

        toNumber('a')!.should.be.NaN
        toNumber('b')!.should.be.NaN
        toNumber('x')!.should.be.NaN
        toNumber('z')!.should.be.NaN

        toNumber('a0')!.should.be.NaN
        toNumber('b0')!.should.be.NaN
        toNumber('x0')!.should.be.NaN
        toNumber('z0')!.should.be.NaN
        toNumber('0a')!.should.be.NaN
        toNumber('0b')!.should.be.NaN
        toNumber('0z')!.should.be.NaN
        toNumber('0x')!.should.be.NaN

        toNumber('a1234')!.should.be.NaN
        toNumber('b1234')!.should.be.NaN
        toNumber('x1234')!.should.be.NaN
        toNumber('z1234')!.should.be.NaN
        toNumber('1234a')!.should.be.NaN
        toNumber('1234b')!.should.be.NaN
        toNumber('1234x')!.should.be.NaN
        toNumber('1234z')!.should.be.NaN

        toNumber('!1234')!.should.be.NaN
        toNumber('1234!')!.should.be.NaN
        toNumber('1234+1234')!.should.be.NaN
        toNumber('1234-1234')!.should.be.NaN
        toNumber('1,+234')!.should.be.NaN
        toNumber('1,-234')!.should.be.NaN
    }

    @test('string base16 integer value tests')
    testStringBase16IntegerValues() {
        toNumber('NaN')!.should.be.NaN
        toNumber('')!.should.be.NaN

        toNumber('0x0')!.should.be.equal(0x0)
        toNumber('0X0')!.should.be.equal(0x0)
        toNumber('0x00000000')!.should.be.equal(0x0)
        toNumber('0X00000000')!.should.be.equal(0x0)
        toNumber('0x1234567890')!.should.be.equal(0x1234567890)
        toNumber('0X1234567890')!.should.be.equal(0x1234567890)

        toNumber('0xabcdef')!.should.be.equal(0xABCDEF)
        toNumber('0xABCDEF')!.should.be.equal(0xABCDEF)
        toNumber('0xfedcba')!.should.be.equal(0xFEDCBA)
        toNumber('0xFEDCBA')!.should.be.equal(0xFEDCBA)
        toNumber('0xabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)

        toNumber('0XABCDEF')!.should.be.equal(0xABCDEF)
        toNumber('0Xabcdef')!.should.be.equal(0xABCDEF)
        toNumber('0XFEDCBA')!.should.be.equal(0xFEDCBA)
        toNumber('0Xfedcba')!.should.be.equal(0xFEDCBA)
        toNumber('0XabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)

        toNumber('0xabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('+0xabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('-0xabcdefFEDCBA')!.should.be.equal(-0xABCDEFFEDCBA)
        toNumber('0XabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('+0XabcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('-0XabcdefFEDCBA')!.should.be.equal(-0xABCDEFFEDCBA)

        toNumber('0x000abcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('+0x000abcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('-0x000abcdefFEDCBA')!.should.be.equal(-0xABCDEFFEDCBA)
        toNumber('0X000abcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('+0X000abcdefFEDCBA')!.should.be.equal(0xABCDEFFEDCBA)
        toNumber('-0X000abcdefFEDCBA')!.should.be.equal(-0xABCDEFFEDCBA)

        toNumber('0x1234567890ABCDEF')!.should.be.equal(0x1234567890ABCDEF)
        toNumber('0X1234567890ABCDEF')!.should.be.equal(0x1234567890ABCDEF)
        toNumber('0x1234567890abcdef')!.should.be.equal(0x1234567890ABCDEF)
        toNumber('0X1234567890abcdef')!.should.be.equal(0x1234567890ABCDEF)

        toNumber('0x+1F')!.should.be.NaN
        toNumber('0x-1F')!.should.be.NaN
        toNumber('0X+1F')!.should.be.NaN
        toNumber('0X-1F')!.should.be.NaN

        toNumber('x1F')!.should.be.NaN
        toNumber('X1F')!.should.be.NaN
        toNumber('0x1fg')!.should.be.NaN
        toNumber('0x1FG')!.should.be.NaN
        toNumber('0X1fg')!.should.be.NaN
        toNumber('0X1FG')!.should.be.NaN

        toNumber('f')!.should.be.NaN
        toNumber('f')!.should.be.NaN
        toNumber('-f')!.should.be.NaN
        toNumber('F')!.should.be.NaN
        toNumber('+F')!.should.be.NaN
        toNumber('-F')!.should.be.NaN
        toNumber('1F')!.should.be.NaN
        toNumber('+1F')!.should.be.NaN
        toNumber('-1F')!.should.be.NaN
        toNumber('f1')!.should.be.NaN
        toNumber('+f1')!.should.be.NaN
        toNumber('-f1')!.should.be.NaN
        toNumber('F1')!.should.be.NaN
        toNumber('+F1')!.should.be.NaN
        toNumber('-F1')!.should.be.NaN
        toNumber('1f1')!.should.be.NaN
        toNumber('+1f1')!.should.be.NaN
        toNumber('-1f1')!.should.be.NaN
        toNumber('1F1')!.should.be.NaN
        toNumber('+1F1')!.should.be.NaN
        toNumber('-1F1')!.should.be.NaN
    }

    @test('string base10 float value tests')
    testBase10FloatValues() {
        toNumber('1,234,567,890.')!.should.be.equal(1234567890)
        toNumber('0.')!.should.be.equal(0)
        toNumber('.0')!.should.be.equal(0)
        toNumber('0.0')!.should.be.equal(0)
        toNumber('1.2')!.should.be.equal(1.2)
        toNumber('+1.2')!.should.be.equal(1.2)
        toNumber('-1.2')!.should.be.equal(-1.2)
        toNumber('1234567890.1234567890')!.should.be.equal(1234567890.123456789)
        toNumber('+1234567890.1234567890')!.should.be.equal(+1234567890.123456789)
        toNumber('-1234567890.1234567890')!.should.be.equal(-1234567890.123456789)
        toNumber('1.2.3')!.should.be.NaN
        toNumber('+1.2.3')!.should.be.NaN
        toNumber('-1.2.3')!.should.be.NaN
        toNumber('.2')!.should.be.equal(0.2)
        toNumber('+.2')!.should.be.equal(0.2)
        toNumber('-.2')!.should.be.equal(-0.2)
        toNumber('.2.3')!.should.be.NaN
        toNumber('+.2.3')!.should.be.NaN
        toNumber('-.2.3')!.should.be.NaN
        toNumber('0.2')!.should.be.equal(0.2)
        toNumber('+0.2')!.should.be.equal(0.2)
        toNumber('-0.2')!.should.be.equal(-0.2)
        toNumber('0.2.3')!.should.be.NaN
        toNumber('+0.2.3')!.should.be.NaN
        toNumber('-0.2.3')!.should.be.NaN
        toNumber('1.')!.should.be.equal(1)
        toNumber('+1.')!.should.be.equal(1)
        toNumber('-1.')!.should.be.equal(-1)
        toNumber('1.2.')!.should.be.NaN
        toNumber('+1.2.')!.should.be.NaN
        toNumber('-1.2.')!.should.be.NaN
        toNumber('.1234567890')!.should.be.equal(0.123456789)
        toNumber('+.1234567890')!.should.be.equal(0.123456789)
        toNumber('-.1234567890')!.should.be.equal(-0.123456789)
        toNumber('0.1234567890')!.should.be.equal(0.123456789)
        toNumber('0.1234567890')!.should.be.equal(0.123456789)
        toNumber('-0.1234567890')!.should.be.equal(-0.123456789)
        toNumber('1.E0')!.should.be.equal(1)
        toNumber('1.E+0')!.should.be.equal(1)
        toNumber('1.E-0')!.should.be.equal(1)
        toNumber('1.E1')!.should.be.equal(1E1)
        toNumber('1.E+1')!.should.be.equal(1E1)
        toNumber('1.E-1')!.should.be.equal(1E-1)
        toNumber('.E0')!.should.be.NaN
        toNumber('.E+0')!.should.be.NaN
        toNumber('.E-0')!.should.be.NaN
        toNumber('.E1')!.should.be.NaN
        toNumber('.E+1')!.should.be.NaN
        toNumber('.E-1')!.should.be.NaN
        toNumber('1.1234567890E0')!.should.be.equal(1.123456789)
        toNumber('+1.1234567890E0')!.should.be.equal(1.123456789)
        toNumber('-1.1234567890E0')!.should.be.equal(-1.123456789)
        toNumber('1.1234567890E1')!.should.be.equal(1.123456789E1)
        toNumber('+1.1234567890E1')!.should.be.equal(1.123456789E1)
        toNumber('-1.1234567890E1')!.should.be.equal(-1.123456789E1)
        toNumber('1234567890.1234567890E1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('1234567890.1234567890E1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('-1234567890.1234567890E1234567890')!.should.be.equal(-1234567890.123456789E1234567890)
        toNumber('1.1234567890E0.1')!.should.be.NaN
        toNumber('+1.1234567890E0.1')!.should.be.NaN
        toNumber('-1.1234567890E0.1')!.should.be.NaN
        toNumber('1.1234567890E1.1')!.should.be.NaN
        toNumber('+1.1234567890E1.1')!.should.be.NaN
        toNumber('-1.1234567890E1.1')!.should.be.NaN
        toNumber('1.1234567890E+0')!.should.be.equal(1.123456789)
        toNumber('+1.1234567890E+0')!.should.be.equal(1.123456789)
        toNumber('-1.1234567890E+0')!.should.be.equal(-1.123456789)
        toNumber('1.1234567890E+1')!.should.be.equal(1.123456789E1)
        toNumber('+1.1234567890E+1')!.should.be.equal(1.123456789E1)
        toNumber('-1.1234567890E+1')!.should.be.equal(-1.123456789E1)
        toNumber('1234567890.1234567890E+1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('+1234567890.1234567890E+1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('-1234567890.1234567890E+1234567890')!.should.be.equal(-11234567890.123456789E1234567890)
        toNumber('1.1234567890E+1.1')!.should.be.NaN
        toNumber('+1.1234567890E+1.1')!.should.be.NaN
        toNumber('-1.1234567890E+1.1')!.should.be.NaN
        toNumber('1.1234567890E-0')!.should.be.equal(1.123456789)
        toNumber('+1.1234567890E-0')!.should.be.equal(1.123456789)
        toNumber('-1.1234567890E-0')!.should.be.equal(-1.123456789)
        toNumber('1.1234567890E-1')!.should.be.equal(1.123456789E-1)
        toNumber('+1.1234567890E-1')!.should.be.equal(1.123456789E-1)
        toNumber('-1.1234567890E-1')!.should.be.equal(-1.123456789E-1)
        toNumber('1234567890.1234567890E-1234567890')!.should.be.equal(1234567890.123456789E-1234567890)
        toNumber('+1234567890.1234567890E-1234567890')!.should.be.equal(1234567890.123456789E-1234567890)
        toNumber('-1234567890.1234567890E-1234567890')!.should.be.equal(-11234567890.123456789E-1234567890)
        toNumber('1234567890.1234567890e1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('+1234567890.1234567890e1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('-1234567890.1234567890e1234567890')!.should.be.equal(-11234567890.123456789E1234567890)
        toNumber('1234567890.1234567890e+1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('+1234567890.1234567890e+1234567890')!.should.be.equal(1234567890.123456789E1234567890)
        toNumber('-1234567890.1234567890e+1234567890')!.should.be.equal(-11234567890.123456789E1234567890)
        toNumber('1234567890.1234567890e-1234567890')!.should.be.equal(1234567890.123456789E-1234567890)
        toNumber('+1234567890.1234567890e-1234567890')!.should.be.equal(1234567890.123456789E-1234567890)
        toNumber('-1234567890.1234567890e-1234567890')!.should.be.equal(-11234567890.123456789E-1234567890)

        toNumber('1,234,567,890.')!.should.be.equal(1234567890)
        toNumber('+1,234,567,890.')!.should.be.equal(1234567890)
        toNumber('-1,234,567,890.')!.should.be.equal(-1234567890)
        toNumber('1,234,567,890.1')!.should.be.equal(1234567890.1)
        toNumber('+1,234,567,890.1')!.should.be.equal(1234567890.1)
        toNumber('-1,234,567,890.1')!.should.be.equal(-1234567890.1)
        toNumber('1,234,567,890.1234567890E1')!.should.be.equal(1234567890.123456789E1)
        toNumber('+1,234,567,890.1234567890E+1')!.should.be.equal(1234567890.123456789E1)
        toNumber('-1,234,567,890.1234567890E-1')!.should.be.equal(-1234567890.123456789E-1)
        toNumber('1,234,567,890.1234567890e1')!.should.be.equal(1234567890.123456789E1)
        toNumber('+1,234,567,890.1234567890e+1')!.should.be.equal(1234567890.123456789E1)
        toNumber('-1,234,567,890.1234567890e-1')!.should.be.equal(-1234567890.123456789E-1)

        toNumber('1.1,234')!.should.be.NaN
        toNumber('+1.1,234')!.should.be.NaN
        toNumber('-1.1,234')!.should.be.NaN
        toNumber('1.1234E1,234')!.should.be.NaN
        toNumber('1.1234e1,234')!.should.be.NaN
        toNumber('+1.12345E+1,234')!.should.be.NaN
        toNumber('+1.12345e+1,234')!.should.be.NaN
        toNumber('-1.1234E-1,234')!.should.be.NaN
        toNumber('-1.1234e-1,234')!.should.be.NaN

        toNumber('a.0')!.should.be.NaN
        toNumber('a.')!.should.be.NaN
        toNumber('0.b')!.should.be.NaN
        toNumber('.b')!.should.be.NaN
        toNumber('1.2b')!.should.be.NaN
        toNumber('1a.2')!.should.be.NaN
        toNumber('a1.2')!.should.be.NaN
        toNumber('a1.2b')!.should.be.NaN
        toNumber('1.b.3')!.should.be.NaN
        toNumber('1.2.c')!.should.be.NaN

        toNumber('1.e')!.should.be.NaN
        toNumber('1.E')!.should.be.NaN

        toNumber('1.+1E+1')!.should.be.NaN
        toNumber('1.+1e+1')!.should.be.NaN
        toNumber('1.-1E-1')!.should.be.NaN
        toNumber('1.-1e-1')!.should.be.NaN

        toNumber('1.1+E1')!.should.be.NaN
        toNumber('1.1+e1')!.should.be.NaN
        toNumber('1.1-E1')!.should.be.NaN
        toNumber('1.1-e1')!.should.be.NaN

        toNumber('1.1E1.1')!.should.be.NaN
        toNumber('1.1e1.1')!.should.be.NaN
        toNumber('1.1E+1.1')!.should.be.NaN
        toNumber('1.1e+1.1')!.should.be.NaN
        toNumber('1.1E-1.1')!.should.be.NaN
        toNumber('1.1e-1.1')!.should.be.NaN
    }
}