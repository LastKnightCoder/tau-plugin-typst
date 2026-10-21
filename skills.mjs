import { cp, lstat, mkdir, readdir, readFile, rm } from "node:fs/promises";
import path from "node:path";

/**
 * 打包 skills/<id>/：每个目录是一个 Skill，必须有在 front matter 中填写 description 的 SKILL.md，
 * 目录内文件原样复制到 staging，返回目录 ID 与相对路径（写入 manifest.skills 与 integrity）。
 */
export async function collectSkills(staging) {
  await rm(path.join(staging, "skills"), { recursive: true, force: true });
  let folders;
  try {
    folders = (await readdir("skills", { withFileTypes: true }))
      .filter(entry => !entry.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    if (error.code === "ENOENT") return { ids: [], files: [] };
    throw error;
  }
  const ids = [];
  const files = [];
  async function walk(relative) {
    for (const entry of await readdir(relative, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || ["node_modules", "__pycache__"].includes(entry.name))
        continue;
      const file = `${relative}/${entry.name}`;
      if ((await lstat(file)).isSymbolicLink()) throw new Error(`Skill 不能包含符号链接：${file}`);
      if (entry.isDirectory()) await walk(file);
      else if (entry.isFile()) {
        await mkdir(path.dirname(path.join(staging, file)), { recursive: true });
        await cp(file, path.join(staging, file));
        files.push(file);
      }
    }
  }
  for (const folder of folders) {
    if (!folder.isDirectory()) throw new Error(`skills 下只能放 Skill 目录：${folder.name}`);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(folder.name))
      throw new Error(`Skill 目录名只能使用字母、数字、点、横线和下划线：${folder.name}`);
    const readme = await readFile(`skills/${folder.name}/SKILL.md`, "utf8").catch(() => null);
    if (readme === null) throw new Error(`skills/${folder.name} 缺少 SKILL.md`);
    const front = readme.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!front || !/^description:\s*\S/m.test(front[1]))
      throw new Error(`skills/${folder.name}/SKILL.md 需要在开头的 front matter 中填写 description`);
    ids.push(folder.name);
    await walk(`skills/${folder.name}`);
  }
  return { ids, files };
}
