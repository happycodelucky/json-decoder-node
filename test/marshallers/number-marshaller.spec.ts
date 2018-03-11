/**
 * @module json-decoder
 */

import * as chai from 'chai'
import { toNumber } from '../../src/marshallers/number-marshaller'

// @ts-ignore
import { context, skip, suite, test, timeout, only } from 'mocha-typescript'

// Set up chai
const expect = chai.expect

@suite('Unit: toNumber')
// @ts-ignore
class NumberTests {

    @test('undefined tests')
    testUndefined() {
        expect(toNumber(undefined)).to.be.undefined
    }

    @test('null tests')
    testNull() {
        expect(toNumber(null)).to.be.NaN
    }

    @test('NaN tests')
    testNaN() {
        expect(toNumber(Number.NaN)).to.be.NaN
        expect(toNumber('NaN')).to.be.NaN

        expect(toNumber('')).to.be.NaN
        expect(toNumber([])).to.be.NaN
        expect(toNumber([1])).to.be.NaN
        expect(toNumber({})).to.be.NaN
        expect(toNumber({ foo: 'bar' })).to.be.NaN
        expect(toNumber({ foo: 1 })).to.be.NaN
    }

    @test('boolean value tests')
    testBooleanValues() {
        expect(toNumber(true)).to.be.equal(1)
        expect(toNumber(false)).to.be.equal(0)
    }

    @test('string base2 integer value tests')
    testStringBase2IntegerValues() {
        expect(toNumber('0b0')).to.be.equal(0)
        expect(toNumber('+0b0')).to.be.equal(0)
        expect(toNumber('-0b0')).to.be.equal(-0)
        expect(toNumber('0B0')).to.be.equal(0)
        expect(toNumber('+0B0')).to.be.equal(0)
        expect(toNumber('-0B0')).to.be.equal(-0)
        expect(toNumber('0b1')).to.be.equal(1)
        expect(toNumber('+0b1')).to.be.equal(1)
        expect(toNumber('-0b1')).to.be.equal(-1)
        expect(toNumber('0B1')).to.be.equal(1)
        expect(toNumber('+0B1')).to.be.equal(1)
        expect(toNumber('-0B1')).to.be.equal(-1)
        expect(toNumber('0b01')).to.be.equal(1)
        expect(toNumber('+0b01')).to.be.equal(1)
        expect(toNumber('-0b01')).to.be.equal(-1)
        expect(toNumber('0B01')).to.be.equal(1)
        expect(toNumber('+0B01')).to.be.equal(1)
        expect(toNumber('-0B01')).to.be.equal(-1)
        expect(toNumber('0b10')).to.be.equal(2)
        expect(toNumber('+0b10')).to.be.equal(2)
        expect(toNumber('-0b10')).to.be.equal(-2)
        expect(toNumber('0B10')).to.be.equal(2)
        expect(toNumber('+0B10')).to.be.equal(2)
        expect(toNumber('-0B10')).to.be.equal(-2)
        expect(toNumber('0b11111111')).to.be.equal(255)
        expect(toNumber('+0b11111111')).to.be.equal(255)
        expect(toNumber('-0b11111111')).to.be.equal(-255)
        expect(toNumber('0B11111111')).to.be.equal(255)
        expect(toNumber('+0B11111111')).to.be.equal(255)
        expect(toNumber('-0B11111111')).to.be.equal(-255)

        expect(toNumber('0b+0')).to.be.NaN
        expect(toNumber('0b-0')).to.be.NaN
        expect(toNumber('0b2')).to.be.NaN
        expect(toNumber('0b02')).to.be.NaN
        expect(toNumber('0b012')).to.be.NaN
        expect(toNumber('0b3')).to.be.NaN
        expect(toNumber('0b4')).to.be.NaN
        expect(toNumber('0b5')).to.be.NaN
        expect(toNumber('0b6')).to.be.NaN
        expect(toNumber('0b7')).to.be.NaN
        expect(toNumber('0b8')).to.be.NaN
        expect(toNumber('0b9')).to.be.NaN
        expect(toNumber('1b0')).to.be.NaN
        expect(toNumber('1b0')).to.be.NaN

        expect(toNumber('b0')).to.be.NaN
        expect(toNumber('+b0')).to.be.NaN
        expect(toNumber('-b0')).to.be.NaN
        expect(toNumber('B0')).to.be.NaN
        expect(toNumber('+B0')).to.be.NaN
        expect(toNumber('-B0')).to.be.NaN
        expect(toNumber('0b0a')).to.be.NaN
        expect(toNumber('+0b0a')).to.be.NaN
        expect(toNumber('-0b0a')).to.be.NaN
        expect(toNumber('0b0a')).to.be.NaN
        expect(toNumber('+0b0a')).to.be.NaN
        expect(toNumber('-0b0a')).to.be.NaN
        expect(toNumber('0b11111111a')).to.be.NaN
        expect(toNumber('+0b11111111a')).to.be.NaN
        expect(toNumber('-0b11111111a')).to.be.NaN
        expect(toNumber('0B11111111A')).to.be.NaN
        expect(toNumber('+0B11111111A')).to.be.NaN
        expect(toNumber('-0B11111111A')).to.be.NaN
    }

    @test('string base10 integer value tests')
    testStringBase10IntegerValues() {
        expect(toNumber('0')).to.be.equal(0)
        expect(toNumber('+0')).to.be.equal(0)
        expect(toNumber('-0')).to.be.equal(0)
        expect(toNumber('0000')).to.be.equal(0)
        expect(toNumber('+0000')).to.be.equal(0)
        expect(toNumber('-0000')).to.be.equal(0)
        expect(toNumber('1')).to.be.equal(1)
        expect(toNumber('+1')).to.be.equal(1)
        expect(toNumber('-1')).to.be.equal(-1)
        expect(toNumber('0001234')).to.be.equal(1234)
        expect(toNumber('+0001234')).to.be.equal(1234)
        expect(toNumber('-0001234')).to.be.equal(-1234)
        expect(toNumber('123')).to.be.equal(123)
        expect(toNumber('+123')).to.be.equal(123)
        expect(toNumber('-123')).to.be.equal(-123)
        expect(toNumber('1,234,567,890')).to.be.equal(1234567890)
        expect(toNumber('+1,234,567,890')).to.be.equal(1234567890)
        expect(toNumber('-1,234,567,890')).to.be.equal(-1234567890)
        expect(toNumber('000,000,000')).to.be.equal(0)
        expect(toNumber('+000,000,000')).to.be.equal(0)
        expect(toNumber('-000,000,000')).to.be.equal(0)
        expect(toNumber('123456789')).to.be.equal(123456789)
        expect(toNumber('+123456789')).to.be.equal(123456789)
        expect(toNumber('-123456789')).to.be.equal(-123456789)
        expect(toNumber('123456789,123456789')).to.be.equal(123456789123456789)
        expect(toNumber('+123456789,123456789')).to.be.equal(123456789123456789)
        expect(toNumber('-123456789,123456789')).to.be.equal(-123456789123456789)
        expect(toNumber('000,123456789,123456789')).to.be.equal(123456789123456789)
        expect(toNumber('+000,123456789,123456789')).to.be.equal(123456789123456789)
        expect(toNumber('-000,123456789,123456789')).to.be.equal(-123456789123456789)

        expect(toNumber('a')).to.be.NaN
        expect(toNumber('b')).to.be.NaN
        expect(toNumber('x')).to.be.NaN
        expect(toNumber('z')).to.be.NaN

        expect(toNumber('a0')).to.be.NaN
        expect(toNumber('b0')).to.be.NaN
        expect(toNumber('x0')).to.be.NaN
        expect(toNumber('z0')).to.be.NaN
        expect(toNumber('0a')).to.be.NaN
        expect(toNumber('0b')).to.be.NaN
        expect(toNumber('0z')).to.be.NaN
        expect(toNumber('0x')).to.be.NaN

        expect(toNumber('a1234')).to.be.NaN
        expect(toNumber('b1234')).to.be.NaN
        expect(toNumber('x1234')).to.be.NaN
        expect(toNumber('z1234')).to.be.NaN
        expect(toNumber('1234a')).to.be.NaN
        expect(toNumber('1234b')).to.be.NaN
        expect(toNumber('1234x')).to.be.NaN
        expect(toNumber('1234z')).to.be.NaN
        
        expect(toNumber('!1234')).to.be.NaN
        expect(toNumber('1234!')).to.be.NaN
        expect(toNumber('1234+1234')).to.be.NaN
        expect(toNumber('1234-1234')).to.be.NaN
        expect(toNumber('1,+234')).to.be.NaN
        expect(toNumber('1,-234')).to.be.NaN
    }

    @test('string base16 integer value tests')
    testStringBase16IntegerValues() {
        expect(toNumber('NaN')).to.be.NaN
        expect(toNumber('')).to.be.NaN

        expect(toNumber('0x0')).to.be.equal(0x0)
        expect(toNumber('0X0')).to.be.equal(0x0)
        expect(toNumber('0x00000000')).to.be.equal(0x0)
        expect(toNumber('0X00000000')).to.be.equal(0x0)
        expect(toNumber('0x1234567890')).to.be.equal(0x1234567890)
        expect(toNumber('0X1234567890')).to.be.equal(0x1234567890)

        expect(toNumber('0xabcdef')).to.be.equal(0xABCDEF)
        expect(toNumber('0xABCDEF')).to.be.equal(0xABCDEF)
        expect(toNumber('0xfedcba')).to.be.equal(0xFEDCBA)
        expect(toNumber('0xFEDCBA')).to.be.equal(0xFEDCBA)
        expect(toNumber('0xabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        
        expect(toNumber('0XABCDEF')).to.be.equal(0xABCDEF)
        expect(toNumber('0Xabcdef')).to.be.equal(0xABCDEF)
        expect(toNumber('0XFEDCBA')).to.be.equal(0xFEDCBA)
        expect(toNumber('0Xfedcba')).to.be.equal(0xFEDCBA)
        expect(toNumber('0XabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)

        expect(toNumber('0xabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('+0xabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('-0xabcdefFEDCBA')).to.be.equal(-0xABCDEFFEDCBA)
        expect(toNumber('0XabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('+0XabcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('-0XabcdefFEDCBA')).to.be.equal(-0xABCDEFFEDCBA)
        
        expect(toNumber('0x000abcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('+0x000abcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('-0x000abcdefFEDCBA')).to.be.equal(-0xABCDEFFEDCBA)
        expect(toNumber('0X000abcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('+0X000abcdefFEDCBA')).to.be.equal(0xABCDEFFEDCBA)
        expect(toNumber('-0X000abcdefFEDCBA')).to.be.equal(-0xABCDEFFEDCBA)

        expect(toNumber('0x1234567890ABCDEF')).to.be.equal(0x1234567890ABCDEF)
        expect(toNumber('0X1234567890ABCDEF')).to.be.equal(0x1234567890ABCDEF)
        expect(toNumber('0x1234567890abcdef')).to.be.equal(0x1234567890ABCDEF)
        expect(toNumber('0X1234567890abcdef')).to.be.equal(0x1234567890ABCDEF)

        expect(toNumber('0x+1F')).to.be.NaN
        expect(toNumber('0x-1F')).to.be.NaN
        expect(toNumber('0X+1F')).to.be.NaN
        expect(toNumber('0X-1F')).to.be.NaN

        expect(toNumber('x1F')).to.be.NaN
        expect(toNumber('X1F')).to.be.NaN
        expect(toNumber('0x1fg')).to.be.NaN
        expect(toNumber('0x1FG')).to.be.NaN
        expect(toNumber('0X1fg')).to.be.NaN
        expect(toNumber('0X1FG')).to.be.NaN

        expect(toNumber('f')).to.be.NaN
        expect(toNumber('f')).to.be.NaN
        expect(toNumber('-f')).to.be.NaN
        expect(toNumber('F')).to.be.NaN
        expect(toNumber('+F')).to.be.NaN
        expect(toNumber('-F')).to.be.NaN
        expect(toNumber('1F')).to.be.NaN
        expect(toNumber('+1F')).to.be.NaN
        expect(toNumber('-1F')).to.be.NaN
        expect(toNumber('f1')).to.be.NaN
        expect(toNumber('+f1')).to.be.NaN
        expect(toNumber('-f1')).to.be.NaN
        expect(toNumber('F1')).to.be.NaN
        expect(toNumber('+F1')).to.be.NaN
        expect(toNumber('-F1')).to.be.NaN
        expect(toNumber('1f1')).to.be.NaN
        expect(toNumber('+1f1')).to.be.NaN
        expect(toNumber('-1f1')).to.be.NaN
        expect(toNumber('1F1')).to.be.NaN
        expect(toNumber('+1F1')).to.be.NaN
        expect(toNumber('-1F1')).to.be.NaN
    }

    @test('string base10 float value tests')
    testBase10FloatValues() {
        expect(toNumber('1,234,567,890.')).to.be.equal(1234567890.0)
        expect(toNumber('0.')).to.be.equal(0.0)
        expect(toNumber('.0')).to.be.equal(0.0)
        expect(toNumber('0.0')).to.be.equal(0.0)
        expect(toNumber('1.2')).to.be.equal(1.2)
        expect(toNumber('+1.2')).to.be.equal(1.2)
        expect(toNumber('-1.2')).to.be.equal(-1.2)
        expect(toNumber('1234567890.1234567890')).to.be.equal(1234567890.1234567890)
        expect(toNumber('+1234567890.1234567890')).to.be.equal(+1234567890.1234567890)
        expect(toNumber('-1234567890.1234567890')).to.be.equal(-1234567890.1234567890)
        expect(toNumber('1.2.3')).to.be.NaN
        expect(toNumber('+1.2.3')).to.be.NaN
        expect(toNumber('-1.2.3')).to.be.NaN
        expect(toNumber('.2')).to.be.equal(0.2)
        expect(toNumber('+.2')).to.be.equal(0.2)
        expect(toNumber('-.2')).to.be.equal(-0.2)
        expect(toNumber('.2.3')).to.be.NaN
        expect(toNumber('+.2.3')).to.be.NaN
        expect(toNumber('-.2.3')).to.be.NaN
        expect(toNumber('0.2')).to.be.equal(0.2)
        expect(toNumber('+0.2')).to.be.equal(0.2)
        expect(toNumber('-0.2')).to.be.equal(-0.2)
        expect(toNumber('0.2.3')).to.be.NaN
        expect(toNumber('+0.2.3')).to.be.NaN
        expect(toNumber('-0.2.3')).to.be.NaN
        expect(toNumber('1.')).to.be.equal(1.0)
        expect(toNumber('+1.')).to.be.equal(1.0)
        expect(toNumber('-1.')).to.be.equal(-1.0)
        expect(toNumber('1.2.')).to.be.NaN
        expect(toNumber('+1.2.')).to.be.NaN
        expect(toNumber('-1.2.')).to.be.NaN        
        expect(toNumber('.1234567890')).to.be.equal(0.1234567890)
        expect(toNumber('+.1234567890')).to.be.equal(0.1234567890)
        expect(toNumber('-.1234567890')).to.be.equal(-0.1234567890)
        expect(toNumber('0.1234567890')).to.be.equal(0.1234567890)
        expect(toNumber('0.1234567890')).to.be.equal(0.1234567890)
        expect(toNumber('-0.1234567890')).to.be.equal(-0.1234567890)
        expect(toNumber('1.E0')).to.be.equal(1.0)
        expect(toNumber('1.E+0')).to.be.equal(1.0E0)
        expect(toNumber('1.E-0')).to.be.equal(1.0E0)
        expect(toNumber('1.E1')).to.be.equal(1.0E1)
        expect(toNumber('1.E+1')).to.be.equal(1.0E1)
        expect(toNumber('1.E-1')).to.be.equal(1.0E-1)
        expect(toNumber('.E0')).to.be.NaN
        expect(toNumber('.E+0')).to.be.NaN
        expect(toNumber('.E-0')).to.be.NaN
        expect(toNumber('.E1')).to.be.NaN
        expect(toNumber('.E+1')).to.be.NaN
        expect(toNumber('.E-1')).to.be.NaN              
        expect(toNumber('1.1234567890E0')).to.be.equal(1.1234567890)
        expect(toNumber('+1.1234567890E0')).to.be.equal(1.1234567890)
        expect(toNumber('-1.1234567890E0')).to.be.equal(-1.1234567890)
        expect(toNumber('1.1234567890E1')).to.be.equal(1.1234567890E1)
        expect(toNumber('+1.1234567890E1')).to.be.equal(1.1234567890E1)
        expect(toNumber('-1.1234567890E1')).to.be.equal(-1.1234567890E1)
        expect(toNumber('1234567890.1234567890E1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('1234567890.1234567890E1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('-1234567890.1234567890E1234567890')).to.be.equal(-1234567890.1234567890E1234567890)
        expect(toNumber('1.1234567890E0.1')).to.be.NaN
        expect(toNumber('+1.1234567890E0.1')).to.be.NaN
        expect(toNumber('-1.1234567890E0.1')).to.be.NaN
        expect(toNumber('1.1234567890E1.1')).to.be.NaN
        expect(toNumber('+1.1234567890E1.1')).to.be.NaN
        expect(toNumber('-1.1234567890E1.1')).to.be.NaN
        expect(toNumber('1.1234567890E+0')).to.be.equal(1.1234567890)
        expect(toNumber('+1.1234567890E+0')).to.be.equal(1.1234567890)
        expect(toNumber('-1.1234567890E+0')).to.be.equal(-1.1234567890)
        expect(toNumber('1.1234567890E+1')).to.be.equal(1.1234567890E1)
        expect(toNumber('+1.1234567890E+1')).to.be.equal(1.1234567890E1)
        expect(toNumber('-1.1234567890E+1')).to.be.equal(-1.1234567890E1)
        expect(toNumber('1234567890.1234567890E+1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('+1234567890.1234567890E+1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('-1234567890.1234567890E+1234567890')).to.be.equal(-11234567890.1234567890E1234567890)
        expect(toNumber('1.1234567890E+1.1')).to.be.NaN
        expect(toNumber('+1.1234567890E+1.1')).to.be.NaN
        expect(toNumber('-1.1234567890E+1.1')).to.be.NaN
        expect(toNumber('1.1234567890E-0')).to.be.equal(1.1234567890)
        expect(toNumber('+1.1234567890E-0')).to.be.equal(1.1234567890)
        expect(toNumber('-1.1234567890E-0')).to.be.equal(-1.1234567890)
        expect(toNumber('1.1234567890E-1')).to.be.equal(1.1234567890E-1)
        expect(toNumber('+1.1234567890E-1')).to.be.equal(1.1234567890E-1)
        expect(toNumber('-1.1234567890E-1')).to.be.equal(-1.1234567890E-1)
        expect(toNumber('1234567890.1234567890E-1234567890')).to.be.equal(1234567890.1234567890E-1234567890)
        expect(toNumber('+1234567890.1234567890E-1234567890')).to.be.equal(1234567890.1234567890E-1234567890)
        expect(toNumber('-1234567890.1234567890E-1234567890')).to.be.equal(-11234567890.1234567890E-1234567890)
        expect(toNumber('1234567890.1234567890e1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('+1234567890.1234567890e1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('-1234567890.1234567890e1234567890')).to.be.equal(-11234567890.1234567890E1234567890)
        expect(toNumber('1234567890.1234567890e+1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('+1234567890.1234567890e+1234567890')).to.be.equal(1234567890.1234567890E1234567890)
        expect(toNumber('-1234567890.1234567890e+1234567890')).to.be.equal(-11234567890.1234567890E1234567890)
        expect(toNumber('1234567890.1234567890e-1234567890')).to.be.equal(1234567890.1234567890E-1234567890)
        expect(toNumber('+1234567890.1234567890e-1234567890')).to.be.equal(1234567890.1234567890E-1234567890)
        expect(toNumber('-1234567890.1234567890e-1234567890')).to.be.equal(-11234567890.1234567890E-1234567890)

        expect(toNumber('1,234,567,890.')).to.be.equal(1234567890.0)
        expect(toNumber('+1,234,567,890.')).to.be.equal(1234567890.0)
        expect(toNumber('-1,234,567,890.')).to.be.equal(-1234567890.0)
        expect(toNumber('1,234,567,890.1')).to.be.equal(1234567890.1)
        expect(toNumber('+1,234,567,890.1')).to.be.equal(1234567890.1)
        expect(toNumber('-1,234,567,890.1')).to.be.equal(-1234567890.1)
        expect(toNumber('1,234,567,890.1234567890E1')).to.be.equal(1234567890.1234567890E1)
        expect(toNumber('+1,234,567,890.1234567890E+1')).to.be.equal(1234567890.1234567890E1)
        expect(toNumber('-1,234,567,890.1234567890E-1')).to.be.equal(-1234567890.1234567890E-1)        
        expect(toNumber('1,234,567,890.1234567890e1')).to.be.equal(1234567890.1234567890E1)
        expect(toNumber('+1,234,567,890.1234567890e+1')).to.be.equal(1234567890.1234567890E1)
        expect(toNumber('-1,234,567,890.1234567890e-1')).to.be.equal(-1234567890.1234567890E-1)

        expect(toNumber('1.1,234')).to.be.NaN
        expect(toNumber('+1.1,234')).to.be.NaN
        expect(toNumber('-1.1,234')).to.be.NaN
        expect(toNumber('1.1234E1,234')).to.be.NaN
        expect(toNumber('1.1234e1,234')).to.be.NaN
        expect(toNumber('+1.12345E+1,234')).to.be.NaN
        expect(toNumber('+1.12345e+1,234')).to.be.NaN
        expect(toNumber('-1.1234E-1,234')).to.be.NaN
        expect(toNumber('-1.1234e-1,234')).to.be.NaN

        expect(toNumber('a.0')).to.be.NaN
        expect(toNumber('a.')).to.be.NaN
        expect(toNumber('0.b')).to.be.NaN
        expect(toNumber('.b')).to.be.NaN
        expect(toNumber('1.2b')).to.be.NaN
        expect(toNumber('1a.2')).to.be.NaN
        expect(toNumber('a1.2')).to.be.NaN
        expect(toNumber('a1.2b')).to.be.NaN
        expect(toNumber('1.b.3')).to.be.NaN
        expect(toNumber('1.2.c')).to.be.NaN

        expect(toNumber('1.e')).to.be.NaN
        expect(toNumber('1.E')).to.be.NaN

        expect(toNumber('1.+1E+1')).to.be.NaN
        expect(toNumber('1.+1e+1')).to.be.NaN
        expect(toNumber('1.-1E-1')).to.be.NaN
        expect(toNumber('1.-1e-1')).to.be.NaN

        expect(toNumber('1.1+E1')).to.be.NaN
        expect(toNumber('1.1+e1')).to.be.NaN
        expect(toNumber('1.1-E1')).to.be.NaN
        expect(toNumber('1.1-e1')).to.be.NaN        

        expect(toNumber('1.1E1.1')).to.be.NaN
        expect(toNumber('1.1e1.1')).to.be.NaN
        expect(toNumber('1.1E+1.1')).to.be.NaN
        expect(toNumber('1.1e+1.1')).to.be.NaN
        expect(toNumber('1.1E-1.1')).to.be.NaN
        expect(toNumber('1.1e-1.1')).to.be.NaN
    }
}