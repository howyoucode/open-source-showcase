import test from "node:test";
import assert from "node:assert/strict";
import { buildMindMap, extractTitle, toFigmaPayload, toMermaid } from "../app.js";

test("rejects an empty idea", () => {
  assert.throws(() => buildMindMap("  "), /Describe an idea/);
});

test("creates a root and four main branches", () => {
  const map = buildMindMap("Build a community tool for sharing urban garden resources");
  assert.equal(map.nodes[0].type, "root");
  assert.equal(map.nodes.filter((node) => node.type === "primary").length, 4);
  assert.equal(map.edges.length, 4);
});

test("detailed mode adds leaf nodes", () => {
  const map = buildMindMap("Create an accessible learning platform", true);
  assert.ok(map.nodes.some((node) => node.type === "leaf"));
  assert.ok(map.edges.length > 4);
});

test("extractTitle shortens long ideas", () => {
  const title = extractTitle("Create a platform that connects local makers with creative mentors across the city");
  assert.ok(title.length <= 48);
});

test("exports Figma and Mermaid representations", () => {
  const map = buildMindMap("Build a neighborhood event platform");
  const figma = toFigmaPayload(map);
  assert.equal(figma.type, "FRAME");
  assert.equal(figma.children.length, 5);
  assert.match(toMermaid(map), /mindmap/);
  assert.match(toMermaid(map), /Features/);
});
