import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

test("loadConfig: cli role 优先于环境变量", () => {
    const config = loadConfig(["--role=java"], { REMOTE_ROLE: "product" });
    assert.equal(config.role, "java");
});

test("loadConfig: role 来自环境变量", () => {
    const config = loadConfig([], { REMOTE_ROLE: "python" });
    assert.equal(config.role, "python");
});

test("loadConfig: --role 缺失值时报错", () => {
    assert.throws(
        () => loadConfig(["--role"], {}),
        /invalid --role: missing value, expected one of product, java, python, android, vue/
    );
});

test("loadConfig: --role 为空值时报错", () => {
    assert.throws(
        () => loadConfig(["--role="], {}),
        /invalid --role: empty value, expected one of product, java, python, android, vue/
    );
});

test("loadConfig: 非枚举角色时报错", () => {
    assert.throws(
        () => loadConfig(["--role=go-backend"], {}),
        /invalid role "go-backend", expected one of product, java, python, android, vue/
    );
});
