"use strict";

const $ = (id) => document.getElementById(id);
const state = { library: [], current: null, mode: "read", busy: false, selection: 0 };
const narrowWorkspace = window.matchMedia("(max-width: 1000px)");
let toastTimer;

async function api(path, options = {}) {
  if (window.location.protocol === "file:") {
    throw new Error("This is a file preview. Run Start Margin.command, then open http://127.0.0.1:8765 to use the app.");
  }
  const response = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let data;
  try { data = await response.json(); }
  catch { throw new Error("The local reader didn’t respond. Check that its terminal is still running."); }
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function feedback(message, kind = "") {
  $("feedback").hidden = !message;
  $("feedback").textContent = message;
  $("feedback").className = `feedback ${kind}`;
}

function toast(message) {
  clearTimeout(toastTimer);
  $("toast").textContent = message;
  $("toast").hidden = false;
  toastTimer = setTimeout(() => { $("toast").hidden = true; }, 3400);
}

function busy(value) {
  state.busy = value;
  $("extract-button").disabled = value;
  $("extract-button-text").textContent = value ? "Extracting…" : "Extract transcript";
  $("extract-arrow").hidden = value;
  $("workspace-state").textContent = value ? "Extracting captions…" : "Saved automatically to your library";
  document.querySelectorAll(".import-trigger").forEach((button) => { button.disabled = value; });
}

function timeLabel(seconds) {
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}` : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function remember(id) {
  try { if (id) localStorage.setItem("margin-current", id); else localStorage.removeItem("margin-current"); }
  catch { /* The app also works when browser storage is disabled. */ }
}

async function loadLibrary() {
  state.library = await api("/api/library");
  renderLibrary();
}

function renderLibrary() {
  const query = $("library-search").value.trim().toLocaleLowerCase();
  const items = state.library.filter((doc) => `${doc.title} ${doc.author} ${doc.language}`.toLocaleLowerCase().includes(query));
  $("library-count").textContent = state.library.length;
  const list = $("library-list");
  list.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "library-empty";
    const title = document.createElement("strong");
    title.textContent = query ? "No matching transcripts." : "No transcripts yet";
    const text = document.createElement("span");
    text.textContent = query ? "Try another title or author." : "Extract captions or import a transcript file.";
    empty.append(title, text);
    list.append(empty);
    return;
  }
  for (const doc of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "library-item" + (state.current?.id === doc.id ? " active" : "");
    if (state.current?.id === doc.id) button.setAttribute("aria-current", "true");
    const title = document.createElement("span");
    title.className = "library-item-title";
    title.textContent = doc.title;
    const meta = document.createElement("span");
    meta.className = "library-item-meta";
    meta.textContent = `${doc.reading_minutes} min read · ${doc.language_code === "und" ? "Imported" : doc.language}`;
    button.title = doc.title;
    button.append(title, meta);
    button.addEventListener("click", () => selectDocument(doc.id));
    list.append(button);
  }
}

async function selectDocument(id) {
  const selection = ++state.selection;
  try {
    const doc = await api(`/api/library/${encodeURIComponent(id)}`);
    if (selection !== state.selection) return;
    showDocument(doc);
    closeLibrary();
    feedback("");
  } catch (error) { toast(error.message); }
}

function showDocument(doc) {
  state.current = doc;
  state.mode = "read";
  document.body.classList.add("compact");
  $("welcome-bottom").hidden = true;
  $("reader").hidden = false;
  $("reader-title").textContent = doc.title;
  $("reader-author").textContent = doc.author;
  $("original-link").hidden = !doc.url;
  if (doc.url) $("original-link").href = doc.url;
  else $("original-link").removeAttribute("href");
  $("document-meta").replaceChildren();
  const facts = [`Est. reading time: ${doc.reading_minutes} min`, `${doc.word_count.toLocaleString()} words`, doc.language];
  if (doc.has_timestamps) facts.push(`Last caption: ${timeLabel(doc.duration)}`);
  for (const fact of facts) {
    const span = document.createElement("span");
    span.textContent = fact;
    $("document-meta").append(span);
  }
  $("source-note").textContent = doc.source === "import"
    ? "Source: imported file. Text has not been rewritten."
    : doc.is_generated
      ? "Source: automatically generated YouTube captions. Names and punctuation may contain errors. Text has not been rewritten."
      : "Source: manually created YouTube captions. Text has not been rewritten.";
  $("transcript-search").value = "";
  $("export-format").value = "";
  $("export-format").querySelector('[value="srt"]').disabled = !doc.has_timestamps;
  $("timeline-view").disabled = !doc.has_timestamps;
  $("video-url").value = doc.url || "";
  remember(doc.id);
  setMode("read");
  renderLibrary();
}

function newDocument() {
  ++state.selection;
  state.current = null;
  document.body.classList.remove("compact");
  $("welcome-bottom").hidden = false;
  $("reader").hidden = true;
  $("video-url").value = "";
  if (!state.busy) feedback("");
  remember(null);
  closeLibrary();
  renderLibrary();
  $("video-url").focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function readingGroups(segments) {
  const groups = [];
  let current = null;
  for (const segment of segments) {
    const gap = current ? segment.start - current.end : 0;
    if (!current || current.words >= 85 || (current.words >= 48 && /[.!?][”"']?$/.test(current.text)) || gap > 9) {
      current = { start: segment.start, end: segment.start + segment.duration, text: segment.text, words: segment.text.split(/\s+/).length };
      groups.push(current);
    } else {
      current.text += " " + segment.text;
      current.words += segment.text.split(/\s+/).length;
      current.end = Math.max(current.end, segment.start + segment.duration);
    }
  }
  return groups;
}

function highlightedText(parent, text, query) {
  if (!query) { parent.textContent = text; return; }
  const lower = text.toLocaleLowerCase();
  const search = query.toLocaleLowerCase();
  let cursor = 0;
  let index = lower.indexOf(search);
  while (index !== -1) {
    parent.append(document.createTextNode(text.slice(cursor, index)));
    const mark = document.createElement("mark");
    mark.textContent = text.slice(index, index + query.length);
    parent.append(mark);
    cursor = index + query.length;
    index = lower.indexOf(search, cursor);
  }
  parent.append(document.createTextNode(text.slice(cursor)));
}

function renderTranscript() {
  const doc = state.current;
  if (!doc) return;
  const content = $("transcript-content");
  content.replaceChildren();
  content.className = `transcript-content ${state.mode} ${doc.has_timestamps ? "" : "untimed"}`;
  const query = $("transcript-search").value.trim();
  const groups = state.mode === "timeline" || !doc.has_timestamps ? doc.segments : readingGroups(doc.segments);
  let matches = 0;
  const fragment = document.createDocumentFragment();
  for (const group of groups) {
    if (query && !group.text.toLocaleLowerCase().includes(query.toLocaleLowerCase())) continue;
    matches++;
    const row = document.createElement("div");
    row.className = "transcript-paragraph";
    if (doc.has_timestamps) {
      const stamp = document.createElement(doc.url ? "a" : "span");
      stamp.textContent = timeLabel(group.start);
      if (doc.url) {
        stamp.href = `${doc.url}&t=${Math.floor(group.start)}s`;
        stamp.target = "_blank";
        stamp.rel = "noopener noreferrer";
        stamp.title = `Open this moment on YouTube (${timeLabel(group.start)})`;
        stamp.setAttribute("aria-label", stamp.title);
      }
      row.append(stamp);
    }
    const paragraph = document.createElement("p");
    highlightedText(paragraph, group.text, query);
    row.append(paragraph);
    fragment.append(row);
  }
  if (!matches) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = `No passages containing “${query}”.`;
    fragment.append(empty);
  }
  content.append(fragment);
  $("search-count").textContent = query ? `${matches} ${matches === 1 ? "passage" : "passages"}` : "";
}

function setMode(mode) {
  state.mode = mode;
  for (const name of ["read", "timeline"]) {
    $(`${name}-view`).classList.toggle("active", mode === name);
    $(`${name}-view`).setAttribute("aria-pressed", String(mode === name));
  }
  renderTranscript();
}

$("extract-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.busy) return;
  const selection = ++state.selection;
  busy(true);
  feedback("Looking for captions on YouTube. This can take a little while.", "loading");
  try {
    const doc = await api("/api/extract", { method: "POST", body: JSON.stringify({ url: $("video-url").value.trim(), language: $("language").value }) });
    if (selection === state.selection) showDocument(doc);
    feedback("");
    await loadLibrary();
    toast(doc.cached ? "Opened from your local library." : "Transcript saved to your library.");
  } catch (error) { feedback(error.message, "error"); }
  finally { busy(false); }
});

$("new-transcript").addEventListener("click", newDocument);
function closeLibrary() {
  const wasOpen = document.body.classList.contains("nav-open");
  document.body.classList.remove("nav-open");
  $("sidebar-scrim").hidden = true;
  $("library-toggle").setAttribute("aria-expanded", "false");
  syncLibraryAccess();
  if (wasOpen) $("library-toggle").focus();
}
function syncLibraryAccess() {
  const opened = document.body.classList.contains("nav-open");
  $("sidebar").inert = narrowWorkspace.matches && !opened;
  document.querySelector("main").inert = narrowWorkspace.matches && opened;
}
$("library-toggle").addEventListener("click", () => {
  const opened = document.body.classList.toggle("nav-open");
  $("sidebar-scrim").hidden = !opened;
  $("library-toggle").setAttribute("aria-expanded", String(opened));
  syncLibraryAccess();
  if (opened) $("library-search").focus();
});
$("sidebar-scrim").addEventListener("click", closeLibrary);
$("sidebar-close").addEventListener("click", closeLibrary);
narrowWorkspace.addEventListener("change", closeLibrary);
syncLibraryAccess();
$("library-search").addEventListener("input", renderLibrary);
$("transcript-search").addEventListener("input", renderTranscript);
$("read-view").addEventListener("click", () => setMode("read"));
$("timeline-view").addEventListener("click", () => setMode("timeline"));
$("copy-button").addEventListener("click", async () => {
  if (!state.current) return;
  const text = state.current.segments.map((row) => row.text).join("\n");
  try { await navigator.clipboard.writeText(text); toast("Transcript copied."); }
  catch { toast("Clipboard access is unavailable. Export a text file instead."); }
});
$("export-format").addEventListener("change", () => {
  const format = $("export-format").value;
  if (format && state.current) {
    const link = document.createElement("a");
    link.href = `/api/library/${encodeURIComponent(state.current.id)}/export/${format}`;
    link.download = "";
    document.body.append(link);
    link.click();
    link.remove();
    $("export-format").value = "";
  }
});
$("delete-button").addEventListener("click", async () => {
  const doc = state.current;
  if (!doc || !window.confirm(`Remove “${doc.title}” from your local library? Exported files will stay on your computer.`)) return;
  try {
    await api(`/api/library/${encodeURIComponent(doc.id)}`, { method: "DELETE" });
    newDocument();
    await loadLibrary();
    toast("Removed from the library.");
  } catch (error) { toast(error.message); }
});
document.querySelectorAll(".import-trigger").forEach((button) => {
  button.addEventListener("click", () => { if (!state.busy) $("import-file").click(); });
});
$("import-file").addEventListener("change", async () => {
  const file = $("import-file").files[0];
  if (!file || state.busy) return;
  if (file.size > 2_000_000) { feedback("Choose a caption file smaller than 2 MB.", "error"); $("import-file").value = ""; return; }
  if (!/\.(vtt|srt|txt)$/i.test(file.name)) { feedback("Choose a .vtt, .srt, or .txt file.", "error"); $("import-file").value = ""; return; }
  const selection = ++state.selection;
  busy(true);
  feedback("Adding your file to the reading library…", "loading");
  try {
    const doc = await api("/api/import", { method: "POST", body: JSON.stringify({ name: file.name, content: await file.text() }) });
    if (selection === state.selection) showDocument(doc);
    await loadLibrary();
    feedback("");
    toast("File added to your library.");
  } catch (error) { feedback(error.message, "error"); }
  finally { busy(false); $("import-file").value = ""; }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Tab" && narrowWorkspace.matches && document.body.classList.contains("nav-open")) {
    const controls = [...$("sidebar").querySelectorAll("a, button:not(:disabled), input")];
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (event.key === "Escape") {
    const wasOpen = document.body.classList.contains("nav-open");
    closeLibrary();
    if (wasOpen) $("library-toggle").focus();
  }
  if (event.ctrlKey || event.metaKey || event.altKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (event.key === "/" && state.current) { event.preventDefault(); $("transcript-search").focus(); }
  if (event.key.toLowerCase() === "n") { event.preventDefault(); newDocument(); }
});

async function initialize() {
  if (window.location.protocol === "file:") {
    renderLibrary();
    feedback("This is a styled file preview. Run Start Margin.command, then open http://127.0.0.1:8765 to extract videos and use your library.");
    $("extract-button").disabled = true;
    document.querySelectorAll(".import-trigger").forEach((button) => { button.disabled = true; });
    $("workspace-state").textContent = "File preview — local server required";
    return;
  }
  try {
    await loadLibrary();
    let saved;
    try { saved = localStorage.getItem("margin-current"); } catch {}
    if (saved && state.library.some((doc) => doc.id === saved)) await selectDocument(saved);
  } catch (error) { feedback(error.message, "error"); }
}
initialize();
