const http = require("http");
const app = require("./src/app")
const socketHandler = require("./src/socket/socket");
const { log } = require("console");

const server = http.createServer(app);

socketHandler(server);

const PORT = process.env.PORT || 2121;

server.listen(PORT, () => {
    log(`Server is running at Port: ${PORT}`)
})