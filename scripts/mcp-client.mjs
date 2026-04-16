import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const timeoutMs = Number(process.env.MCP_CLIENT_TIMEOUT_MS || 20 * 60 * 1000);
const mode = process.argv[2] || "list-tools";

function usage() {
  console.error("Usage:");
  console.error("  node scripts/mcp-client.mjs list-tools");
  console.error("  node scripts/mcp-client.mjs call-tool <tool-name> <args-json-or-@file>");
  process.exit(2);
}

function readArgs(raw) {
  if (!raw) return {};
  const source = raw.startsWith("@")
    ? readFileSync(resolve(repoRoot, raw.slice(1)), "utf8")
    : raw;
  return JSON.parse(source);
}

function decodeMessages(buffer, onMessage) {
  let text = buffer.toString("utf8");
  let newlineIndex = text.indexOf("\n");

  while (newlineIndex !== -1) {
    const line = text.slice(0, newlineIndex).trim();
    text = text.slice(newlineIndex + 1);

    if (line.startsWith("{")) {
      onMessage(JSON.parse(line));
    }

    newlineIndex = text.indexOf("\n");
  }

  return Buffer.from(text, "utf8");
}

class McpClient {
  constructor() {
    this.nextId = 1;
    this.pending = new Map();
    this.buffer = Buffer.alloc(0);
    this.stderr = "";

    this.child = spawn(
      "powershell",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        resolve(repoRoot, "scripts", "testsprite-mcp.ps1"),
      ],
      {
        cwd: repoRoot,
        env: process.env,
        stdio: ["pipe", "pipe", "pipe"],
      },
    );

    this.child.stdout.on("data", (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      this.buffer = decodeMessages(this.buffer, (message) => this.handleMessage(message));
    });

    this.child.stderr.on("data", (chunk) => {
      this.stderr += chunk.toString("utf8");
    });

    this.child.on("exit", (code, signal) => {
      for (const { reject } of this.pending.values()) {
        reject(new Error(`MCP server exited with code ${code ?? "null"} signal ${signal ?? "null"}`));
      }
      this.pending.clear();
    });
  }

  handleMessage(message) {
    if (!Object.prototype.hasOwnProperty.call(message, "id")) return;
    const pending = this.pending.get(message.id);
    if (!pending) return;
    this.pending.delete(message.id);
    if (message.error) pending.reject(new Error(JSON.stringify(message.error)));
    else pending.resolve(message.result);
  }

  sendNotification(method, params = {}) {
    const payload = JSON.stringify({ jsonrpc: "2.0", method, params });
    this.child.stdin.write(`${payload}\n`);
  }

  request(method, params = {}) {
    const id = this.nextId++;
    const payload = JSON.stringify({ jsonrpc: "2.0", id, method, params });
    this.child.stdin.write(`${payload}\n`);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Timed out waiting for ${method}. Stderr:\n${this.stderr}`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        },
      });
    });
  }

  async init() {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {
        roots: {
          listChanged: true,
        },
      },
      clientInfo: {
        name: "pixel-grab-codex-mcp-client",
        version: "0.1.0",
      },
    });
    this.sendNotification("notifications/initialized");
  }

  async close() {
    this.child.stdin.end();
    this.child.kill();
  }
}

if (!["list-tools", "call-tool"].includes(mode)) usage();
if (mode === "call-tool" && !process.argv[3]) usage();

const client = new McpClient();

try {
  await client.init();
  let result;
  if (mode === "list-tools") {
    result = await client.request("tools/list");
  } else {
    result = await client.request("tools/call", {
      name: process.argv[3],
      arguments: readArgs(process.argv[4]),
    });
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} finally {
  await client.close();
}
