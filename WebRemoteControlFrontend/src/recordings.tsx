import { createSignal, For, Show, onMount } from "solid-js";
import { render } from "solid-js/web";
import { showConfirm, confirmOk, confirmCancel } from "./utils.ts";
import { BasicLinks, ConfirmDialog, Section } from "./components.tsx";

interface Recording {
  name: string;
  size: string;
}

interface HoverPreviewHandle {
  show(src: string, event: MouseEvent): void;
  move(event: MouseEvent): void;
  hide(): void;
  element: HTMLDivElement;
}

const PREVIEW_CURSOR_MARGIN = 16;
const PREVIEW_FALLBACK_WIDTH = 320;
const PREVIEW_FALLBACK_HEIGHT = 240;

function hasHoverPreview(): boolean {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

function downloadUrl(filename: string): string {
  return new URL(`/recordings/${encodeURIComponent(filename)}`, window.location.origin).toString();
}

async function copyText(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  textArea.style.left = "-1000px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  textArea.setSelectionRange(0, text.length);
  const success = document.execCommand("copy");
  document.body.removeChild(textArea);
  if (!success) throw new Error("Copy failed");
}

function downloadFile(filename: string): void {
  const link = document.createElement("a");
  link.href = downloadUrl(filename);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

async function deleteRecording(filename: string): Promise<void> {
  const response = await fetch(`/recordings/${encodeURIComponent(filename)}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete ${filename}: ${response.status}`);
  }
}

function HoverPreview(): HoverPreviewHandle {
  let previewEl!: HTMLDivElement;

  function positionPreview(event: MouseEvent): void {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pw = previewEl.offsetWidth || PREVIEW_FALLBACK_WIDTH;
    const ph = previewEl.offsetHeight || PREVIEW_FALLBACK_HEIGHT;
    let xPos = event.clientX + PREVIEW_CURSOR_MARGIN;
    let yPos = event.clientY + PREVIEW_CURSOR_MARGIN;
    if (xPos + pw > vw - PREVIEW_CURSOR_MARGIN) {
      xPos = event.clientX - pw - PREVIEW_CURSOR_MARGIN;
    }
    if (yPos + ph > vh - PREVIEW_CURSOR_MARGIN) {
      yPos = vh - ph - PREVIEW_CURSOR_MARGIN;
    }
    if (xPos < PREVIEW_CURSOR_MARGIN) xPos = PREVIEW_CURSOR_MARGIN;
    if (yPos < PREVIEW_CURSOR_MARGIN) yPos = PREVIEW_CURSOR_MARGIN;
    previewEl.style.left = `${xPos}px`;
    previewEl.style.top = `${yPos}px`;
  }

  return {
    show(src: string, event: MouseEvent): void {
      const img = previewEl.querySelector("img");
      img!.src = src;
      previewEl.style.display = "block";
      positionPreview(event);
    },
    move(event: MouseEvent): void {
      if (previewEl.style.display === "block") positionPreview(event);
    },
    hide(): void {
      previewEl.style.display = "none";
    },
    element: (
      <div
        ref={(el: HTMLDivElement) => {
          previewEl = el;
        }}
        class="fixed z-50 pointer-events-none max-w-[min(80vw,640px)] max-h-[80vh] overflow-hidden"
        style={{ display: "none" }}
      >
        <img class="block max-w-full max-h-[80vh] object-contain" />
      </div>
    ) as HTMLDivElement,
  };
}

interface RecordingRowProps {
  recording: Recording;
  onDelete: (name: string) => void;
  onMobilePreview: (src: string) => void;
  hoverPreview: HoverPreviewHandle;
}

function RecordingRow({ recording, onDelete, onMobilePreview, hoverPreview }: RecordingRowProps) {
  const [copyLabel, setCopyLabel] = createSignal("Copy link");
  const src = `/thumbnails/${encodeURIComponent(recording.name)}`;

  async function handleCopy(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    try {
      await copyText(downloadUrl(recording.name));
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Failed");
    }
    setTimeout(() => setCopyLabel("Copy link"), 1500);
  }

  function handleDownload(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    downloadFile(recording.name);
  }

  function handleDelete(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    onDelete(recording.name);
  }

  function handleThumbnailClick(event: MouseEvent): void {
    if (hasHoverPreview()) return;
    event.preventDefault();
    event.stopPropagation();
    onMobilePreview(src);
  }

  return (
    <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-md hover:bg-base-300/40">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <img
          class="w-20 max-h-20 object-contain shrink-0 cursor-pointer rounded"
          src={src}
          alt=""
          onMouseEnter={hasHoverPreview() ? (event) => hoverPreview.show(src, event) : undefined}
          onMouseMove={hasHoverPreview() ? (event) => hoverPreview.move(event) : undefined}
          onMouseLeave={hasHoverPreview() ? () => hoverPreview.hide() : undefined}
          onClick={handleThumbnailClick}
        />
        <span class="flex-1 min-w-0 text-sm break-words sm:truncate">{recording.name}</span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <span class="text-xs opacity-60 whitespace-nowrap">{recording.size}</span>
        <button
          type="button"
          class="btn btn-xs"
          aria-label={`Copy download link for ${recording.name}`}
          onClick={handleCopy}
        >
          {copyLabel()}
        </button>
        <button
          type="button"
          class="btn btn-xs"
          aria-label={`Download ${recording.name}`}
          onClick={handleDownload}
        >
          Download
        </button>
        <button
          type="button"
          class="btn btn-xs btn-error btn-outline"
          aria-label={`Delete ${recording.name}`}
          onClick={handleDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function App() {
  const [recordings, setRecordings] = createSignal<Recording[]>([]);
  const [loading, setLoading] = createSignal(true);
  const [loadError, setLoadError] = createSignal(false);
  const [mobilePreviewSrc, setMobilePreviewSrc] = createSignal<string | null>(null);
  const [confirmMessage, setConfirmMessage] = createSignal("");
  const [confirmOpen, setConfirmOpen] = createSignal(false);
  const hoverPreview = HoverPreview();

  async function loadRecordings(): Promise<void> {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await fetch("/recordings.json");
      const data = (await response.json()) as Recording[];
      setRecordings(data);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(filename: string): Promise<void> {
    const ok = await showConfirm(
      `Delete "${filename}"? This cannot be undone.`,
      setConfirmMessage,
      setConfirmOpen,
    );
    if (!ok) return;
    try {
      await deleteRecording(filename);
    } catch {
      return;
    }
    await loadRecordings();
  }

  onMount(loadRecordings);

  function MobilePreview() {
    return (
      <Show when={mobilePreviewSrc() !== null}>
        <div
          class="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/90"
          onClick={() => setMobilePreviewSrc(null)}
        >
          <img
            class="block max-w-full max-h-full object-contain"
            src={mobilePreviewSrc() ?? undefined}
            alt=""
          />
        </div>
      </Show>
    );
  }

  return (
    <div class="max-w-3xl mx-auto space-y-3">
      <h1 class="text-2xl font-bold text-center">Moblin Recordings</h1>
      <BasicLinks />
      <Section title="Recordings">
        <Show when={loading()}>
          <div class="text-sm opacity-60 text-center py-2">
            {loadError() ? "Failed to load recordings." : "Loading..."}
          </div>
        </Show>
        <Show when={!loading() && recordings().length === 0}>
          <div class="text-sm opacity-60 text-center py-2">No recordings found.</div>
        </Show>
        <For each={recordings()}>
          {(recording) => (
            <RecordingRow
              recording={recording}
              onDelete={handleDelete}
              onMobilePreview={setMobilePreviewSrc}
              hoverPreview={hoverPreview}
            />
          )}
        </For>
      </Section>
      {hoverPreview.element}
      <ConfirmDialog
        open={confirmOpen}
        message={confirmMessage}
        onOk={confirmOk}
        onCancel={confirmCancel}
        okClass="btn-error"
        okLabel="Delete"
      />
      <MobilePreview />
    </div>
  );
}

render(() => <App />, document.getElementById("app")!);
