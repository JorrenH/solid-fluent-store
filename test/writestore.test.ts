import { describe, test, expect } from "vitest";
import { createFluentStore } from "../src";

describe("Write to a solid store through the fluent proxy", () => {

    test.skip("Write a value to a top level store", () => {
        const [_read, write] = createFluentStore({ a: 1 });
    });

});