import { spawnSync } from "node:child_process";
import path from "node:path";

const root = process.cwd();
const commands = [
  ["npm", ["run", "lint"], "frontend"],
  ["npm", ["run", "build"], "frontend"],
  ["python", ["-m", "ruff", "check", "."], "backend"],
  ["python", ["-m", "pytest"], "backend"],
];
for (const [command, args, cwd] of commands) {
  const result = spawnSync(command, args, { cwd: path.join(root, cwd), stdio: "inherit", shell: process.platform === "win32" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
