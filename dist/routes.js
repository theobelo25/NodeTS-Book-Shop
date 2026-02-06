"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestHandler = void 0;
const requestHandler = (req, res) => {
  const url = req.url;
  const method = req.method;
  if (url === "/") {
    res.write("<html>");
    res.write(
      "<body><h1>Hello World!</h1><form action='/create-user' method='POST'><input type='text' name='user'><button type='submit'>Submit</button></form></body>",
    );
    res.write("</html>");
    return res.end();
  }
  if (url === "/users") {
    res.write("<html>");
    res.write("<head><h1>Users</h1></head>");
    res.write(
      "<body><ul><li>Theo</li><li>Mackenzie</li><li>Alex</li></ul></body>",
    );
    res.write("</html>");
    return res.end();
  }
  if (url === "/create-user" && method === "POST") {
    const body = [];
    req.on("data", (chunk) => {
      body.push(chunk);
    });
    req.on("end", () => {
      const parsedBody = Buffer.concat(body).toString();
    });
    res.statusCode = 302;
    res.setHeader("Location", "/");
    res.end();
  }
};
exports.requestHandler = requestHandler;
