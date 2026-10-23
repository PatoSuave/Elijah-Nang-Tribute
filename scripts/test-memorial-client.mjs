import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { MEMORIAL_LIMITS } from "../src/lib/memorial.ts";

// Run the actual component's handlers with synthetic browser/HTTP boundaries.
// Real React SSR checks the initial HTML; browser hydration/Enter behavior also
// needs an independent browser check. No network or application bypass is used.
const source = await readFile(new URL("../src/components/MemorialBoard.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function component(react, jsx, browser = {}) {
  const exports = {};
  vm.runInNewContext(compiled, {
    exports, module: { exports }, Error, AbortSignal,
    require(name) {
      if (name === "react") return react;
      if (name === "react/jsx-runtime") return jsx;
      if (name === "@/lib/memorial") return { MEMORIAL_LIMITS };
      throw new Error(`Unexpected component import: ${name}`);
    },
    ...browser,
  }, { filename: "MemorialBoard.tsx" });
  return exports.default;
}

function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== "object") return [];
  return [tree, ...[tree.props?.children].flat().flatMap(nodes)];
}
function text(tree) {
  if (Array.isArray(tree)) return tree.map(text).join(" ");
  if (tree == null || typeof tree === "boolean") return "";
  if (typeof tree !== "object") return String(tree);
  return [tree.props?.children].flat().map(text).join(" ");
}

function harness({ ready = true, resetThrows = false, respond = async () => ({ ok: true, data: { ok: true } }) } = {}) {
  const hooks = [], effects = [], requests = [];
  const fields = new Map([ ["displayName", "Synthetic visitor"], ["location", "Test Lab"], ["consent", "on"], ["website", ""] ]);
  let cursor = 0, tree, widget, formResets = 0, widgetResets = 0, prevented = 0;
  const react = {
    useState(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = initial;
      return [hooks[index], (value) => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in hooks)) hooks[index] = { current: initial };
      return hooks[index];
    },
    useEffect(effect) {
      const index = cursor++;
      if (!(index in hooks)) { hooks[index] = true; effects.push(effect); }
    },
    useSyncExternalStore(_subscribe, client, server) { return ready ? client() : server(); },
  };
  const jsx = (type, props) => ({ type, props });
  const Board = component(react, { jsx, jsxs: jsx }, {
    FormData: class { get(name) { return fields.get(name) ?? null; } },
    window: { turnstile: {
      render(_mount, options) { widget = options; return "synthetic-widget"; },
      reset() { widgetResets++; if (resetThrows) throw new Error("Synthetic widget reset failure"); },
      remove() {},
    } },
    fetch: async (url, options) => {
      if (url.startsWith("/api/memorial/messages")) return { ok: true, json: async () => ({ messages: [], nextOffset: 0, hasMore: false }) };
      assert.equal(url, "/api/memorial/submissions");
      requests.push(options);
      const response = await respond();
      return { ok: response.ok, json: async () => response.data };
    },
  });
  function render() {
    cursor = 0;
    tree = Board({ siteKey: "synthetic-public-key" });
    for (const node of nodes(tree)) {
      if (typeof node.props.ref === "function") node.props.ref({ focus() {} });
      else if (node.props.ref) node.props.ref.current = {};
    }
    return tree;
  }
  const find = (type, name) => nodes(render()).find((node) => node.type === type && (!name || node.props.name === name));
  render();
  if (ready) for (const effect of effects) effect();
  return {
    requests,
    get formResets() { return formResets; },
    get widgetResets() { return widgetResets; },
    get prevented() { return prevented; },
    get draft() { return find("textarea").props.value; },
    get feedback() { return nodes(render()).filter((node) => node.props.className === "form-feedback").map(text).join(" "); },
    get sendDisabled() { return find("button").props.disabled; },
    fill(message = "Synthetic unsent draft") {
      find("textarea").props.onChange({ target: { value: message } });
      widget?.callback("synthetic-one-use-token");
    },
    submit() {
      return find("form").props.onSubmit({
        preventDefault() { prevented++; },
        currentTarget: { reset() { formResets++; fields.clear(); } },
      });
    },
  };
}

test("SSR disables every guestbook control and provides initialization and no-JS guidance", () => {
  const Board = component(React, jsxRuntime);
  const html = renderToStaticMarkup(React.createElement(Board, { siteKey: "synthetic-public-key" }));
  const form = html.match(/<form\b[\s\S]*?<\/form>/)?.[0];
  assert.ok(form);
  assert.match(form, /method="post"/);
  assert.match(form, /action="\/api\/memorial\/submissions"/);
  const fieldset = form.match(/<fieldset\b[^>]*disabled=""[^>]*>[\s\S]*?<\/fieldset>/)?.[0];
  assert.ok(fieldset, "all editable controls must start inside a disabled fieldset");
  assert.equal((form.match(/<(?:input|textarea|button)\b/g) || []).length, (fieldset.match(/<(?:input|textarea|button)\b/g) || []).length);
  assert.match(form, /Preparing the message form/);
  assert.match(form, /<noscript>[\s\S]*JavaScript[\s\S]*<\/noscript>/);
});

test("submission before client readiness prevents navigation and never sends", async () => {
  const view = harness({ ready: false });
  await view.submit();
  assert.equal(view.prevented, 1);
  assert.equal(view.requests.length, 0);
});

test("accepted submission keeps confirmation when the widget reset throws", async () => {
  const view = harness({ resetThrows: true });
  view.fill();
  await view.submit();
  assert.match(view.feedback, /Thank you\. Your message has been received/);
  assert.match(view.feedback, /copy any unsent text and refresh/i);
  assert.equal(view.draft, "");
  assert.equal(view.formResets, 1);
  assert.equal(view.widgetResets, 1);
  assert.equal(view.sendDisabled, false);
  assert.equal(view.requests.length, 1);
});

test("rejected submission keeps its draft and API error when the widget reset throws", async () => {
  const view = harness({ resetThrows: true, respond: async () => ({ ok: false, data: { error: "Please wait before sending another message." } }) });
  view.fill();
  await view.submit();
  assert.match(view.feedback, /Please wait before sending another message\./);
  assert.match(view.feedback, /copy any unsent text and refresh/i);
  assert.equal(view.draft, "Synthetic unsent draft");
  assert.equal(view.formResets, 0);
  assert.equal(view.widgetResets, 1);
  assert.equal(view.sendDisabled, false);
  await view.submit();
  assert.equal(view.requests.length, 1, "a failed reset must not allow reuse of a consumed token");
  assert.equal(view.draft, "Synthetic unsent draft");
});

test("network failure and reset failure retain the draft without an automatic retry", async () => {
  const view = harness({ resetThrows: true, respond: async () => { throw new Error("Failed to fetch"); } });
  view.fill();
  await view.submit();
  assert.match(view.feedback, /We could not send your message/);
  assert.match(view.feedback, /copy any unsent text and refresh/i);
  assert.equal(view.draft, "Synthetic unsent draft");
  assert.equal(view.formResets, 0);
  assert.equal(view.requests.length, 1);
  assert.equal(view.sendDisabled, false);
});

test("in-flight duplicate submits stay locked and normal success still confirms", async () => {
  let release;
  const response = new Promise((resolve) => { release = resolve; });
  const view = harness({ respond: () => response });
  view.fill();
  const pending = view.submit();
  assert.equal(view.sendDisabled, true);
  await view.submit();
  assert.equal(view.requests.length, 1);
  release({ ok: true, data: { ok: true } });
  await pending;
  assert.equal(view.sendDisabled, false);
  assert.match(view.feedback, /Thank you\. Your message has been received/);
  assert.equal(view.draft, "");
});
