/**
 * @module json-decoder
 */

import { DecoderPrototypalTarget, DecoderPrototypalCollectionTarget } from '../decoder-declarations'
import { toArray } from './array-marshaller'
import { toBoolean } from './boolean-marshaller'
import { toMap } from './map-marshaller'
import { toNumber } from './number-marshaller'
import { toObject } from './object-marshaller'
import { toSet } from './set-marshaller'
import { toString } from './string-marshaller'
import { toURL } from './url-marshaller'
import { URL } from 'url'

// Marshaller function map
const marshallers = new Map<DecoderPrototypalTarget, (value: any, strict?: boolean) => any>()
marshallers.set(Boolean, toBoolean)
marshallers.set(Number, toNumber)
marshallers.set(Object, toObject)
marshallers.set(String, toString)
marshallers.set(URL, toURL)

// Collection marshaller function map
const collectionMarshallers = new Map<DecoderPrototypalTarget, (value: any, itemMarshaller: (value: any, strict?: boolean) => any | undefined, strict?: boolean) => any>()
collectionMarshallers.set(Array, toArray)
collectionMarshallers.set(Map, toMap)
collectionMarshallers.set(Set, toSet)

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
 * Returns a collection marshaller function for a given type
 *
 * @param type - Type to return a marshaller for
 * @returns marshaller function or undefined if not built-in
 */
export function collectionMarshallerForType(type: DecoderPrototypalTarget): ((value: any, itemMarshaller?: (value: any, strict?: boolean) => any, strict?: boolean) => any) | undefined {
    return collectionMarshallers.get(type)
}
