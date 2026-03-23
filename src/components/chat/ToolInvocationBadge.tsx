"use client";

import { Loader2 } from "lucide-react";
import { ToolInvocation } from "ai";

function getLabel(toolName: string, args: Record<string, unknown>): string {
  if (toolName === "str_replace_editor") {
    switch (args.command) {
      case "create": return `Creating ${args.path}`;
      case "str_replace":
      case "insert": return `Editing ${args.path}`;
      case "view": return `Reading ${args.path}`;
      default: return `Editing file`;
    }
  }
  if (toolName === "file_manager") {
    switch (args.command) {
      case "rename": return `Renaming ${args.path}`;
      case "delete": return `Deleting ${args.path}`;
      default: return `Managing files`;
    }
  }
  return toolName;
}

interface ToolInvocationBadgeProps {
  tool: ToolInvocation;
}

export function ToolInvocationBadge({ tool }: ToolInvocationBadgeProps) {
  const label = getLabel(tool.toolName, tool.args as Record<string, unknown>);
  const done = tool.state === "result" && tool.result;

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {done ? (
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
