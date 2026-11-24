import test from "node:test";
import assert from "node:assert/strict";
import { createProjectIdea, defaultSkills, profileUrl } from "../app.js";

test("creates an idea from at least two skills", () => {
  const idea = createProjectIdea(defaultSkills, 42);
  assert.ok(idea.title.includes("x"));
  assert.equal(idea.skills.length, 2);
  assert.ok(idea.description.length > 30);
});

test("does not create an idea with fewer than two skills", () => {
  assert.equal(createProjectIdea([{ name: "Design", category: "Creative", level: 3 }]), null);
});

test("builds a share URL containing the profile", () => {
  const url = profileUrl(defaultSkills, {
    origin: "https://example.com",
    pathname: "/showcase/",
  });
  assert.ok(url.startsWith("https://example.com/showcase/?skills="));
  assert.ok(url.includes("JavaScript"));
});
