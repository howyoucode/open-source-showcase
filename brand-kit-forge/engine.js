export const PRESETS = [
  { name:"Cobalt", colors:["#336BFF","#7D68DB","#F1B95B"] },
  { name:"Terracotta", colors:["#B85C38","#526D82","#E4C988"] },
  { name:"Sage", colors:["#587D71","#A3B18A","#E9C46A"] },
  { name:"Ink", colors:["#252B4A","#7F86AC","#F0A4A4"] },
  { name:"Palm", colors:["#167D69","#73A580","#F4D35E"] },
  { name:"Ember", colors:["#C74B50","#D97745","#F2C14E"] },
  { name:"Violet", colors:["#6750A4","#AA96DA","#F59FBB"] },
  { name:"Aqua", colors:["#167C80","#55A7A1","#F3C969"] },
  { name:"Mineral", colors:["#4C667F","#8899A6","#D4A373"] },
  { name:"Rose", colors:["#A14E59","#C58A98","#EFCB78"] },
];

export const FONT_PAIRS = {
  calm: ["Newsreader","Source Sans 3"],
  premium: ["Cormorant Garamond","Manrope"],
  bold: ["Archivo Black","Archivo"],
  playful: ["Fraunces","DM Sans"],
  precise: ["IBM Plex Serif","IBM Plex Sans"],
  warm: ["Lora","Nunito Sans"],
};

export function fnv1a(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seedText) {
  let seed = fnv1a(seedText);
  return () => {
    seed += 0x6D2B79F5;
    let value = seed;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function normalizeHex(hex) {
  let value = String(hex || "").trim().replace("#","");
  if (/^[0-9a-f]{3}$/i.test(value)) value = value.split("").map((c)=>c+c).join("");
  if (!/^[0-9a-f]{6}$/i.test(value)) throw new Error("Enter a valid 6-digit hex color.");
  return `#${value.toUpperCase()}`;
}

export function hexToRgb(hex) {
  const value = normalizeHex(hex).slice(1);
  return [0,2,4].map((offset)=>parseInt(value.slice(offset,offset+2),16));
}

export function rgbToHex(rgb) {
  return `#${rgb.map((value)=>Math.round(Math.max(0,Math.min(255,value))).toString(16).padStart(2,"0")).join("")}`.toUpperCase();
}

export function rgbToHsl([r,g,b]) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0;
  const l=(max+min)/2;
  if (max!==min) {
    const d=max-min;
    s=l>.5?d/(2-max-min):d/(max+min);
    if(max===r) h=(g-b)/d+(g<b?6:0);
    else if(max===g) h=(b-r)/d+2;
    else h=(r-g)/d+4;
    h*=60;
  }
  return [h,s*100,l*100];
}

export function hslToRgb([h,s,l]) {
  s/=100; l/=100;
  const c=(1-Math.abs(2*l-1))*s;
  const x=c*(1-Math.abs((h/60)%2-1));
  const m=l-c/2;
  let r=0,g=0,b=0;
  if(h<60){r=c;g=x}else if(h<120){r=x;g=c}else if(h<180){g=c;b=x}else if(h<240){g=x;b=c}else if(h<300){r=x;b=c}else{r=c;b=x}
  return [(r+m)*255,(g+m)*255,(b+m)*255];
}

export function hexToHsl(hex){ return rgbToHsl(hexToRgb(hex)); }
export function hslToHex(hsl){ return rgbToHex(hslToRgb(hsl)); }

export function generateScale(hex) {
  const normalized=normalizeHex(hex);
  const [h,s]=hexToHsl(normalized);
  const lightness=[97,93,86,76,65,53,43,35,27,18];
  return {
    50:hslToHex([h,Math.max(s*.32,12),lightness[0]]),
    100:hslToHex([h,Math.max(s*.45,18),lightness[1]]),
    200:hslToHex([h,Math.max(s*.58,24),lightness[2]]),
    300:hslToHex([h,Math.max(s*.68,28),lightness[3]]),
    400:hslToHex([h,s,lightness[4]]),
    500:normalized,
    600:hslToHex([h,s,lightness[6]]),
    700:hslToHex([h,s*.96,lightness[7]]),
    800:hslToHex([h,s*.88,lightness[8]]),
    900:hslToHex([h,s*.75,lightness[9]])
  };
}

export function relativeLuminance(hex) {
  const rgb=hexToRgb(hex).map((channel)=>{
    const value=channel/255;
    return value<=0.04045?value/12.92:Math.pow((value+0.055)/1.055,2.4);
  });
  return rgb[0]*0.2126+rgb[1]*0.7152+rgb[2]*0.0722;
}

export function contrastRatio(a,b) {
  const first=relativeLuminance(a), second=relativeLuminance(b);
  return (Math.max(first,second)+0.05)/(Math.min(first,second)+0.05);
}

export function wcagLevel(ratio) {
  if(ratio>=7) return "AAA";
  if(ratio>=4.5) return "AA";
  if(ratio>=3) return "AA Large";
  return "Fail";
}

export function autoFixPair(textHex,backgroundHex,minimum=4.5) {
  if(contrastRatio(textHex,backgroundHex)>=minimum) return normalizeHex(textHex);
  const [h,s,l]=hexToHsl(textHex);
  const backgroundLight=relativeLuminance(backgroundHex)>.5;
  let candidate=l;
  for(let step=0;step<=100;step++){
    candidate=backgroundLight?Math.max(0,l-step*.01):Math.min(100,l+step*.01);
    const fixed=hslToHex([h,s,candidate]);
    if(contrastRatio(fixed,backgroundHex)>=minimum) return fixed;
  }
  return backgroundLight?"#000000":"#FFFFFF";
}

export function typeScale(base=16,ratio=1.25) {
  if(![1.2,1.25,1.333].includes(Number(ratio))) throw new Error("Unsupported type ratio.");
  return {
    xs:Math.round(base/Math.pow(ratio,1)),
    sm:base,
    md:Math.round(base*ratio),
    lg:Math.round(base*Math.pow(ratio,2)),
    xl:Math.round(base*Math.pow(ratio,3)),
    xxl:Math.round(base*Math.pow(ratio,4))
  };
}

export function briefSeed(brief) {
  return [brief.name,brief.industry,brief.market,...brief.personality,brief.baseColor,brief.mode].join("|");
}

export function generateBrandKit(brief, shuffleOffset=0) {
  const personality=[...brief.personality].slice(0,3);
  if(personality.length===0) throw new Error("Choose at least one personality keyword.");
  const seed=briefSeed({...brief,personality});
  const random=seededRandom(seed+`|${shuffleOffset}`);
  const primary=normalizeHex(brief.baseColor||PRESETS[Math.floor(random()*PRESETS.length)].colors[0]);
  const [h,s,l]=hexToHsl(primary);
  const secondary=hslToHex([(h+35+random()*45)%360,Math.max(35,s*.75),Math.min(68,Math.max(42,l))]);
  const accent=hslToHex([(h+135+random()*55)%360,Math.min(85,Math.max(50,s*.8)),68]);
  const neutralPreset={50:"#FAFAF8",100:"#F1F0EB",200:"#DAD7CF",300:"#B9B5AA",400:"#8D897F",500:"#68655F",600:"#504D48",700:"#383631",800:"#272621",900:"#171712"};
  const semantic={
    success:"#1F7A4C",warning:"#B7791F",error:"#B42318",info:"#1D64B7"
  };
  const pairKey=personality[0];
  const [heading,body]=FONT_PAIRS[pairKey]||FONT_PAIRS.calm;
  const type=typeScale(16,brief.ratio||1.25);
  const autoFix={
    primaryOnWhite:autoFixPair(primary,"#FFFFFF"),
    whiteOnPrimary:autoFixPair("#FFFFFF",primary),
  };
  const voice=generateVoice(personality);
  const contrastPairs=[
    {name:"Primary text",foreground:neutralPreset[900],background:primary},
    {name:"Primary surface",foreground:"#FFFFFF",background:primary},
    {name:"Secondary text",foreground:neutralPreset[900],background:secondary},
    {name:"Accent text",foreground:neutralPreset[900],background:accent},
    {name:"Neutral body",foreground:neutralPreset[900],background:neutralPreset[50]},
  ].map((pair)=>{
    const ratio=contrastRatio(pair.foreground,pair.background);
    const autoFixed=autoFixPair(pair.foreground,pair.background,ratio>=7?7:4.5);
    const finalRatio=contrastRatio(autoFixed,pair.background);
    return {...pair,originalRatio:ratio,foreground:autoFixed,ratio:finalRatio,level:wcagLevel(finalRatio),fixed:autoFixed.toUpperCase()!==pair.foreground.toUpperCase()};
  });
  return {
    brief:{...brief,personality},
    seed,
    colors:{
      primary:{base:primary,scale:generateScale(primary)},
      secondary:{base:secondary,scale:generateScale(secondary)},
      accent:{base:accent,scale:generateScale(accent)},
      neutral:neutralPreset,
      semantic
    },
    contrast:{
      primaryOnWhite:{foreground:autoFix.primaryOnWhite,background:"#FFFFFF",ratio:contrastRatio(autoFix.primaryOnWhite,"#FFFFFF"),level:wcagLevel(contrastRatio(autoFix.primaryOnWhite,"#FFFFFF"))},
      whiteOnPrimary:{foreground:"#FFFFFF",background:autoFix.whiteOnPrimary,ratio:contrastRatio("#FFFFFF",autoFix.whiteOnPrimary),level:wcagLevel(contrastRatio("#FFFFFF",autoFix.whiteOnPrimary))},
      pairs:contrastPairs
    },
    typography:{heading,body,ratio:Number(brief.ratio||1.25),scale:type},
    spacing:{unit:4,scale:{1:4,2:8,3:12,4:16,5:24,6:32,8:64}},
    radius:{none:"0px",sm:"4px",md:"12px",lg:"20px",pill:"999px"},
    shadow:{sm:"0 2px 8px rgba(23,22,45,.08)",md:"0 12px 30px rgba(23,22,45,.12)",lg:"0 24px 60px rgba(23,22,45,.18)"},
    voice
  };
}

export function generateVoice(personality) {
  const map={
    calm:["Lead with reassurance.","Use short, spacious sentences.","Replace urgency with clarity."],
    premium:["Use precise, considered language.","Favor restraint over exaggeration.","Make quality feel self-evident."],
    bold:["Be direct and decisive.","Use energetic verbs.","Do not soften the point unnecessarily."],
    playful:["Use warm, human phrasing.","Add one surprising detail.","Keep wit useful, never distracting."],
    precise:["Name facts and outcomes.","Define terms once, then stay consistent.","Avoid vague promises."],
    warm:["Speak as a trusted guide.","Acknowledge real context.","Choose inclusive, familiar words."]
  };
  const rules=[];
  personality.forEach((word)=>{
    (map[word]||map.calm).slice(0,1).forEach((rule)=>rules.push(rule));
  });
  while(rules.length<3) rules.push(map.calm[rules.length]);
  return {
    rules:rules.slice(0,3),
    examples:[
      {do:"Create a calm, specific next step.",dont:"Act now before you miss out!"},
      {do:"Explain what changes for the customer.",dont:"Our revolutionary, best-in-class solution."},
      {do:"Keep the language useful and human.",dont:"Leverage a robust ecosystem to synergize."}
    ]
  };
}

export function toCss(kit) {
  const lines=[":root {"];
  Object.entries(kit.colors.primary.scale).forEach(([key,value])=>lines.push(`  --color-primary-${key}: ${value};`));
  Object.entries(kit.colors.secondary.scale).forEach(([key,value])=>lines.push(`  --color-secondary-${key}: ${value};`));
  Object.entries(kit.colors.accent.scale).forEach(([key,value])=>lines.push(`  --color-accent-${key}: ${value};`));
  Object.entries(kit.colors.neutral).forEach(([key,value])=>lines.push(`  --color-neutral-${key}: ${value};`));
  Object.entries(kit.colors.semantic).forEach(([key,value])=>lines.push(`  --color-${key}: ${value};`));
  Object.entries(kit.typography.scale).forEach(([key,value])=>lines.push(`  --font-size-${key}: ${value}px;`));
  Object.entries(kit.spacing.scale).forEach(([key,value])=>lines.push(`  --space-${key}: ${value}px;`));
  Object.entries(kit.radius).forEach(([key,value])=>lines.push(`  --radius-${key}: ${value};`));
  Object.entries(kit.shadow).forEach(([key,value])=>lines.push(`  --shadow-${key}: ${value};`));
  lines.push(`  --font-heading: "${kit.typography.heading}", serif;`,`  --font-body: "${kit.typography.body}", sans-serif;`,`}`);
  return lines.join("\n");
}

export function toTailwind(kit) {
  return {
    theme:{
      extend:{
        colors:{
          primary:kit.colors.primary.scale,
          secondary:kit.colors.secondary.scale,
          accent:kit.colors.accent.scale,
          neutral:kit.colors.neutral,
          ...kit.colors.semantic
        },
        fontFamily:{heading:[kit.typography.heading,"serif"],body:[kit.typography.body,"sans-serif"]},
        spacing:Object.fromEntries(Object.entries(kit.spacing.scale).map(([k,v])=>[k,`${v}px`])),
        borderRadius:kit.radius,
        boxShadow:kit.shadow
      }
    }
  };
}

export function toDTCG(kit) {
  const token=(value,type)=>({$value:value,$type:type});
  const output={$schema:"https://design-tokens.github.io/community-group/format/","brand":token(kit.brief.name,"string")};
  ["primary","secondary","accent"].forEach((role)=>{
    output[`color.${role}`]={};
    Object.entries(kit.colors[role].scale).forEach(([step,value])=>output[`color.${role}`][step]=token(value,"color"));
  });
  output["color.neutral"]={};
  Object.entries(kit.colors.neutral).forEach(([step,value])=>output["color.neutral"][step]=token(value,"color"));
  Object.entries(kit.colors.semantic).forEach((([name,value])=>output[`color.${name}`]=token(value,"color")));
  Object.entries(kit.typography.scale).forEach(([name,value])=>output[`type.size.${name}`]=token(`${value}px`,"dimension"));
  output["type.font.heading"]=token(kit.typography.heading,"fontFamily");
  output["type.font.body"]=token(kit.typography.body,"fontFamily");
  Object.entries(kit.spacing.scale).forEach(([name,value])=>output[`space.${name}`]=token(`${value}px`,"dimension"));
  Object.entries(kit.radius).forEach(([name,value])=>output[`radius.${name}`]=token(value,"dimension"));
  return output;
}

export function toFigmaVariables(kit) {
  const variables={};
  ["primary","secondary","accent"].forEach((role)=>{
    variables[role]={};
    Object.entries(kit.colors[role].scale).forEach(([step,value])=>variables[role][step]={type:"COLOR",value});
  });
  Object.entries(kit.colors.neutral).forEach(([step,value])=>variables[`neutral/${step}`]={type:"COLOR",value});
  Object.entries(kit.colors.semantic).forEach(([name,value])=>variables[`semantic/${name}`]={type:"COLOR",value});
  Object.entries(kit.typography.scale).forEach(([name,value])=>variables[`type/size/${name}`]={type:"FLOAT",value});
  return {name:kit.brief.name,variables,collections:{Brand:{modes:["Light","Dark"],defaultMode:"Light"}}};
}

export function encodeBrief(brief) {
  return encodeURIComponent(JSON.stringify(brief));
}

export function decodeBrief(encoded) {
  return JSON.parse(decodeURIComponent(encoded));
}
