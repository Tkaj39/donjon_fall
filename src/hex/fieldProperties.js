/**
 * HexField property helpers.
 * Phase 1 — Defines the HexField/HexProperty data shapes and provides accessor utilities.
 *
 * HexField is a plain object representing one field on the board:
 *   { coords: {q, r, s}, properties: HexProperty[] }
 *
 * HexProperty is one of:
 *   { type: 'startingField', owner: 'red' | 'blue' }
 *   { type: 'focalPoint', active: boolean, group: 'left' | 'center' | 'right' }
 */

/**
 * Returns the property object of the given type, or null if not present.
 * @param {{coords: object, properties: object[]}} field - HexField
 * @param {string} type - property type
 * @returns {object|null}
 */
export function getProperty(field, type) {
    return field.properties.find(p => p.type === type) ?? null;
}

/**
 * Returns true if the field has a property of the given type.
 * @param {{coords: object, properties: object[]}} field - HexField
 * @param {string} type - property type
 * @returns {boolean}
 */
export function hasProperty(field, type) {
    return field.properties.some(p => p.type === type);
}
