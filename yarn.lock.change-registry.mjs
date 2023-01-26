import fs from "node:fs";

const str = fs.readFileSync("./yarn.lock", "utf8");

const newStr = str.replace(/registry.npmmirror.com/g, "registry.npmjs.org");

fs.writeFileSync("./yarn.lock", newStr);
