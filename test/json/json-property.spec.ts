import * as chai from 'chai'
import { suite, test } from '@testdeck/mocha'
import { jsonDecodable, jsonProperty } from '../../src'
import { JsonDecoder } from '../../src'

// Set up chai
const expect = chai.expect

@jsonDecodable({
    useConstructor: true,
})
class T {
    @jsonProperty
    value: string = 'Default'
}

@jsonDecodable({
    useConstructor: false,
})
class T2 {
    @jsonProperty
    value: string = 'Default'
}

@suite('Unit: jsonProperty')
export class URLTests {

    @test('constructor initialization')
    testConstructor() {
        const object = JsonDecoder.decode<T>({ }, T)!
        expect(object).to.be.instanceof(T)
        expect(object.value).to.be.equal('Default')

        const object2 = JsonDecoder.decode<T2>({ }, T2)!
        expect(object2).to.be.instanceof(T2)
        expect(object2.value).to.be.undefined
    }

    @test('simple')
    testSimple() {
        const object = JsonDecoder.decode<T>({ value: 'Test' }, T)!
        expect(object).to.be.instanceof(T)
        expect(object.value).to.be.equal('Test')
    }
}