import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";

test("loadConfig: cli role 优先于环境变量", () => {
    const config = loadConfig(["--role=java-backend"], { REMOTE_ROLE: "product" });
    assert.equal(config.role, "java-backend");
});

test("loadConfig: role 来自环境变量", () => {
    const config = loadConfig([], { REMOTE_ROLE: "go-backend" });
    assert.equal(config.role, "go-backend");
});

test("loadConfig: --role 缺失值时报错", () => {
    assert.throws(
        () => loadConfig(["--role"], {}),
        /invalid --role: missing value, expected non-empty string and must not be system names: template, archive/
    );
});

test("loadConfig: --role 为空值时报错", () => {
    assert.throws(
        () => loadConfig(["--role="], {}),
        /invalid --role: empty value, expected non-empty string and must not be system names: template, archive/
    );
});

test("loadConfig: role 与系统保留名冲突时报错", () => {
    assert.throws(
        () => loadConfig(["--role=archive"], {}),
        /invalid role "archive", role must not be system names: template, archive/
    );
});

test("loadConfig: cli user 优先于环境变量", () => {
    const config = loadConfig(["--user=alice"], { REMOTE_USER: "bob" });
    assert.equal(config.user, "alice");
});

test("loadConfig: user 来自环境变量", () => {
    const config = loadConfig([], { REMOTE_USER: "charlie" });
    assert.equal(config.user, "charlie");
});

test("loadConfig: --user 缺失值时报错", () => {
    assert.throws(() => loadConfig(["--user"], {}), /invalid --user: missing value, expected non-empty string/);
});

test("loadConfig: --user 为空值时报错", () => {
    assert.throws(() => loadConfig(["--user="], {}), /invalid --user: empty value, expected non-empty string/);
});

test("loadConfig: REMOTE_USER 为空值时视为未设置", () => {
    const config = loadConfig([], { REMOTE_USER: "" });
    assert.equal(config.user, "");
});
