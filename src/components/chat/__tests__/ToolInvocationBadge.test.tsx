import { test, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

afterEach(cleanup);
import { ToolInvocationBadge } from "../ToolInvocationBadge";
import { ToolInvocation } from "ai";

function makeTool(
  toolName: string,
  args: Record<string, unknown>,
  state: "call" | "result" = "call"
): ToolInvocation {
  if (state === "result") {
    return { toolCallId: "1", toolName, args, state, result: "ok" };
  }
  return { toolCallId: "1", toolName, args, state };
}

test("shows 'Creating' label for str_replace_editor create", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" })} />);
  expect(screen.getByText("Creating /App.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor str_replace", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "str_replace", path: "/App.jsx" })} />);
  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
});

test("shows 'Editing' label for str_replace_editor insert", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "insert", path: "/App.jsx" })} />);
  expect(screen.getByText("Editing /App.jsx")).toBeDefined();
});

test("shows 'Reading' label for str_replace_editor view", () => {
  render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "view", path: "/App.jsx" })} />);
  expect(screen.getByText("Reading /App.jsx")).toBeDefined();
});

test("shows 'Renaming' label for file_manager rename", () => {
  render(<ToolInvocationBadge tool={makeTool("file_manager", { command: "rename", path: "/old.jsx" })} />);
  expect(screen.getByText("Renaming /old.jsx")).toBeDefined();
});

test("shows 'Deleting' label for file_manager delete", () => {
  render(<ToolInvocationBadge tool={makeTool("file_manager", { command: "delete", path: "/old.jsx" })} />);
  expect(screen.getByText("Deleting /old.jsx")).toBeDefined();
});

test("shows spinner when tool is in progress", () => {
  const { container } = render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "call")} />);
  expect(container.querySelector(".animate-spin")).toBeTruthy();
});

test("shows green dot when tool is complete", () => {
  const { container } = render(<ToolInvocationBadge tool={makeTool("str_replace_editor", { command: "create", path: "/App.jsx" }, "result")} />);
  expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  expect(container.querySelector(".animate-spin")).toBeFalsy();
});

test("falls back to tool name for unknown tools", () => {
  render(<ToolInvocationBadge tool={makeTool("unknown_tool", {})} />);
  expect(screen.getByText("unknown_tool")).toBeDefined();
});
