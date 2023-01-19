import { describe, test, expect } from "vitest";
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

});