
import { describe, test, expect } from 'vitest';
import { createFluentStore } from '../src';

describe("Reading a solid store throught the fluent proxy", () => {

    test("Read a value from a top level store", () => {
        const [read, _write] = createFluentStore({ a: 1 });

        let value = read.a;

        expect(value).toBe(1);
    });

});