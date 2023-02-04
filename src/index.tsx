import { createStore, unwrap as _unwrap } from 'solid-js/store'
import type { StoreSetter, NotWrappable } from 'solid-js/store'
import { batch } from 'solid-js'

/* Basic interfacing types */
export type StoreOptions = { name?: string }
export type FluentStore<T> = [get: StoreReader<T>, set: StoreWriter<T>]
export type StoreReader<T> = WrapReadOnly<T>
export type StoreWriter<T, U extends PropertyKey[] = []> = T extends NotWrappable
  ? SetStoreFunction<T, U>
  : [T] extends [unknown[]]
  ? SetArrayFunction<T, U>
  : SetObjectFunction<T, U>

/* Store reader types */
type WrapReadOnly<T> = 0 extends 1 & T
  ? T
  : T extends Array<infer V>
  ? ReadonlyArray<WrapReadOnly<V>>
  : T extends Set<infer V>
  ? ReadonlySet<WrapReadOnly<V>>
  : T extends Map<infer K, infer V>
  ? ReadonlyMap<K, WrapReadOnly<V>>
  : { [K in keyof T]: WrapReadOnly<T[K]> }

/* Store writer types */
type SetStoreFunction<T, U extends PropertyKey[]> = (setter: StoreSetter<T, U>) => void

type SetArrayFunction<T extends unknown[], U extends PropertyKey[]> = SetStoreFunction<T, U> &
  SetArrayProps<T, U>

type SetObjectFunction<T, U extends PropertyKey[]> = SetStoreFunction<T, U> & SetObjectProps<T, U>

type SetObjectProps<T, U extends PropertyKey[]> = {
  [K in keyof T]: StoreWriter<T[K], [K, ...U]>
} & {
  // TODO implement Record iterators
  // $all: T extends Record<infer K, infer V> ? Record<K,V> extends T ? Record$all<K,V,U> : never : never
  // $filter: T extends Record<infer K, infer V> ? Record<K,V> extends T ? Record$filter<K,V,U> : never : never
  $in: $in<T, U>
  $batch: $batch<T, U>
}

type SetArrayProps<T extends readonly unknown[], U extends PropertyKey[]> = {
  [K in number]: StoreWriter<T[K], [K, ...U]>
} & {
  $all: Array$all<T, U>
  $filter: Array$filter<T, U>
  $range: Array$range<T, U>
  $in: $in<T, U>
  $batch: $batch<T, U>
}

interface Record$all<K extends PropertyKey, V, U extends PropertyKey[]> {
  (): StoreWriter<V, [K, ...U]>
  (setter: StoreSetter<V, [K, ...U]>): void
}

interface Record$filter<K extends PropertyKey, V, U extends PropertyKey[]> {
  (predicate: (value: V, key: K) => boolean): StoreWriter<V, [K, ...U]>
  (predicate: (value: V, key: K) => boolean, setter: StoreSetter<V, [K, ...U]>): void
}

interface Array$all<T extends readonly unknown[], U extends PropertyKey[]> {
  (): StoreWriter<T[number], [number, ...U]>
  (setter: StoreSetter<T[number], [number, ...U]>): void
}

interface Array$filter<T extends readonly unknown[], U extends PropertyKey[]> {
  (predicate: (value: T[number], index: number) => boolean): StoreWriter<T[number], [number, ...U]>
  (
    predicate: (value: T[number], index: number) => boolean,
    setter: StoreSetter<T[number], [number, ...U]>,
  ): void
}

type DefinesRange = { from?: number; to?: number; by?: number }
interface Array$range<T extends readonly unknown[], U extends PropertyKey[]> {
  (range: DefinesRange): StoreWriter<T[number], [number, ...U]>
  (range: DefinesRange, setter: StoreSetter<T[number], [number, ...U]>): void
}

interface $in<T, U extends PropertyKey[]> {
  <K extends keyof T>(keys: K[]): StoreWriter<T[K], [K, ...U]>
  <K extends keyof T>(keys: K[], setter: StoreSetter<T[K], [K, ...U]>): void
}

interface $batch<T, U extends PropertyKey[]> {
  (body: (s: StoreWriter<T, U>) => void): void
}

/* Implementation with typedef */
interface CreateFluentStore {
  <T extends object>(store: T): FluentStore<T>
  <T extends object = {}>(store: T, options: StoreOptions): FluentStore<T>
}

type PathProperty = PropertyKey | Function | Array<unknown> | object

type StoreProxyContext<T> = {
  store: T
  setStore: Function
  path: PathProperty[]
}

export const createFluentStore: CreateFluentStore = function <T extends object>(
  store: T,
  options?: StoreOptions,
): FluentStore<T> {
  const [read, write] = createStore(store, options)

  return [read as StoreReader<T>, writeStoreProxy<T>({ store: read, setStore: write, path: [] })]
}

export function unwrap<T>(reader: StoreReader<T>): T {
  return _unwrap(reader as T)
}

function defineStream(fn: (...args: any[]) => [PathProperty, Function | undefined]) {
  return function <T>(context: StoreProxyContext<T>) {
    return function (...args: any[]) {
      const { store, setStore, path } = context
      const [extraPath, setter] = fn(...args)
      if (setter) {
        ;(setStore as Function).apply({}, [...path, extraPath, setter])
      } else {
        return writeStoreProxy({ store, setStore, path: [...path, extraPath] })
      }
    }
  }
}

const $streams: Record<PropertyKey, Function> = {
  $all: defineStream((setter?: Function) => [() => true, setter]),
  $filter: defineStream((filter: Function, setter?: Function) => [filter, setter]),
  $in: defineStream((keys: Array<PropertyKey>, setter?: Function) => [keys, setter]),
  $range: defineStream((range: object, setter?: Function) => [range, setter]),
  $batch: function <T>(context: StoreProxyContext<T>) {
    return function (body: (store: StoreWriter<T>) => void) {
      batch(() => body(writeStoreProxy(context)))
    }
  },
}

function writeStoreProxy<T>(context: StoreProxyContext<T>): StoreWriter<T> {
  const { store, setStore, path } = context

  return new Proxy(function () {}, {
    apply(_target, thisArg, argArray) {
      ;(setStore as Function).apply(thisArg, [...path, ...argArray])
    },
    get(target, parameter, _receiver) {
      if ($streams.hasOwnProperty(parameter)) {
        return $streams[parameter]!.apply(target, [context])
      }
      return writeStoreProxy({ store, setStore, path: [...path, parameter] })
    },
  }) as unknown as StoreWriter<T>
}
