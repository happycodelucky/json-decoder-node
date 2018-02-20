/**
 * @module json-decoder
 */

import { DecoderPrototypalTarget } from '../decoder-declarations'
import { toArray } from './array-marshaller'
import { toBoolean } from './boolean-marshaller'
import { toNumber } from './number-marshaller'
import { toObject } from './object-marshaller'
import { toString } from './string-marshaller'
import { toURL } from './url-marshaller'
import { URL } from 'url'

// Marshaller function map
const marshallers = new Map<DecoderPrototypalTarget, (any, boolean) => any>()
marshallers.set(Array, toArray)
marshallers.set(Boolean, toBoolean)
marshallers.set(Number, toNumber)
marshallers.set(Object, toObject)
marshallers.set(String, toString)
marshallers.set(URL, toURL)

/**
 * Returns a marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export function marshallerForType(type: DecoderPrototypalTarget): ((any, boolean) => any) | undefined {
    return marshallers.get(type)
}
