import { createStore } from 'solid-js/store'
import type { StoreSetter, NotWrappable } from 'solid-js/store'

/* Basic interfacing types */
export type StoreOptions = { name?: string }
export type FluentStore<T> = [get: StoreReader<T>, set: StoreWriter<T>]
export type StoreReader<T> = WrapReadOnly<T>
export type StoreWriter<T, U extends PropertyKey[] = []> = 
  T extends NotWrappable
  ? SetStoreFunction<T,U>
  : [T] extends [unknown[]]
  ? SetArrayFunction<T,U>
  : SetObjectFunction<T,U>

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
type SetStoreFunction<T, U extends PropertyKey[]> = (setter: StoreSetter<T,U>) => void

type SetArrayFunction<T extends unknown[], U extends PropertyKey[]> = SetStoreFunction<T,U> & SetArrayProps<T,U>

type SetObjectFunction<T, U extends PropertyKey[]> = SetStoreFunction<T,U> & SetObjectProps<T,U>

type SetObjectProps<T,U extends PropertyKey[]> = {
  [K in keyof T]: StoreWriter<T[K], [K, ...U]>
}

type SetArrayProps<T extends readonly unknown[], U extends PropertyKey[]> = {
  [K in number]: StoreWriter<T[K], [K, ...U]>
}

/* Implementation with typedef */
interface CreateFluentStore {
  <T extends object>(store: T): FluentStore<T>
  <T extends object = {}>(store: T, options: StoreOptions): FluentStore<T>
}

type StoreProxyContext<T> = {
  store: T,
  setStore: Function,
  path: PropertyKey[]
}

export const createFluentStore: CreateFluentStore = function <T extends object>(
  store: T,
  options?: StoreOptions,
): FluentStore<T> {
  const [read, write] = createStore(store, options)

  return [read as StoreReader<T>, writeStoreProxy<T>({ store: read, setStore: write, path: [] })];
}

function writeStoreProxy<T>(context: StoreProxyContext<T>) : StoreWriter<T> {
  const { store, setStore, path } = context;

  return new Proxy(function() { }, {
    apply(_target, thisArg, argArray) {
      (setStore as Function).apply(thisArg, [...path, ...argArray]);
    },
    get(_target, parameter, _receiver) {
      return writeStoreProxy({ store, setStore, path: [...path, parameter] });
    }
  }) as unknown as StoreWriter<T>;
}
