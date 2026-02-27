import test from "node:test";
import assert from "node:assert/strict";
import { resolveRemotePath, rewriteRoleRootEntries } from "../src/paths.js";

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
