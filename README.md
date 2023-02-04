<p>
  <img width="100%" src="https://assets.solidjs.com/banner?type=solid-fluent-store&background=tiles&project=%20" alt="solid-fluent-store">
</p>

# solid-fluent-store

[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg?style=for-the-badge&logo=pnpm)](https://pnpm.io/)

This package is a wrapper library for [Solid](https://github.com/solidjs/solid) stores. It provides a fluent and type-safe API to interact with a store while maintaining read/write segregation.

## Quick start

Install it:

```bash
pnpm add solid-fluent-store
# or
yarn add solid-fluent-store
# or
npm i solid-fluent-store
```

Use it:

```tsx
import { createFluentStore } from 'solid-fluent-store'
```

## Realised/planned features

- [X] Stricter store reader
- [X] Writing values using object syntax as a function
- [X] Stream operators
- [X] Mutations with built-in Array/Set/Map API
- [ ] Record stream operators `$all`/`$filter`

## Basic usage

Store values can be read and written using object path syntax. Setters are applied as a function. Setter paths can also be stored in variables to be used later.
```tsx
const [read, write] = createFluentStore({ a: { b: 1 }})

read.a.b // returns 1

write.a.b(2)
read.a.b // returns 2

write.a.b(prev => prev * 2)
read.a.b // returns 4

write.a({ b: 7 })
read.a.b // returns 7

const writeA = write.a;
writeA.b(8)
read.a.b // returns 8
```

## Mutating built-in datastructures

Regular stores do not allow you to use mutating Array, Set and Map methods. Instead you have to apply mutations and set the store value to a copy of the mutated structure. The fluent store proxy does this for you, meaning you can use the API you're familiar with without losing reactivity.

```tsx
const [read, write] = createFluentStore({
  array: [1, 2, 3],
  set: new Set([1, 2, 3]),
  map: new Map([['a', 1], ['b', 2], ['c', 3]]),
});

let newLength = write.array.push(6, 9)
// ^ equals 5
read.array[2] // returns 3
read.array[3] // returns 6
read.array[4] // returns 9

let setRemoved = write.set.delete(2)
// ^ equals true
read.set.has(2) // returns false

let newMap = write.map.set('d', 4)
// ^ NOTE: newMap is not reactive
read.map.has('d') // returns true
```

## Stream operators

Solid stores have convenient path arguments to apply a modification to multiple store entries. The same syntax cannot be used with the object path syntax. Instead we define several stream operators, denoted with `$`. These are not only type safe but also explicitly convey their meaning.
```tsx
const [read, write] = createFluentStore({ a: 1, b: 2, c: 3 })

write.$in(['a', 'c'], /*setter*/ 5)
read.a // returns 5
read.b // returns 2
read.c // returns 5

write.$batch(w => {
  w.a(1)
  w.b(4)
  w.c(9)
})
read.a // returns 1
read.b // returns 4
read.c // returns 9
```

There are also various stream operators just for arrays.
```tsx
const [read, write] = createFluentStore([1, 2, 3])

write.$all(7)
read[0] // returns 7
read[1] // returns 7
read[2] // returns 7

write.$filter((value, idx) => idx > 0, 3)
read[0] // returns 7
read[1] // returns 3
read[2] // returns 3

write.$in([0, 2], 5)
read[0] // returns 5
read[1] // returns 3
read[2] // returns 5

write.$range({ from: 0, to: 3, by: 2 }, 7)
read[0] // returns 7
read[1] // returns 3
read[2] // returns 7

write.$batch(w => {
  w[0](1)
  w[2](9)
})
read[0] // returns 1
read[1] // returns 3
read[2] // returns 9
```


Futhermore, stream operators can be chained to become even more powerful.
```tsx
const [read, write] = createFluentStore({ 
  a: [1, 2, 3], 
  b: [4, 5, 6], 
  c: [7, 8, 9], 
})

// set all even values in 'a' and 'c' to 0
write.$in(['a', 'c']).$filter(x => x % 2 == 0, /*setter*/ 0)
read.a // returns [1, 0, 3]
read.b // returns [0, 5, 0]
read.c // returns [7, 0, 9]
```

The table below lists all available stream operators.
| Name | Signature | Description |
|-|-|-|
| *Objects* | `T`, `K extends keyof T` | |
| `$in` | `(K[], StoreSetter<T[K]>) => void` | Apply setter to all properties in `K[]` |
| | `(K[]) => StoreWriter<T[K]>` | " |
| `$batch` | `(body: (StoreWriter<T>) => void) => void` | Batch changes on the current StoreWriter |
| *Arrays* | `T[]` | |
| `$all` | `(StoreSetter<T>) => void` | Apply setter to all array indices |
| | `() => StoreWriter<T>` | " |
| `$filter` | `((T,number) => boolean, StoreSetter<T>) => void` | Apply setter to all (value,idx) pairs which evaluate to `true` |
| | `((T,number) => boolean) => StoreWriter<T>` | " |
| `$in` | `(number[], StoreSetter<T>) => void` | Apply setter to all given indices |
| | `(number[]) => StoreWriter<T>` | " |
| `$range` | `({ from, to, by }, StoreSetter<T>) => void` | Apply setter on a range of indices |
| | `({ from, to, by }) => StoreWriter<T>` | " |
| `$batch` | `(body: (StoreWriter<T[]>) => void) => void` | Batch changes on the current StoreWriter |

## Contribute

Issues and pull requests are always welcome ;-)
