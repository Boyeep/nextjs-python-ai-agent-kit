import { existsSync, copyFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const children = [];
for (const [target, example] of [["frontend/.env.local", "frontend/.env.example"], ["backend/.env", "backend/.env.example"]]) {
  if (!existsSync(path.join(root, target))) copyFileSync(path.join(root, example), path.join(root, target));
}
function run(command, args, cwd) {
  const child = spawn(command, args, { cwd, stdio: "inherit", shell: process.platform === "win32" });
  children.push(child);
}
run("npm", ["run", "dev"], path.join(root, "frontend"));
run("python", ["-m", "uvicorn", "app.main:app", "--reload", "--host", "127.0.0.1", "--port", "8000"], path.join(root, "backend"));
function stop() { for (const child of children) child.kill("SIGINT"); }
process.on("SIGINT", stop); process.on("SIGTERM", stop);
