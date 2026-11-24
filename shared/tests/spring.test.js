import test from "node:test";
import assert from "node:assert/strict";
import { Spring, SPRING_PRESETS, project, rubberband } from "../design-system/spring.js";

test("spring settles at its target", () => {
  const spring = new Spring(0, 100, 0, "default");
  for (let i = 0; i < 600; i++) spring.step(1 / 60);
  assert.equal(spring.x, 100);
  assert.equal(spring.settled, true);
});

test("spring starts from the live value when interrupted", () => {
  const spring = new Spring(0, 100, 0, "momentum");
  for (let i = 0; i < 20; i++) spring.step(1 / 60);
  const live = spring.x;
  spring.setTarget(25);
  assert.equal(spring.x, live);
});

test("spring handoffs initial velocity", () => {
  const spring = new Spring(50, 150, 50, "momentum");
  assert.equal(spring.vx, 50);
  spring.step(1 / 60);
  assert.notEqual(spring.x, 50);
});

test("project uses Apple's exponential deceleration model", () => {
  assert.ok(project(1000) > 0);
  assert.equal(project(0), 0);
  assert.ok(Math.abs(project(1000) - 499) < 1);
});

test("rubberband stays finite and reduces overshoot", () => {
  const result = rubberband(100, 300);
  assert.ok(result > 0);
  assert.ok(result < 100);
});
