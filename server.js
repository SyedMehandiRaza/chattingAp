const http = require("http");
const app = require("./src/app")
const socketHandler = require("./src/socket/socket");
const { log } = require("console");

const server = http.createServer(app);

socketHandler(server);
console.log("🚀 Production log test");
log('wshfff')

const PORT = process.env.PORT || 2121;
console.log("DB HOST:", process.env.P_DB_HOST);
console.log("DB NAME:", process.env.P_DB_NAME);


server.listen(PORT, () => {
    log(`Server is running at Port: ${PORT}`)
})
