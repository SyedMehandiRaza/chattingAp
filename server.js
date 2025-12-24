const http = require("http");
const app = require("./src/app")
const socketHandler = require("./src/socket/socket");
const { log } = require("console");

const server = http.createServer(app);

socketHandler(server);
console.log("🚀 Production log test");
log('wshfff')

console.log("DB HOST:", process.env.P_DB_HOST);
console.log("DB NAME:", process.env.P_DB_NAME);


const PORT = process.env.PORT || 8080;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});