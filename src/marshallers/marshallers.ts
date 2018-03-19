/**
 * @module json-decoder
 */

import { DecoderPrototypalTarget } from '../decoder/decoder-declarations'
import { toArray } from './array-marshaller'
import { toBoolean } from './boolean-marshaller'
import { toDate } from './date-marshaller'
import { toMap } from './map-marshaller'
import { toNumber } from './number-marshaller'
import { toObject } from './object-marshaller'
import { toSet } from './set-marshaller'
import { toString } from './string-marshaller'
import { toURL } from './url-marshaller'
import { URL } from 'url'

// Marshaller function map
const marshallers = new Map<DecoderPrototypalTarget, MarshallerFunction>()
marshallers.set(Boolean, toBoolean)
marshallers.set(Date, toDate)
marshallers.set(Number, toNumber)
marshallers.set(Object, toObject)
marshallers.set(String, toString)
marshallers.set(URL, toURL)

// Collection marshaller function map
const collectionMarshallers = new Map<DecoderPrototypalTarget, CollectionMarshallerFunction>()
collectionMarshallers.set(Array, toArray)
collectionMarshallers.set(Map, toMap)
collectionMarshallers.set(Set, toSet)

/**
 * Function interface for simple marshallers
 */
export interface MarshallerFunction {
    (value: any, strict?: boolean): any
}

/**
 * Returns a marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export function marshallerForType(type: DecoderPrototypalTarget): ((value: any, strict?: boolean) => any) | undefined {
    return marshallers.get(type)
}

/**
 * Function interface for collection based marshallers
 */
export interface CollectionMarshallerFunction {
    (value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean): any
}

/**
 * Returns a collection marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export function collectionMarshallerForType(type: DecoderPrototypalTarget): CollectionMarshallerFunction | undefined {
    return collectionMarshallers.get(type)
}
