import { createEffect, createMemo, createRoot } from "solid-js";
import { describe, test, expect } from "@jest/globals";
import { createFluentStore, StoreWriter } from "../src";

describe("Write to a solid store through the fluent proxy", () => {

    test("Write a value to a top level store", () => {
        const [read, write] = createFluentStore({ a: 1 });

        write({ a: 2 });

        expect(read.a).toEqual(2);
    });

    test("Write a value to a top level store property", () => {
        const [read, write] = createFluentStore({ a: 1 });

        write.a(2);
        
        expect(read.a).toEqual(2);
    });

    test("Write a value to an array using type assert", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ]);

        write[1]!(4);
        
        expect(read[1]).toEqual(4);
    });

    test("Write a value to a fixed length array", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ] as readonly [number, number, number]);

        write[1](4);
        
        expect(read[1]).toEqual(4);
    });

    test("Reuse paths stored in a variable", () => {
        const [read, write] = createFluentStore({ a: { b: { c: 1 } } });

        const pathToA = write.a;
        const pathToB = pathToA.b;
        const pathToC = pathToB.c;

        pathToA(a => ({ b: { c: a.b.c + 1 } }));
        pathToB(b => ({ c: b.c + 1 }));
        pathToC(c => c + 1);
        
        expect(read.a.b.c).toEqual(4);
    });

    test("Write a value to a deeply nested property", () => {
        const [read, write] = createFluentStore({ a: { b: { c: { d: { e: { f: { g: { h: { i: { j: { k: { l: 1 } } } } } } } } } } } });

        write.a.b.c.d.e.f.g.h.i.j.k.l(2);
        
        expect(read.a.b.c.d.e.f.g.h.i.j.k.l).toEqual(2);
    });

    test("Modify array using mutating method", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ]);

        const newLen = write.push(4, 5, 6);

        expect(newLen).toEqual(6);
        expect(read[0]).toEqual(1);
        expect(read[1]).toEqual(2);
        expect(read[2]).toEqual(3);
        expect(read[3]).toEqual(4);
        expect(read[4]).toEqual(5);
        expect(read[5]).toEqual(6);
    });

    test("Apply mutating method after streaming operator", () => {
        const [read, write] = createFluentStore({ a: [1, 2, 3], b: [4, 5, 6], c: [7, 8, 9] });

        write.$in(['a', 'c']).pop();
        expect(read.a.length).toBe(2);
        expect(read.b.length).toBe(3);
        expect(read.c.length).toBe(2);
    });

    test("Modify Set using mutating method", () => {
        const [read, write] = createFluentStore({ set: new Set([1, 2, 3]) });

        const deleted = write.set.delete(2);
        expect(deleted).toBe(true);
        expect(read.set.has(1)).toBe(true);
        expect(read.set.has(2)).toBe(false);
        expect(read.set.has(3)).toBe(true);

        write.set.clear();
        expect(read.set.size).toBe(0);

        write.set.add(5);
        expect(read.set.has(5)).toBe(true);
    });

    test("Modify Map using mutating method", () => {
        const [read, write] = createFluentStore({ map: new Map([['a', 1], ['b', 2], ['c', 3]]) });

        const deleted = write.map.delete('b');
        expect(read.map.has('a')).toBe(true);
        expect(read.map.has('b')).toBe(false);
        expect(read.map.has('c')).toBe(true);

        write.map.clear();
        expect(read.map.size).toBe(0);

        write.map.set('d', 4);
        expect(read.map.has('d')).toBe(true);
    });

    // TODO add 'all' and 'filter' functionality to Records
    // test("Object 'all' stream", () => {
    //     const [read, write] = createFluentStore({ a: 1, b: 2, c: 3 });

    //     write.$all(4);

    //     expect(read.a).toEqual(4);
    //     expect(read.b).toEqual(4);
    //     expect(read.c).toEqual(4);
    // });

    // test("Object 'filter' stream", () => {
    //     const [read, write] = createFluentStore({ a: 1, b: 2, c: 3 });

    //     write.$filter((v, k) => v == 3 || k == "a", v => v * 3);

    //     expect(read.a).toEqual(3);
    //     expect(read.b).toEqual(2);
    //     expect(read.c).toEqual(9);
    // });

    test("Object 'in' stream", () => {
        const [read, write] = createFluentStore({ a: 1, b: 2, c: 3 });

        write.$in(['a', 'c'], 4);

        expect(read.a).toEqual(4);
        expect(read.b).toEqual(2);
        expect(read.c).toEqual(4);
    });

    test("Object 'batch' stream", async () => {
        let effectRan = 0;

        const [read, write] = createFluentStore({ a: 1, b: 2 });
        const memo = createRoot(() => createMemo(() => read.a + read.b));

        createEffect(() => {
            effectRan ++;
            expect([3, 6]).toContain(memo());
        });

        write.$batch(w => {
            expect(read.a).toBe(1);
            expect(read.b).toBe(2);
            w.a(2);
            expect(read.a).toBe(2);
            expect(memo()).toBe(4);
            w.b(4);
            expect(read.b).toBe(4);
            expect(memo()).toBe(6);
        });

        expect(read.a).toBe(2);
        expect(read.b).toBe(4);
        expect(memo()).toBe(6);
        expect(effectRan).toBe(2);
    });

    test("Array 'all' stream", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ]);

        write.$all(4);

        expect(read[0]).toEqual(4);
        expect(read[1]).toEqual(4);
        expect(read[2]).toEqual(4);
    });

    test("Array 'filter' stream", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ]);

        write.$filter((v, i) => v == 3 || i == 0, v => v * 3);

        expect(read[0]).toEqual(3);
        expect(read[1]).toEqual(2);
        expect(read[2]).toEqual(9);
    });

    test("Array 'in' stream", () => {
        const [read, write] = createFluentStore([ 1, 2, 3 ]);

        write.$in([0, 2], 4);

        expect(read[0]).toEqual(4);
        expect(read[1]).toEqual(2);
        expect(read[2]).toEqual(4);
    });

    test("Array 'range' stream", () => {
        const [read, write] = createFluentStore([ 1, 2, 3, 4, 5 ]);

        write.$range({ from: 1, to: 5, by: 2 }, 6);

        expect(read[0]).toEqual(1);
        expect(read[1]).toEqual(6);
        expect(read[2]).toEqual(3);
        expect(read[3]).toEqual(6);
        expect(read[4]).toEqual(5);
    });

    test("Array 'batch' stream", () => {
        let effectRan = 0;

        const [read, write] = createFluentStore<readonly [number, number]>([ 1, 2 ]);
        const memo = createRoot(() => createMemo(() => read[0] + read[1]));

        createEffect(() => {
            effectRan ++;
            expect([3, 6]).toContain(memo());
        });

        write.$batch(w => {
            expect(read[0]).toBe(1);
            expect(read[1]).toBe(2);
            w[0](2);
            expect(read[0]).toBe(2);
            expect(memo()).toBe(4);
            w[1](4);
            expect(read[1]).toBe(4);
            expect(memo()).toBe(6);
        });

        expect(read[0]).toBe(2);
        expect(read[1]).toBe(4);
        expect(memo()).toBe(6);
        expect(effectRan).toBe(2);
    });

    // Basic value setter
    () => {
        const [_read, write] = createFluentStore({ a: 1 });

        // @ts-expect-error 'a' is not of type boolean
        write({ a: true });
        // @ts-expect-error 'a' is not of type string
        write.a("");
        // @ts-expect-error 'a' is not of type array
        write.a(prev => []);
    }

    // Intermediate path type
    () => {
        const [_read, write] = createFluentStore({ a: { b: { c: 1 } } });

        const _pathToA : StoreWriter<{ b: { c: number } }, ['a']> = write.a;
        const _pathToB : StoreWriter<{ c: number }, ['b', 'a']> = write.a.b;
        const _pathToC : StoreWriter<number, ['c', 'b', 'a']> = write.a.b.c;
    }

    // Type inference in path
    () => {
        const [_read, write] = createFluentStore({ a: { b: { c: 1 } } });

        write.a.b.c((v, [third, second, first]) => {
            let x: 'a' = first;
            // @ts-expect-error second param is not of type 'a'
            x = second;
            // @ts-expect-error third param is not of type 'a'
            x = third;

            let y: 'b' = second;
            let z: 'c' = third;

            return v;
        });
    }

    // Only allow 'all' and 'filer' streams on Record-like types
    () => {
        const [_read, write] = createFluentStore<{ a: number, b: string, c: Element }>({ a: 1, b: '2', c: {} as Element });

        // @ts-expect-error write is not a Record-like type
        write.$all({} as any);

        // @ts-expect-error write is not a Record-like type
        write.$filter((v,k) => true, {} as any);
    }

    // Allow union types
    () => {
        const [_read, write] = createFluentStore<{ a: 'one' | 'two' | 'three', b: boolean}>({ a: 'two', b: false });

        write.a('one');
        write.b(true);
    }

});