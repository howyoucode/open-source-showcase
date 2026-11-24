import { Spring, project, rubberband } from "./shared/design-system/spring.js";

const COLORS = {
  Creative: "#ff775f",
  Technical: "#66b9bd",
  Human: "#e7bf58",
  Strategy: "#9d86c0",
};

export const defaultSkills = [
  { name: "Design", category: "Creative", level: 3 },
  { name: "JavaScript", category: "Technical", level: 3 },
  { name: "Writing", category: "Creative", level: 2 },
  { name: "Research", category: "Human", level: 2 },
  { name: "Strategy", category: "Strategy", level: 2 },
];

export function createProjectIdea(skills, seed = Date.now()) {
  if (skills.length < 2) return null;
  const pick = (offset) => skills[(seed + offset * 43) % skills.length];
  const first = pick(1);
  const second = pick(2);
  const formats = ["an interactive field guide", "a community-powered toolkit", "a playful micro-experience", "a weekly experiment"];
  const audiences = ["curious beginners", "local creators", "remote teams", "young innovators"];
  return {
    title: `${first.name} x ${second.name}`,
    description: `Build ${formats[seed % formats.length]} that helps ${audiences[(seed + 2) % audiences.length]} solve a real problem by combining ${first.name.toLowerCase()} with ${second.name.toLowerCase()}.`,
    skills: [...new Set([first.name, second.name])],
  };
}

export function profileUrl(skills, location) {
  return `${location.origin}${location.pathname}?skills=${encodeURIComponent(JSON.stringify(skills))}`;
}

if (typeof document !== "undefined") {
  const form = document.querySelector("#skill-form");
  const nameInput = document.querySelector("#skill-name");
  const categoryInput = document.querySelector("#skill-category");
  const levelInput = document.querySelector("#skill-level");
  const count = document.querySelector("#skill-count");
  const canvas = document.querySelector("#mosaic-canvas");
  const ctx = canvas.getContext("2d");
  let skills = loadSkills();
    let drag = null;
    let nodePositions = new Map();

  function loadSkills() {
    const shared = new URLSearchParams(location.search).get("skills");
    if (shared) {
      try {
        const parsed = JSON.parse(shared);
        if (Array.isArray(parsed)) return parsed;
      } catch {}
    }
    try {
      const stored = JSON.parse(localStorage.getItem("skill-mosaic"));
      if (Array.isArray(stored)) return stored;
    } catch {}
    return defaultSkills;
  }

  function saveSkills() {
    localStorage.setItem("skill-mosaic", JSON.stringify(skills));
    count.textContent = skills.length;
    draw();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw();
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    if (!skills.length) {
      ctx.fillStyle = "#777";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Add your first skill", rect.width / 2, rect.height / 2);
      return;
    }

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 5]);
    skills.forEach((skill, index) => {
      const angle = (index / skills.length) * Math.PI * 2 - Math.PI / 2;
      const orbit = Math.min(rect.width, rect.height) * (0.22 + (skill.level || 2) * 0.035);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * orbit, centerY + Math.sin(angle) * orbit);
      ctx.strokeStyle = "rgba(9,11,22,.18)";
      ctx.stroke();
    });

    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#090b16";
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.font = "800 12px system-ui";
    ctx.fillText("YOU", centerX, centerY + 4);

    skills.forEach((skill, index) => {
      const angle = (index / skills.length) * Math.PI * 2 - Math.PI / 2;
      const orbit = Math.min(rect.width, rect.height) * (0.22 + (skill.level || 2) * 0.035);
      const key = skill.name;
      const live = nodePositions.get(key);
      const x = live?.x ?? centerX + Math.cos(angle) * orbit;
      const y = live?.y ?? centerY + Math.sin(angle) * orbit;
      const radius = 16 + (skill.level || 2) * 4;
      if (!live) nodePositions.set(key, { x, y });
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = COLORS[skill.category] || COLORS.Creative;
      ctx.fill();
      ctx.strokeStyle = "#090b16";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#090b16";
      ctx.font = "750 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(skill.name, x, y + radius + 18);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return;
    if (!skills.some((skill) => skill.name.toLowerCase() === name.toLowerCase())) {
      skills.push({ name, category: categoryInput.value, level: Number(levelInput.value) });
    }
    form.reset();
    saveSkills();
    nameInput.focus();
  });

  document.querySelector("#generate-button").addEventListener("click", () => {
    const idea = createProjectIdea(skills, Math.floor(Date.now() / 1000));
    const card = document.querySelector("#idea-card");
    if (!idea) {
      card.hidden = false;
      document.querySelector("#idea-title").textContent = "Add two skills first";
      document.querySelector("#idea-description").textContent = "Your combination lab needs at least two skills to begin.";
      document.querySelector("#idea-skills").innerHTML = "";
      return;
    }
    card.hidden = false;
    document.querySelector("#idea-title").textContent = idea.title;
    document.querySelector("#idea-description").textContent = idea.description;
    document.querySelector("#idea-skills").innerHTML = idea.skills.map((skill) => `<span>${skill}</span>`).join("");
  });

  document.querySelector("#share-button").addEventListener("click", async () => {
    const url = profileUrl(skills, location);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Profile link copied");
    } catch {
      showToast("Copy unavailable");
    }
  });

  function showToast(message) {
    const toast = document.querySelector("#toast");
    toast.textContent = message;
    toast.classList.add("visible");
    setTimeout(() => toast.classList.remove("visible"), 1800);
  }

  new ResizeObserver(resizeCanvas).observe(canvas);
  saveSkills();

  canvas.addEventListener("pointerdown", (event) => {
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const hit = [...nodePositions.entries()].find(([, position]) => Math.hypot(position.x - point.x, position.y - point.y) < 28);
    if (!hit) return;
    canvas.setPointerCapture(event.pointerId);
    drag = { name: hit[0], start: point, offset: { x: point.x - hit[1].x, y: point.y - hit[1].y }, history: [{ ...point, time: performance.now() }], active: false };
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const rect = canvas.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    if (!drag.active && Math.hypot(point.x - drag.start.x, point.y - drag.start.y) < 10) return;
    drag.active = true;
    const position = { x: point.x - drag.offset.x, y: point.y - drag.offset.y };
    nodePositions.set(drag.name, position);
    drag.history.push({ ...point, time: performance.now() });
    drag.history = drag.history.slice(-6);
    draw();
  });

  canvas.addEventListener("pointerup", (event) => {
    if (!drag) return;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (drag.active) {
      const history = drag.history;
      const first = history[0];
      const last = history.at(-1);
      const vx = ((last.x - first.x) / Math.max(1, last.time - first.time)) * 1000;
      const vy = ((last.y - first.y) / Math.max(1, last.time - first.time)) * 1000;
      const position = nodePositions.get(drag.name);
      const spring = new Spring([position.x, position.y], [position.x, position.y], [vx, vy], "momentum");
      const nearestX = position.x + project(vx);
      const nearestY = position.y + project(vy);
      spring.setTarget([nearestX, nearestY]);
      let frame;
      const animate = () => {
        spring.step(1 / 60);
        nodePositions.set(drag.name, { x: spring.x, y: spring.y });
        draw();
        if (!spring.settled) frame = requestAnimationFrame(animate);
      };
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(animate);
    }
    drag = null;
  });
}
