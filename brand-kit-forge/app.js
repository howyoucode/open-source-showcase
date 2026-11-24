import {
  PRESETS, generateBrandKit, briefSeed, toCss, toTailwind, toDTCG,
  toFigmaVariables, encodeBrief, decodeBrief
} from "./engine.js";

const $ = (selector) => document.querySelector(selector);
let kit;
let ratio = 1.25;
let shuffleOffset = 0;
let lockedBase = null;
let previewDark = false;

function readBrief() {
  const name = $("#brand-name").value.trim();
  if (!name) throw new Error("Enter a brand name.");
  const baseValue = $("#base-hex").value.trim();
  const personality = [...document.querySelectorAll(".chip.active")].map((chip) => chip.dataset.value);
  if (personality.length !== 3) throw new Error("Choose exactly three personality keywords.");
  return {
    name,
    industry: $("#industry").value,
    market: $("#market").value,
    personality,
    baseColor: baseValue,
    mode: $("#mode").value,
    ratio
  };
}

function render() {
  try {
    kit = generateBrandKit(readBrief(), shuffleOffset);
  } catch (error) {
    showToast(error.message);
    return;
  }
  const root = document.documentElement;
  root.style.setProperty("--brand-primary", kit.colors.primary.base);
  root.style.setProperty("--brand-secondary", kit.colors.secondary.base);
  root.style.setProperty("--brand-accent", kit.colors.accent.base);
  root.style.setProperty("--brand-bg", previewDark ? "#17162D" : "#FFFFFF");
  root.style.setProperty("--brand-fg", previewDark ? "#F8F6EF" : kit.colors.neutral[900] || "#17162D");
  root.style.setProperty("--shadow-md", kit.shadow.md);
  root.style.setProperty("--radius-md", kit.radius.md);
  document.querySelectorAll("#hero-brand,#app-title,#card-brand,#component-brand,#guideline-name").forEach((element) => {
    if (element.id === "hero-brand" || element.id === "card-brand" || element.id === "component-brand" || element.id === "guideline-name") element.textContent = kit.brief.name;
  });
  $("#social-brand").textContent = kit.brief.name.split(/\s+/).map((word)=>word[0]).join("").slice(0,3).toUpperCase();
  $("#card-role").textContent = kit.brief.industry;
  $("#hero-description").textContent = `A considered ${kit.brief.industry.toLowerCase()} identity for ${kit.brief.personality.join(", ")} choices.`;
  $("#voice-list").innerHTML = kit.voice.rules.map((rule)=>`<li>${escapeHtml(rule)}</li>`).join("");
  $("#guideline-colors").innerHTML = [
    kit.colors.primary.base,kit.colors.secondary.base,kit.colors.accent.base,
    kit.colors.neutral[100],kit.colors.neutral[900]
  ].map((color)=>`<i style="background:${color}" title="${color}"></i>`).join("");
  $("#guideline-type").innerHTML = `<strong style="font-family:'${kit.typography.heading}',serif;font-size:${kit.typography.scale.xl}px">${kit.typography.heading}</strong><p style="font-family:'${kit.typography.body}',sans-serif">With ${kit.typography.body} for clear, everyday reading.</p>`;
  const tokenSummary={name:kit.brief.name,colors:kit.colors,typography:kit.typography,spacing:kit.spacing,radius:kit.radius,shadow:kit.shadow,voice:kit.voice};
  $("#token-json").textContent = JSON.stringify(tokenSummary,null,2);
  $("#token-count").textContent = `${countTokens(tokenSummary)} tokens`;
  document.querySelectorAll(".landing-mockup,.mobile-mockup,.card-mockup,.social-mockup,.component-sheet").forEach((element)=>{
    element.classList.toggle("dark-preview",previewDark);
  });
  applyPresetState();
}

function escapeHtml(value) {
  const span=document.createElement("span");
  span.textContent=value;
  return span.innerHTML;
}

function countTokens(value) {
  if (typeof value !== "object" || value === null) return 1;
  return Object.values(value).reduce((count,item)=>count+(typeof item==="object"?countTokens(item):1),0);
}

function buildPresets() {
  const list=$("#preset-list");
  list.innerHTML="";
  PRESETS.forEach((preset,index)=>{
    const button=document.createElement("button");
    button.type="button";
    button.className="preset";
    button.title=preset.name;
    button.dataset.index=index;
    button.setAttribute("aria-label",`Start from ${preset.name} theme`);
    button.innerHTML=preset.colors.map((color)=>`<i style="background:${color}"></i>`).join("");
    button.addEventListener("click",()=>{
      lockedBase=null;
      shuffleOffset=0;
      preset.colors.forEach((color,i)=>{
        if(i===0) { $("#base-color").value=color; $("#base-hex").value=color; }
      });
      render();
    });
    list.appendChild(button);
  });
}

function applyPresetState() {
  const active=PRESETS.findIndex((preset)=>preset.colors[0].toUpperCase()===$("#base-hex").value.trim().toUpperCase());
  document.querySelectorAll(".preset").forEach((button,index)=>button.classList.toggle("active",index===active));
}

$("#brief-form").addEventListener("submit",(event)=>{
  event.preventEvent?.();
  event.preventDefault();
  shuffleOffset=0;
  lockedBase=null;
  render();
});

document.querySelectorAll(".chip").forEach((chip)=>{
  chip.addEventListener("click",()=>{
    const active=document.querySelectorAll(".chip.active");
    if(chip.classList.contains("active")) {
      chip.classList.remove("active");
    } else if(active.length<3) {
      chip.classList.add("active");
    } else {
      showToast("Choose exactly three personality keywords");
    }
  });
});

document.querySelectorAll(".ratio-options button").forEach((button)=>{
  button.addEventListener("click",()=>{
    document.querySelectorAll(".ratio-options button").forEach((item)=>item.classList.remove("active"));
    button.classList.add("active");
    ratio=Number(button.dataset.ratio);
    render();
  });
});

$("#base-color").addEventListener("input",(event)=>{
  $("#base-hex").value=event.target.value.toUpperCase();
  lockedBase=event.target.value.toUpperCase();
  render();
});
$("#base-hex").addEventListener("change",(event)=>{
  const value=event.target.value.trim();
  if(/^#[0-9a-f]{6}$/i.test(value)){
    $("#base-color").value=value;
    lockedBase=value.toUpperCase();
    render();
  }
});

$("#shuffle-button").addEventListener("click",()=>{
  shuffleOffset+=1;
  const brief=readBrief();
  if(lockedBase) brief.baseColor=lockedBase;
  try {
    kit=generateBrandKit(brief,shuffleOffset);
  } catch(error){showToast(error.message);return;}
  $("#base-hex").value=kit.colors.primary.base;
  $("#base-color").value=kit.colors.primary.base;
  render();
});

$("#theme-toggle").addEventListener("click",()=>{
  previewDark=!previewDark;
  $("#theme-toggle").setAttribute("aria-pressed",String(previewDark));
  render();
});

document.querySelectorAll(".tab").forEach((tab)=>{
  tab.addEventListener("click",()=>{
    document.querySelectorAll(".tab").forEach((item)=>item.classList.remove("active"));
    document.querySelectorAll(".preview-view").forEach((item)=>item.classList.remove("active"));
    tab.classList.add("active");
    $(`#${tab.dataset.view}-view`).classList.add("active");
  });
});

const dialog=$("#export-dialog");
$("#export-button").addEventListener("click",()=>dialog.showModal());
document.querySelectorAll(".export-grid button").forEach((button)=>{
  button.addEventListener("click",()=>exportKit(button.dataset.format));
});

function download(filename,content,type="text/plain") {
  const url=URL.createObjectURL(new Blob([content],{type}));
  const link=document.createElement("a");
  link.href=url;
  link.download=filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copy(text,message="Copied to clipboard") {
  try { await navigator.clipboard.writeText(text); showToast(message); }
  catch { showToast("Clipboard unavailable"); }
}

function exportKit(format) {
  if(!kit){dialog.close();showToast("Generate a brand kit first");return;}
  const base=kit.brief.name.replace(/[^a-z0-9]+/gi,"-").toLower();
  if(format==="css") download(`${base}-tokens.css`,toCss(kit),"text/css");
  if(format==="tailwind") download(`${base}-tailwind.config.js`,`export default ${JSON.stringify(toTailwind(kit),null,2)};\n`,"text/javascript");
  if(format==="dtcg") download(`${base}-dtcg.json`,JSON.stringify(toDTCG(kit),null,2),"application/json");
  if(format==="figma") download(`${base}-figma-variables.json`,JSON.stringify(toFigmaVariables(kit),null,2),"application/json");
  if(format==="guidelines") download(`${base}-brand-guidelines.html`,guidelinesHtml(kit),"text/html");
  if(format==="share") copy(`${location.origin}${location.pathname}?brief=${encodeBrief(kit.brief)}`,"Shareable brief link copied");
  dialog.close();
}

function guidelinesHtml(kit) {
  const swatches=Object.entries(kit.colors.primary.scale).map(([step,color])=>`<div><i style="background:${color}"></i><span>${step}<br>${color}</span></div>`).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(kit.brief.name)} Brand Guidelines</title><style>@page{size:A4;margin:16mm}body{font-family:Arial,sans-serif;color:#17162d;max-width:210mm;margin:auto;padding:16mm}.cover{min-height:160mm;display:flex;flex-direction:column;justify-content:space-between;border:1px solid #ccc;padding:16mm}.cover h1{font-family:Georgia,serif;font-size:56pt;margin:0}.eyebrow{font-size:10pt;letter-spacing:.16em}section{break-before:page;padding-top:12mm}h2{font-family:Georgia,serif;font-size:32pt}.palette{display:grid;grid-template-columns:repeat(10,1fr)}.palette div i{display:block;height:34mm}.palette span{font-size:8pt}.rule{border-top:1px solid #ccc;padding:8mm 0}.do{color:#1f7a4c}.dont{color:#b42318}@media print{.cover{break-after:page}}</style></head><body><div class="cover"><span class="eyebrow">BRAND GUIDELINES / ${escapeHtml(kit.brief.industry.toUpperCase())}</span><h1>${escapeHtml(kit.brief.name)}</h1><p>${escapeHtml(kit.brief.personality.join(" · "))}<br>${escapeHtml(kit.brief.market)}</p></div><section><h2>Brand voice</h2>${kit.voice.rules.map((rule)=>`<div class="rule">${escapeHtml(rule)}</div>`).join("")}${kit.voice.examples.map((example)=>`<p class="do"><b>Do:</b> ${escapeHtml(example.do)}</p><p class="dont"><b>Don't:</b> ${escapeHtml(example.dont)}</p>`).join("")}</section><section><h2>Color palette</h2><div class="palette">${swatches}</div></section><section><h2>Typography</h2><h3 style="font-family:'${kit.typography.heading}',Georgia;font-size:48pt">${kit.typography.heading}</h3><p style="font-family:'${kit.typography.body}',Arial;font-size:16pt">${kit.typography.body} for clear, consistent reading.</p></section></body></html>`;
}

function showToast(message) {
  const toast=$("#toast");
  toast.textContent=message;
  toast.classList.add("visible");
  setTimeout(()=>toast.classList.remove("visible"),1800);
}

function loadSharedBrief() {
  const encoded=new URLSearchParams(location.search).get("brief");
  if(!encoded)return;
  try{
    const brief=decodeBrief(encoded);
    $("#brand-name").value=brief.name||"North & Salt";
    $("#industry").value=brief.industry||"Technology";
    $("#market").value=brief.market||"Global";
    $("#base-hex").value=brief.baseColor||"#336BFF";
    $("#base-color").value=brief.baseColor||"#336BFF";
    $("#mode").value=brief.mode||"light";
    ratio=brief.ratio||1.25;
    document.querySelectorAll(".chip").forEach((chip)=>chip.classList.toggle("active",(brief.personality||[]).includes(chip.dataset.value)));
    document.querySelectorAll(".ratio-options button").forEach((button)=>button.classList.toggle("active",Number(button.dataset.ratio)===ratio));
  }catch{showToast("This share link could not be read");}
}

buildPresets();
loadSharedBrief();
render();
