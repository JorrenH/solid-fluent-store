import { createStore, Store } from 'solid-js/store'

type StoreOptions = { name?: string }
type FluentStore<T> = [get: StoreReader<T>, set: StoreWriter<T>]
type StoreReader<T> = T
type StoreWriter<T> = T

interface CreateFluentStore {
  <T extends object>(store: T | Store<T>): FluentStore<T>
  <T extends object = {}>(store: T | Store<T>, options: StoreOptions): FluentStore<T>
}

export const createFluentStore: CreateFluentStore = function <T extends object>(
  store: T | Store<T>,
  options?: StoreOptions,
): FluentStore<T> {
  const [read, write] = createStore(store, options)

  return [read, read]
}
