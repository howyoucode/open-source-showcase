export const categories = ["Features", "Audience", "Challenge", "Outcomes"];
import { Spring, project, rubberband } from "../shared/design-system/spring.js";

export function extractTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  if (!clean) return "Untitled idea";
  const words = clean.split(" ");
  return words.slice(0, 7).join(" ").replace(/[.!?]+$/, "") + (words.length > 7 ? "..." : "");
}

export function buildMindMap(text, detailed = false) {
  const clean = text.trim();
  if (!clean) throw new Error("Describe an idea before generating a map.");
  const lower = clean.toLowerCase();
  const root = { id: "root", type: "root", title: extractTitle(clean), detail: "", x: 500, y: 300 };
  const childDetails = [
    ["Features", "Core capabilities", ["Deliver the primary user action", "Keep the experience simple and useful"]],
    ["Audience", "Who it serves", ["Identify the primary users", "Match needs with real context"]],
    ["Challenge", "What to solve", ["Surface the biggest constraint", "Remove friction and uncertainty"]],
    ["Outcomes", "How success looks", ["Define measurable progress", "Create a lasting benefit"]],
  ];
  const nodes = [root];
  const edges = [];
  childDetails.forEach(([category, detail, tips], index) => {
    const angle = -Math.PI / 2 + index * (Math.PI / 2);
    const id = `node-${index + 1}`;
    nodes.push({
      id,
      type: "primary",
      category,
      title: category,
      detail,
      x: 500 + Math.cos(angle) * 260,
      y: 300 + Math.sin(angle) * 180,
      sourceText: clean,
    });
    edges.push({ from: "root", to: id });

    if (detailed) {
      tips.forEach((tip, tipIndex) => {
        const leafId = `${id}-${tipIndex + 1}`;
        nodes.push({
          id: leafId,
          type: "leaf",
          title: tip,
          detail: category === "Challenge" && lower.includes("cost") ? "Consider cost and constraints" : "",
          x: 500 + Math.cos(angle) * (390 + tipIndex * 10),
          y: 300 + Math.sin(angle) * (260 + tipIndex * 18) + (tipIndex === 0 ? -45 : 45),
        });
        edges.push({ from: id, to: leafId });
      });
    }
  });
  return { title: root.title, nodes, edges };
}

export function toMermaid(map) {
  const names = new Map(map.nodes.map((node) => [node.id, node.title.replace(/["[\]()]/g, "")]));
  const lines = ["mindmap", `  root((${names.get("root")}))`];
  map.edges.forEach((edge) => {
    if (edge.from === "root") lines.push(`    ${names.get(edge.to)}["${names.get(edge.to)}"]`);
  });
  map.edges.forEach((edge) => {
    if (edge.from !== "root") lines.push(`      ${names.get(edge.to)}["${names.get(edge.to)}"]`);
  });
  return lines.join("\n");
}

export function toFigmaPayload(map) {
  return {
    name: map.title,
    type: "FRAME",
    width: 1040,
    height: 680,
    backgroundColor: "#F8F6F0",
    children: map.nodes.map((node) => ({
      name: node.title,
      type: "NODE",
      width: node.type === "root" ? 210 : 170,
      height: node.type === "leaf" ? 76 : 58,
      x: node.x - (node.type === "root" ? 105 : 85),
      y: node.y - 29,
      fill: node.type === "root" ? "#17162D" : "#FFFFFF",
      textColor: node.type === "root" ? "#FFFFFF" : "#17162D",
      detail: node.detail || "",
    })),
  };
}

if (typeof document !== "undefined") {
const canvas = document.querySelector("#canvas");
const nodesLayer = document.querySelector("#nodes");
const svg = document.querySelector("#connections");
const ideaInput = document.querySelector("#idea-input");
const mapTitle = document.querySelector("#map-title");
const emptyState = document.querySelector("#empty-state");
let currentMap = null;
let history = [];
let historyIndex = -1;
let zoom = 1;
let depth = "balanced";
let pan = { x: 0, y: 0 };

function snapshot() {
  history = history.slice(0, historyIndex + 1);
  history.push(JSON.stringify(currentMap));
  historyIndex = history.length - 1;
  updateUndoButtons();
}

function restore(index) {
  if (index < 0 || index >= history.length) return;
  historyIndex = index;
  currentMap = JSON.parse(history[index]);
  render();
  updateUndoButtons();
}

function updateUndoButtons() {
  document.querySelector("#undo-button").disabled = historyIndex <= 0;
  document.querySelector("#redo-button").disabled = historyIndex >= history.length - 1;
}

function render() {
  nodesLayer.innerHTML = "";
  svg.innerHTML = "";
  if (!currentMap) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  mapTitle.textContent = currentMap.title;
  const rect = canvas.getBoundingClientRect();
  svg.setAttribute("viewBox", `0 0 ${rect.width} ${rect.height}`);

  currentMap.nodes.forEach((node) => {
    const element = document.createElement("article");
    element.className = `node ${node.type}`;
    if (node.category) element.dataset.category = node.category;
    element.dataset.id = node.id;
    element.style.left = `${node.x * zoom}px`;
    element.style.top = `${node.y * zoom}px`;
    element.innerHTML = `<span class="node-title">${escapeHtml(node.title)}</span>${node.detail ? `<span class="node-detail">${escapeHtml(node.detail)}</span>` : ""}`;
    element.addEventListener("pointerdown", startDrag);
    nodesLayer.appendChild(element);
  });

  currentMap.edges.forEach((edge) => {
    const from = currentMap.nodes.find((node) => node.id === edge.from);
    const to = currentMap.nodes.find((node) => node.id === edge.to);
    if (!from || !to) return;
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", from.x * zoom);
    line.setAttribute("y1", from.y * zoom);
    line.setAttribute("x2", to.x * zoom);
    line.setAttribute("y2", to.y * zoom);
    line.setAttribute("stroke", "#aaa69a");
    line.setAttribute("stroke-width", "1.5");
    svg.appendChild(line);
  });
}

function escapeHtml(value) {
  const span = document.createElement("span");
  span.textContent = value;
  return span.innerHTML;
}

function startDrag(event) {
  if (event.button !== 0) return;
  const element = event.currentTarget;
  const node = currentMap.nodes.find((item) => item.id === element.dataset.id);
  element.setPointerCapture(event.pointerId);
  const grabOffset = { x: event.clientX - element.getBoundingClientRect().left - element.offsetWidth / 2, y: event.clientY - element.getBoundingClientRect().top - element.offsetHeight / 2 };
  let history = [{ x: event.clientX, y: event.clientY, time: performance.now() }];
  let active = false;
  const canvasRect = canvas.getBoundingClientRect();
  element.classList.add("selected");
  const move = (moveEvent) => {
    const dx = moveEvent.clientX - history[0].x;
    const dy = moveEvent.clientY - history[0].y;
    if (!active && Math.hypot(dx, dy) < 10) return;
    active = true;
    node.x = (moveEvent.clientX - canvasRect.left - grabOffset.x) / zoom;
    node.y = (moveEvent.clientY - canvasRect.top - grabOffset.y) / zoom;
    node.x = Math.max(-rubberband(Math.max(0, -node.x), canvasRect.width), Math.min(canvasRect.width + rubberband(Math.max(0,node.x-canvasRect.width),canvasRect.width),node.x));
    node.y = Math.max(-rubberband(Math.max(0,-node.y),canvasRect.height),Math.min(canvasRect.height+rubberband(Math.max(0,node.y-canvasRect.height),canvasRect.height),node.y));
    history.push({ x: moveEvent.clientX, y: moveEvent.clientY, time: performance.now() });
    history = history.slice(-6);
    render();
  };
  const stop = () => {
    if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId);
    if (active) {
      const first = history[0];
      const last = history.at(-1);
      const vx = ((last.x-first.x)/Math.max(1,last.time-first.time))*1000;
      const vy = ((last.y-first.y)/Math.max(1,last.time-first.time))*1000;
      const spring = new Spring([node.x,node.y],[node.x+project(vx)/zoom,node.y+project(vy)/zoom],[vx/zoom,vy/zoom],"momentum");
      const animate=()=>{spring.step(1/60);node.x=spring.x;node.y=spring.y;render();if(!spring.settled)requestAnimationFrame(animate)};
      requestAnimationFrame(animate);
    }
    element.removeEventListener("pointermove", move);
    element.removeEventListener("pointerup", stop);
    snapshot();
  };
  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", stop);
}

document.querySelector("#generate-button").addEventListener("click", () => {
  try {
    currentMap = buildMindMap(ideaInput.value, depth === "detailed");
    history = [];
    historyIndex = -1;
    snapshot();
    render();
  } catch (error) {
    showToast(error.message);
  }
});

document.querySelectorAll(".option").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".option").forEach((option) => option.classList.remove("active"));
    button.classList.add("active");
    depth = button.dataset.depth;
  });
});

document.querySelector("#undo-button").addEventListener("click", () => restore(historyIndex - 1));
document.querySelector("#redo-button").addEventListener("click", () => restore(historyIndex + 1));
document.querySelector("#zoom-in").addEventListener("click", () => setZoom(Math.min(1.4, zoom + 0.1)));
document.querySelector("#zoom-out").addEventListener("click", () => setZoom(Math.max(0.6, zoom - 0.1)));
document.querySelector("#fit-button").addEventListener("click", () => setZoom(1));
function setZoom(value) {
  const bounded = value < 0.6 ? 0.6 - rubberband(0.6 - value, 300) : value > 1.4 ? 1.4 + rubberband(value - 1.4, 300) : value;
  zoom = bounded;
  document.querySelector("#zoom-label").textContent = `${Math.round(zoom * 100)}%`;
  render();
}

const dialog = document.querySelector("#export-dialog");
document.querySelector("#export-button").addEventListener("click", () => dialog.showModal());
document.querySelectorAll(".export-card").forEach((button) => {
  button.addEventListener("click", () => exportMap(button.dataset.format));
});

function download(filename, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copy(text) {
  await navigator.clipboard.writeText(text);
  showToast("Copied to clipboard");
}

function exportMap(format) {
  if (!currentMap) {
    dialog.close();
    showToast("Generate a map first");
    return;
  }
  const base = currentMap.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  if (format === "json") download(`${base}.json`, JSON.stringify(currentMap, null, 2), "application/json");
  if (format === "mermaid") copy(toMermaid(currentMap));
  if (format === "figma") copy(JSON.stringify(toFigmaPayload(currentMap), null, 2));
  if (format === "svg") download(`${base}.svg`, createSvg(currentMap), "image/svg+xml");
  dialog.close();
}

function createSvg(map) {
  const lines = map.edges.map((edge) => {
    const from = map.nodes.find((node) => node.id === edge.from);
    const to = map.nodes.find((node) => node.id === edge.to);
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#aaa69a"/>`;
  }).join("");
  const labels = map.nodes.map((node) => {
    const fill = node.type === "root" ? "#17162D" : "#FFFFFF";
    const color = node.type === "root" ? "#FFFFFF" : "#17162D";
    return `<rect x="${node.x - 85}" y="${node.y - 29}" width="${node.type === "root" ? 210 : 170}" height="58" rx="7" fill="${fill}" stroke="#17162D"/><text x="${node.x}" y="${node.y + 5}" text-anchor="middle" fill="${color}" font-family="sans-serif" font-size="13" font-weight="700">${escapeXml(node.title)}</text>`;
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="680" viewBox="0 0 1040 680"><rect width="100%" height="100%" fill="#F8F6F0"/>${lines}${labels}</svg>`;
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[char]);
}

function showToast(message) {
  const toast = document.querySelector("#toast");
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => toast.classList.remove("visible"), 1800);
}

new ResizeObserver(render).observe(canvas);
render();

canvas.addEventListener("pointerdown",(event)=>{
  if(event.target !== canvas && event.target !== svg) return;
  canvas.setPointerCapture(event.pointerId);
  const start={x:event.clientX,y:event.clientY};
  const history=[{...start,time:performance.now()}];
  let active=false;
  const move=(moveEvent)=>{
    const dx=moveEvent.clientX-start.x, dy=moveEvent.clientY-start.y;
    if(!active&&Math.hypot(dx,dy)<10)return;
    active=true;
    pan={x:pan.x+dx,y:pan.y+dy};
    start.x=moveEvent.clientX;start.y=moveEvent.clientY;
    nodesLayer.style.transform=`translate(${pan.x}px,${pan.y}px)`;
    svg.style.transform=`translate(${pan.x}px,${pan.y}px)`;
    history.push({x:moveEvent.clientX,y:moveEvent.clientY,time:performance.now()});
  };
  const stop=()=>{
    if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);
    canvas.removeEventListener("pointermove",move);
    canvas.removeEventListener("pointerup",stop);
  };
  canvas.addEventListener("pointermove",move);
  canvas.addEventListener("pointerup",stop);
});
}
