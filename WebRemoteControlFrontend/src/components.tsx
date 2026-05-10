import type { Accessor, JSX, ParentProps } from "solid-js";
import { For, Show } from "solid-js";
import { twMerge } from "tailwind-merge";

interface ButtonProps {
  class?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: (event: MouseEvent) => void;
  children?: JSX.Element;
}

const BTN_VARIANT_RE =
  /\bbtn-(primary|secondary|accent|info|success|warning|error|neutral|ghost|link|outline|soft|dash)\b/;

export function Button({ class: extraClass, type = "button", disabled, onClick, children }: ButtonProps) {
  const hasVariant = extraClass !== undefined && BTN_VARIANT_RE.test(extraClass);
  return (
    <button
      type={type}
      disabled={disabled}
      class={twMerge("btn btn-sm", hasVariant ? "" : "btn-neutral", extraClass)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

interface ConfirmDialogProps {
  open: Accessor<boolean>;
  message: Accessor<string>;
  onOk: () => void;
  onCancel: () => void;
  okClass?: string;
  okLabel?: string;
}

export function ConfirmDialog({
  open,
  message,
  onOk,
  onCancel,
  okClass = "btn-primary",
  okLabel = "OK",
}: ConfirmDialogProps) {
  return (
    <Show when={open()}>
      <dialog open class="modal modal-open">
        <div class="modal-box max-w-sm bg-base-300 border border-neutral shadow-2xl">
          <p>{message()}</p>
          <div class="modal-action">
            <button type="button" class="btn btn-sm btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="button" class={twMerge("btn btn-sm", okClass)} onClick={onOk}>
              {okLabel}
            </button>
          </div>
        </div>
        <div class="modal-backdrop bg-black/70" onClick={onCancel} />
      </dialog>
    </Show>
  );
}

export function Section(props: ParentProps<{ title: string }>) {
  return (
    <div class="card bg-base-200 border border-base-300">
      <div class="card-body p-3 gap-3">
        <h2 class="card-title text-lg">{props.title}</h2>
        {props.children}
      </div>
    </div>
  );
}

export function GitHubLink() {
  return (
    <a href="https://github.com/eerimoq/moblin" target="_blank" class="link link-primary text-sm">
      Github
    </a>
  );
}

export function RemoteControlLink() {
  return (
    <a href="./" class="link link-primary text-sm">
      Remote Control
    </a>
  );
}

export function BasicLinks() {
  return (
    <div class="text-center space-x-4 pb-1">
      <RemoteControlLink />
      <GitHubLink />
    </div>
  );
}

export interface NamedItem {
  id: string;
  name: string;
}

export interface PickerProps {
  name: string;
  options: Accessor<NamedItem[]>;
  value: Accessor<string>;
  onChange: (value: string) => void;
}

export function Picker({ name, options, value, onChange }: PickerProps) {
  return (
    <Show when={options().length > 0}>
      <label class="flex items-center gap-3">
        <span class="text-sm w-32 shrink-0">{name}</span>
        <select
          class="select select-sm select-bordered flex-1"
          value={value()}
          onChange={(event) => onChange(event.target.value)}
        >
          <For each={options()}>
            {(option) => <option value={option.id}>{option.name}</option>}
          </For>
        </select>
      </label>
    </Show>
  );
}

export interface ToggleProps {
  id: string;
  checked: boolean;
  onChange: (event: Event & { target: HTMLInputElement }) => void;
  label: string;
}

export function Toggle(props: ToggleProps) {
  return (
    <label for={props.id} class="flex items-center gap-3 cursor-pointer">
      <input
        id={props.id}
        type="checkbox"
        class="toggle toggle-primary"
        checked={props.checked}
        role="switch"
        onChange={props.onChange}
      />
      <span class="text-sm">{props.label}</span>
    </label>
  );
}

interface ConnectionBadgeProps {
  connected: Accessor<boolean>;
}

export function ConnectionBadge({ connected }: ConnectionBadgeProps) {
  return (
    <div class="text-center pb-1">
      <span
        class="badge badge-sm"
        classList={{
          "badge-success": connected(),
          "badge-warning": !connected(),
        }}
      >
        {connected() ? "Connected" : "Connecting..."}
      </span>
    </div>
  );
}
