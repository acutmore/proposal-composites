export const { isNaN, NaN, POSITIVE_INFINITY, NEGATIVE_INFINITY } = Number;
export const { abs, floor, min } = Math;
export const { apply, ownKeys, defineProperty, preventExtensions, getOwnPropertyDescriptor } = Reflect;
export const { is, freeze } = Object;
export const { sort, splice, includes, indexOf, lastIndexOf } = Array.prototype;
export const { keyFor, iterator } = Symbol;
export const { localeCompare } = String.prototype;
export const _Map = Map;
export const {
    has: mapHas,
    set: mapSet,
    get: mapGet,
    delete: mapDelete,
    clear: mapClear,
    keys: mapKeys,
    values: mapValues,
    entries: mapEntries,
    forEach: mapForEach,
} = Map.prototype;
export const mapSize = getOwnPropertyDescriptor(Map.prototype, "size")!.get!;
export const _Set = Set;
export const { has: setHas, add: setAdd } = Set.prototype;
export const _WeakSet = WeakSet;
export const { has: weakSetHas, add: weakSetAdd } = WeakSet.prototype;
export const _WeakMap = WeakMap;
export const { has: weakMapHas, set: weakMapSet, get: weakMapGet } = WeakMap.prototype;
