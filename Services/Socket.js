const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

class ServerSocketService {
  constructor() {
    this.app = express();
    this.port = process.env.PORT_HTTP || process.env.PORT || 3000;

    // Envolvemos Express en el servidor HTTP nativo
    this.server = http.createServer(this.app);

    // Inicializamos Socket.io
    this.io = new Server(this.server, {
      cors: { origin: "*" },
    });

    // Ejecutamos configuraciones iniciales
    this.middlewares();
    this.sockets();
  }

  middlewares() {
    this.app.use(
      cors({
        origin: "*",
        exposedHeaders: ["X-Total-Count"],
      }),
    );
    this.app.use(express.json()); // Permite recibir JSON en peticiones HTTP POST
    this.app.use(express.static(path.join(__dirname, ".."))); // Servir index.html y estáticos
  }

  sockets() {
    this.io.on("connection", (socket) => {
      console.log("🟢 Cliente frontend conectado por WebSocket:", socket.id);

      socket.on("disconnect", () => {
        console.log("🔴 Cliente frontend desconectado:", socket.id);
      });
    });
  }

  // MÉTODO PARA ENVIAR MENSAJES (BROADCAST)
  emitirEvento(nombreEvento, payload) {
    this.io.emit(nombreEvento, payload);
  }

  // MÉTODO PARA ARRANCAR EL SERVIDOR
  listen() {
    this.server.listen(this.port, () => {
      console.log(
        `🚀 Servidor HTTP y WebSocket listo en el puerto ${this.port}`,
      );
    });
  }
}

module.exports = ServerSocketService;
