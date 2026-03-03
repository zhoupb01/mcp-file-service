import test from "node:test";
import assert from "node:assert/strict";
import { buildArchivePath } from "../src/paths.js";

test("buildArchivePath: shared scope 生成共享路径", () => {
    assert.equal(
        buildArchivePath({ biz: "pay", req: "1001", scope: "shared", relPath: "spec.md", user: "alice" }),
        "archive/pay/1001/shared/spec.md"
    );
    assert.equal(
        buildArchivePath({ biz: "pay", req: "1001", scope: "shared", relPath: "", user: "alice" }),
        "archive/pay/1001/shared"
    );
});

test("buildArchivePath: user scope 生成用户路径", () => {
    assert.equal(
        buildArchivePath({ biz: "pay", req: "1001", scope: "user", relPath: "notes/todo.md", user: "alice" }),
        "archive/pay/1001/users/alice/notes/todo.md"
    );
    assert.equal(
        buildArchivePath({ biz: "pay", req: "1001", scope: "user", relPath: "", user: "alice" }),
        "archive/pay/1001/users/alice"
    );
});

test("buildArchivePath: user scope 需要 user", () => {
    assert.throws(
        () => buildArchivePath({ biz: "pay", req: "1001", scope: "user", relPath: "a.md", user: "" }),
        /missing user for user scope/
    );
});

test("buildArchivePath: biz/req 不能包含斜杠", () => {
    assert.throws(
        () => buildArchivePath({ biz: "pay/core", req: "1001", scope: "shared", relPath: "a.md", user: "alice" }),
        /invalid biz/
    );
    assert.throws(
        () => buildArchivePath({ biz: "pay", req: "1001/v2", scope: "shared", relPath: "a.md", user: "alice" }),
        /invalid req/
    );
});

test("buildArchivePath: relPath 必须是相对路径且不能越界", () => {
    assert.throws(
        () => buildArchivePath({ biz: "pay", req: "1001", scope: "shared", relPath: "/a.md", user: "alice" }),
        /invalid relPath/
    );
    assert.throws(
        () => buildArchivePath({ biz: "pay", req: "1001", scope: "shared", relPath: "../a.md", user: "alice" }),
        /invalid relPath/
    );
});
