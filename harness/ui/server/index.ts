import http from "node:http";

const port = Number(process.env.HARNESS_UI_PORT ?? 5180);
const host = "127.0.0.1";

const allowedCommands = [
  "harness:trace",
  "harness:validate",
  "harness:self-test",
  "app:trace",
  "app:validate",
  "repo:validate",
];

const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  response.setHeader("content-type", "application/json; charset=utf-8");

  if (url.pathname === "/api/health") {
    response.end(JSON.stringify({ status: "ok", host, port }));
    return;
  }

  if (url.pathname === "/api/commands") {
    response.end(JSON.stringify({ commands: allowedCommands }));
    return;
  }

  if (url.pathname === "/api/commands/run") {
    response.statusCode = 405;
    response.end(JSON.stringify({ error: "command execution is not wired in this skeleton" }));
    return;
  }

  response.statusCode = 404;
  response.end(JSON.stringify({ error: "not found" }));
});

server.listen(port, host, () => {
  console.log(`harness/ui server listening on http://${host}:${port}`);
});
