import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(projectDir, "dist");
const serverDir = path.join(distDir, "server");
const indexHtml = await readFile(path.join(projectDir, "index.html"), "utf8");
const navItemsJson = await readFile(path.join(projectDir, "nav-items.json"), "utf8");

JSON.parse(navItemsJson);

const worker = `const INDEX_HTML = ${JSON.stringify(indexHtml)};
const NAV_ITEMS_JSON = ${JSON.stringify(navItemsJson)};

const HEADERS = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
};

function contentResponse(request, body, contentType) {
  return new Response(request.method === "HEAD" ? null : body, {
    headers: {
      ...HEADERS,
      "cache-control": "no-cache",
      "content-type": contentType
    }
  });
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isReadable = request.method === "GET" || request.method === "HEAD";

    if (isReadable && (url.pathname === "/" || url.pathname === "/index.html")) {
      return contentResponse(request, INDEX_HTML, "text/html; charset=utf-8");
    }

    if (isReadable && url.pathname === "/nav-items.json") {
      return contentResponse(request, NAV_ITEMS_JSON, "application/json; charset=utf-8");
    }

    if (url.pathname === "/nav-items.json") {
      return new Response("Method Not Allowed", {
        status: 405,
        headers: { ...HEADERS, allow: "GET, HEAD" }
      });
    }

    return new Response("Not Found", { status: 404, headers: HEADERS });
  }
};
`;

await rm(distDir, { recursive: true, force: true });
await mkdir(serverDir, { recursive: true });
await writeFile(path.join(serverDir, "index.js"), worker);

console.log("Built dist/server/index.js");
