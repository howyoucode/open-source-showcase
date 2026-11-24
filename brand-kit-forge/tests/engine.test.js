import test from "node:test";
import assert from "node:assert/strict";
import {
  generateScale, contrastRatio, wcagLevel, autoFixPair, typeScale,
  generateBrandKit, briefSeed, toCss, toTailwind, toDTCG, toFigmaVariables,
  encodeBrief, decodeBrief
} from "../engine.js";

const brief={
  name:"North & Salt",industry:"Technology",market:"Europe",
  personality:["calm","premium","precise"],baseColor:"#336BFF",
  mode:"light",ratio:1.25
};

test("generates a complete 50-900 color scale",()=>{
  const scale=generateScale("#336BFF");
  for(const step of [50,100,200,300,400,500,600,700,800,900]) assert.match(scale[step],/^#[0-9A-F]{6}$/);
  assert.equal(Object.keys(scale).length,10);
});

test("calculates WCAG contrast and labels AA/AAA",()=>{
  assert.equal(Math.round(contrastRatio("#000000","#FFFFFF")),21);
  assert.equal(wcagLevel(21),"AAA");
  assert.equal(wcagLevel(4.5),"AA");
});

test("auto-fix produces a text/background pair at 4.5:1 or better",()=>{
  const fixed=autoFixPair("#FFFFFF","#FFFFFF");
  assert.ok(contrastRatio(fixed,"#FFFFFF")>=4.5);
});

test("supports the curated modular type ratios",()=>{
  assert.deepEqual(typeScale(16,1.2),{xs:13,sm:16,md:19,lg:23,xl:28,xxl:33});
  assert.equal(typeScale(16,1.25).md,20);
  assert.equal(typeScale(16,1.333).md,21);
  assert.throws(()=>typeScale(16,1.5),/Unsupported/);
});

test("the same brief produces the same seeded kit",()=>{
  const first=generateBrandKit(brief);
  const second=generateBrandKit(brief);
  assert.equal(briefSeed(brief),briefSeed(brief));
  assert.deepEqual(first,second);
  assert.notDeepEqual(first.colors.primary.base,first.colors.secondary.base);
});

test("CSS export contains custom properties",()=>{
  const css=toCss(generateBrandKit(brief));
  assert.match(css,/^:root \{/);
  assert.match(css,/--color-primary-500:/);
  assert.match(css,/--font-heading:/);
});

test("Tailwind export uses theme.extend",()=>{
  const tailwind=toTailwind(generateBrandKit(brief));
  assert.ok(tailwind.theme.extend.colors.primary);
  assert.ok(tailwind.theme.extend.fontFamily.heading);
  assert.ok(tailwind.theme.extend.spacing);
});

test("DTCG export has a valid community-format root and typed values",()=>{
  const dtcg=toDTCG(generateBrandKit(brief));
  assert.ok(dtcg.$schema);
  assert.equal(dtcg.brand.$type,"string");
  assert.equal(dtcg["color.primary"]["500"].$type,"color");
  assert.match(dtcg["type.size.md"].$value,/px$/);
});

test("Figma Variables export is structurally usable",()=>{
  const figma=toFigmaVariables(generateBrandKit(brief));
  assert.equal(figma.variables.primary["500"].type,"COLOR");
  assert.equal(figma.collections.Brand.defaultMode,"Light");
  assert.ok(Object.keys(figma.variables).length>=10);
});

test("brief URLs round-trip JSON",()=>{
  const encoded=encodeBrief(brief);
  assert.deepEqual(decodeBrief(encoded),brief);
});
