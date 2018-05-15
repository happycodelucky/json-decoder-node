/**
 * Reflection metadata keys
 */
export const JsonDecoderMetadataKeys = {
    /**
     * JSON schema metadata
     */
    schema: Symbol.for('jsonDecoder.schema'),
    /**
     * Validator function based on JSON schema
     */
    schemaValidator: Symbol.for('jsonDecoder.schemaValidator'),
    /**
     * JSON context object
     */
    context: Symbol.for('jsonDecoder.context'),
}
