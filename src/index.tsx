import { createStore } from 'solid-js/store'
import type { Store, NotWrappable } from 'solid-js/store'

/* Basic interfacing types */
export type StoreOptions = { name?: string }
export type FluentStore<T> = [get: StoreReader<T>, set: StoreWriter<T>]
export type StoreReader<T> = WrapReadOnly<T>
export type StoreWriter<T> = T

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

/* Implementation with typedef */
interface CreateFluentStore {
  <T extends object>(store: T): FluentStore<T>
  <T extends object = {}>(store: T, options: StoreOptions): FluentStore<T>
}

export const createFluentStore: CreateFluentStore = function <T extends object>(
  store: T,
  options?: StoreOptions,
): FluentStore<T> {
  const [read, write] = createStore(store, options)

  return [read as StoreReader<T>, read]
}
