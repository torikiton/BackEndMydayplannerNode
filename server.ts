import http from "http";
import { app } from "./app";
require('dotenv').config();

const port = process.env.port || 3000;
const server = http.createServer(app);

server.listen(port, () => {
  console.log("Server is started");
});