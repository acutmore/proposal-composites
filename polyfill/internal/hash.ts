import type { Composite } from "../composite.ts";
import { isNaN, NaN, apply, ownKeys, keyFor, weakMapGet, weakMapSet, sort, localeCompare } from "./originals.ts";
import { assert } from "./utils.ts";

const seed = randomHash();
const TRUE = randomHash();
const FALSE = randomHash();
const NULL = randomHash();
const UNDEFINED = randomHash();
const SYMBOLS = randomHash();
const KEY = randomHash();

const hashCache = new WeakMap<symbol | object, number | typeof lazyCompositeHash>();
const symbolsInWeakMap = (() => {
    try {
        hashCache.set(Symbol(), 0);
        return true;
    } catch {
        return false;
    }
})();

const lazyCompositeHash = Symbol("lazy");
export function prepareLazyHash(input: Composite): void {
    assert(apply(weakMapGet, hashCache, [input]) === undefined);
    apply(weakMapSet, hashCache, [input, lazyCompositeHash]);
}

export function maybeHashComposite(input: Composite): number | undefined {
    let hash: number | typeof lazyCompositeHash = apply(weakMapGet, hashCache, [input]);
    if (hash !== lazyCompositeHash) {
        assert(typeof hash === "number");
        return hash;
    }
    return undefined;
}

// TODO - use a better hashing function
/** A very basic, demonstrative, non-cryptographic, hashing function for Composites */
export function hashComposite(input: Composite): number {
    let hash = maybeHashComposite(input);
    if (hash !== undefined) {
        return hash;
    }
    hash = 0;
    const keys = apply(ownKeys, null, [input]);
    apply(sort, keys, [keySort]);
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (typeof key === "string") {
            hash ^= stringHash(key) ^ KEY;
            hash ^= hashValue(input[key as keyof typeof input]);
            continue;
        }
        assert(typeof key === "symbol");
        if (!symbolsInWeakMap && keyFor(key) === undefined) {
            // Remaining keys can't be hashed
            break;
        }
        hash ^= symbolHash(key) ^ KEY;
        hash ^= hashValue(input[key as keyof typeof input]);
    }
    assert(apply(weakMapGet, hashCache, [input]) === lazyCompositeHash);
    apply(weakMapSet, hashCache, [input, hash]);
    return hash;
}

function hashValue(input: unknown): number {
    if (input === null) {
        return NULL;
    }
    switch (typeof input) {
        case "undefined":
            return UNDEFINED;
        case "boolean":
            return input ? TRUE : FALSE;
        case "number":
            return numberHash(input);
        case "bigint":
            return numberHash(Number(input));
        case "string":
            return stringHash(input);
        case "symbol":
            return symbolHash(input);
        case "object":
            return cachedHash(input);
        case "function":
            return cachedHash(input);
        default:
            throw new TypeError(`Unsupported input type: ${typeof input}`);
    }
}

const floatArray = new Float64Array(1);
const intArray = new Uint32Array(floatArray.buffer);
function numberHash(input: number): number {
    floatArray[0] = input === 0 ? 0 : isNaN(input) ? NaN : input;
    const hash = intArray[0] ^ intArray[1];
    return hash >>> 0;
}

function stringHash(input: string): number {
    let hash = seed;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 33) ^ input.charCodeAt(i);
    }
    return hash >>> 0;
}

function symbolHash(input: symbol): number {
    const regA = Symbol.keyFor(input);
    if (regA !== undefined) {
        return stringHash(regA) ^ SYMBOLS;
    }
    if (!symbolsInWeakMap) {
        return SYMBOLS;
    }
    return cachedHash(input);
}

function cachedHash(input: object | symbol): number {
    let hash = apply(weakMapGet, hashCache, [input]);
    if (hash === undefined) {
        hash = randomHash();
        apply(weakMapSet, hashCache, [input, hash]);
        return hash;
    }
    if (hash === lazyCompositeHash) {
        return hashComposite(input as Composite);
    }
    return hash;
}

function randomHash() {
    return (Math.random() * (2 ** 31 - 1)) >>> 0;
}

/**
 * Strings before symbols.
 * Strings sorted lexicographically.
 * Symbols sorted by {@link symbolSort}
 */
function keySort(a: string | symbol, b: string | symbol): number {
    if (typeof a !== typeof b) {
        return typeof a === "string" ? 1 : -1;
    }
    if (typeof a === "string") {
        return apply(localeCompare, a, [b]);
    }
    assert(typeof b === "symbol");
    return symbolSort(a, b);
}

/**
 * Registered symbols are sorted by their string key.
 * Registered symbols come before non-registered symbols.
 * Non-registered symbols are not sorted (stable order preserved).
 */
function symbolSort(a: symbol, b: symbol): number {
    const regA = keyFor(a);
    const regB = keyFor(b);
    if (regA !== undefined && regB !== undefined) {
        return apply(localeCompare, regA, [regB]);
    }
    if (regA === undefined && regB === undefined) {
        return symbolsInWeakMap ? secretSymbolSort(a, b) : 0;
    }
    return regA === undefined ? 1 : -1;
}

const secretSymbolOrder = new WeakMap<symbol, number>();
let nextOrder = 0;
function getSymbolOrder(input: symbol): number {
    let order = secretSymbolOrder.get(input);
    if (order === undefined) {
        order = nextOrder++;
        secretSymbolOrder.set(input, order);
    }
    return order;
}
function secretSymbolSort(a: symbol, b: symbol): number {
    return getSymbolOrder(a) - getSymbolOrder(b);
}
