import { spawn } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const timeoutMs = Number(process.env.MCP_CLIENT_TIMEOUT_MS || 20 * 60 * 1000);
const mode = process.argv[2] || "list-tools";

function loadTestSpriteKey() {
  if (process.env.API_KEY) return;
  if (process.env.TESTSPRITE_API_KEY) {
    process.env.API_KEY = process.env.TESTSPRITE_API_KEY;
    return;
  }

  const envPath = resolve(repoRoot, ".env");
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?(?:TESTSPRITE_API_KEY|API_KEY)\s*=\s*(.+)\s*$/);
    if (match) {
      process.env.API_KEY = match[1].trim().replace(/^["']|["']$/g, "");
      return;
    }
  }
}

function findCachedTestSpriteEntry() {
  const root = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "npm-cache", "_npx");
  if (!root || !existsSync(root)) return null;

  for (const dir of readdirSync(root).reverse()) {
    const packagePath = join(root, dir, "node_modules", "@testsprite", "testsprite-mcp", "package.json");
    const entryPath = join(root, dir, "node_modules", "@testsprite", "testsprite-mcp", "dist", "index.js");
    if (existsSync(packagePath) && existsSync(entryPath)) return entryPath;
  }

  return null;
}

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

    loadTestSpriteKey();
    if (!process.env.API_KEY) {
      throw new Error("Missing TestSprite API key. Set TESTSPRITE_API_KEY or API_KEY.");
    }

    const cachedEntry = findCachedTestSpriteEntry();
    const command = cachedEntry ? process.execPath : "npx.cmd";
    const args = cachedEntry ? [cachedEntry] : ["--yes", "@testsprite/testsprite-mcp@latest"];

    this.child = spawn(
      command,
      args,
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
      process.stderr.write(chunk);
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
      protocolVersion: "2025-06-18",
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
const hardTimer = setTimeout(async () => {
  process.stderr.write(`MCP client timed out after ${timeoutMs}ms.\n`);
  if (client.stderr) process.stderr.write(`Captured stderr:\n${client.stderr}\n`);
  await client.close();
  process.exit(1);
}, timeoutMs + 1000);

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
  clearTimeout(hardTimer);
  await client.close();
}
