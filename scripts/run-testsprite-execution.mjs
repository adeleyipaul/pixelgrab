import { spawn } from "node:child_process";
import { mkdirSync, appendFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const logPath = resolve(repoRoot, process.argv[2] || "testsprite_tests/round5-terminal-execution.log");
const timeoutMs = Number(process.argv[3] || 20 * 60 * 1000);
const launcherPath = resolve(repoRoot, "scripts/testsprite-mcp.ps1");

mkdirSync(dirname(logPath), { recursive: true });
writeFileSync(logPath, "", "utf8");

const child = spawn(
  "powershell",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    launcherPath,
    "generateCodeAndExecute",
  ],
  {
    cwd: repoRoot,
    stdio: ["ignore", "pipe", "pipe"],
  },
);

let buffer = "";
let completed = false;

function write(chunk) {
  const text = chunk.toString("utf8");
  appendFileSync(logPath, text, "utf8");
  buffer += text;

  if (
    buffer.includes("Execution lock released") ||
    buffer.includes("Test execution completed")
  ) {
    completed = true;
    stopTree();
  }
}

function stopTree() {
  if (!child.pid || child.killed) return;
  spawn("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
    stdio: "ignore",
    windowsHide: true,
  });
}

child.stdout.on("data", write);
child.stderr.on("data", write);

const timeout = setTimeout(() => {
  appendFileSync(logPath, `\nTimed out after ${timeoutMs}ms.\n`, "utf8");
  stopTree();
}, timeoutMs);

child.on("exit", (code, signal) => {
  clearTimeout(timeout);
  if (completed) {
    process.exit(0);
  }

  appendFileSync(
    logPath,
    `\nTestSprite process exited before completion. code=${code ?? "null"} signal=${signal ?? "null"}\n`,
    "utf8",
  );
  process.exit(code || 1);
});
