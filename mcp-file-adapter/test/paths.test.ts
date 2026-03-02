import test from "node:test";
import assert from "node:assert/strict";
import { resolveArchiveWritePath, resolveRemotePath, rewriteRoleRootEntries } from "../src/paths.js";

test("resolveRemotePath: role 下 template 自动加前缀", () => {
    assert.equal(resolveRemotePath("template", "java"), "java/template");
    assert.equal(
        resolveRemotePath("template/detail-design-template.md", "java"),
        "java/template/detail-design-template.md"
    );
    assert.equal(resolveRemotePath("archive/123/123-prd.md", "java"), "archive/123/123-prd.md");
});

test("rewriteRoleRootEntries: 根目录仅暴露 template 和 archive", () => {
    const data = {
        ok: true,
        entries: [
            { name: "archive", type: "dir", mtimeMs: 1 },
            { name: "java", type: "dir", mtimeMs: 2 },
            { name: "product", type: "dir", mtimeMs: 3 },
        ],
    };
    const rewritten = rewriteRoleRootEntries(data, "java");
    assert.deepEqual(rewritten, {
        ok: true,
        entries: [
            { name: "archive", type: "dir", mtimeMs: 1 },
            { name: "template", type: "dir", mtimeMs: 2 },
        ],
    });
});

test("resolveArchiveWritePath: archive 路径注入 user 目录", () => {
    assert.equal(resolveArchiveWritePath("archive/123/123-prd.md", "alice"), "archive/123/alice/123-prd.md");
    assert.equal(resolveArchiveWritePath("archive/123", "alice"), "archive/123/alice");
});

test("resolveArchiveWritePath: 非 archive 路径不变", () => {
    assert.equal(resolveArchiveWritePath("template/abc.md", "alice"), "template/abc.md");
});

test("resolveArchiveWritePath: user 为空不变", () => {
    assert.equal(resolveArchiveWritePath("archive/123/123-prd.md", ""), "archive/123/123-prd.md");
});

test("resolveArchiveWritePath: 已注入同 user 不重复注入", () => {
    assert.equal(
        resolveArchiveWritePath("archive/123/alice/123-prd.md", "alice"),
        "archive/123/alice/123-prd.md"
    );
});
