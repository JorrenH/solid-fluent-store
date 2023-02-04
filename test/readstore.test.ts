
import { createStore } from 'solid-js/store';
import { describe, test, expect } from '@jest/globals';
import { createFluentStore, FluentStore } from '../src';

describe("Reading a solid store throught the fluent proxy", () => {

    test("Read a value from a top level store", () => {
        const [read, _write] = createFluentStore({ a: 1 });

        let value = read.a;

        expect(value).toBe(1);
    });

    test("Allow calling copying methods on arrays", () => {
        const [read, _write] = createFluentStore({ a: [ 1, 2, 3 ], b: [ 4, 5, 6 ] });

        let value = read.a.concat(read.b);

        expect(value).toEqual([ 1, 2, 3, 4, 5, 6 ]);
    });

    // fluent stores can be created from other stores
    () => {
        const plain = [{ name: 'plain' }];
        const [solid, _setSolid] = createStore([{ name: 'solid' }]);
        const [fluent, _setFluent] = createFluentStore([{ name: 'fluent' }]);

        let _x : FluentStore<{ name: string }[]> = createFluentStore(plain);
        let _y : FluentStore<{ name: string }[]> = createFluentStore(solid);
        // @ts-expect-error fluent stores preserve readonly accesibility when wrapping
        let _z1 : FluentStore<{ name: string }[]> = createFluentStore(fluent);
        let _z2 : FluentStore<readonly { name: string }[]> = createFluentStore(fluent);
    }

    // cannot assign to Array types
    () => {
        const [read, _write] = createFluentStore([ 1, 2, 3 ]);

        // @ts-expect-error array assignment is disallowed
        read[0] = 4;
    }

    // cannot assign to nested Array types
    () => {
        const [read, _write] = createFluentStore([[1, 2, 3], [4, 5, 6]]);

        // @ts-expect-error assignment is disallowed on nested array
        read[0][1] = 4;
    }

    // cannot access mutable array methods
    () => {
        const [read, _write] = createFluentStore([ 1, 2, 3 ]);
        
        // @ts-expect-error 'copyWithin' is a mutating method
        read.copyWithin([]);
        // @ts-expect-error 'fill' is a mutating method
        read.fill(0);
        // @ts-expect-error 'pop' is a mutating method
        read.pop();
        // @ts-expect-error 'push' is a mutating method
        read.push(4);
        // @ts-expect-error 'reverse' is a mutating method
        read.reverse();
        // @ts-expect-error 'shift' is a mutating method
        read.shift(4);
        // @ts-expect-error 'sort' is a mutating method
        read.sort();
        // @ts-expect-error 'splice' is a mutating method
        read.splice(0);
        // @ts-expect-error 'unshift' is a mutating method
        read.unshift()
    }

    // cannot modify Set types
    () => {
        const [read, _write] = createFluentStore(new Set([ 1, 2, 3 ]));
        
        // @ts-expect-error 'add' is a mutating method
        read.add(4);
        // @ts-expect-error 'clear' is a mutating method
        read.clear();
        // @ts-expect-error 'delete' is a mutating method
        read.delete(1);
    }

    // cannot modify Map types
    () => {
        const [read, _write] = createFluentStore(new Map([ [1, 2], [3, 4] ]));
        
        // @ts-expect-error 'set' is a mutating method
        read.set(1, 5);
        // @ts-expect-error 'clear' is a mutating method
        read.clear();
        // @ts-expect-error 'delete' is a mutating method
        read.delete(1);
    }

});