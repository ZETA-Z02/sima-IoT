const mqtt = require("mqtt");
const { MongoClient } = require("mongodb");
const express = require("express");
const cors = require("cors");
const http = require("http"); // Requerido para Socket.io
const { Server } = require("socket.io");

// --- CONFIGURACIÓN ---
const mqttUrl = "mqtt://localhost:1883";
const mongoUrl = "mongodb://localhost:27017";
const dbName = "sima_iot";
const topic = "zeta/sensor1";
const portHTTP = 3000;

async function main() {
  // 1. Configurar Express, Servidor HTTP y Socket.io
  const app = express();
  app.use(cors());

  const server = http.createServer(app); // Envolvemos Express
  const io = new Server(server, {
    cors: { origin: "*" }, // Permite conexiones WebSocket desde cualquier frontend
  });

  // Evento para monitorear cuando el frontend se conecta
  io.on("connection", (socket) => {
    console.log("🟢 Cliente frontend conectado por WebSocket:", socket.id);
  });

  // 2. Conexión a MongoDB
  const mongoClient = new MongoClient(mongoUrl);
  await mongoClient.connect();
  console.log("Conectado a MongoDB");
  const db = mongoClient.db(dbName);
  const collection = db.collection("ambientalData");

  // 3. Endpoint HTTP (Útil para cargar el historial inicial al abrir la página)
  app.get("/api/datos", async (req, res) => {
    try {
      const datos = await collection
        .find({})
        .sort({ fecha_registro: -1 })
        .limit(20)
        .toArray();
      res.json(datos);
    } catch (error) {
      res.status(500).json({ error: "Error interno" });
    }
  });

  // 4. Iniciar el servidor (¡Usamos 'server.listen', no 'app.listen'!)
  server.listen(portHTTP, () => {
    console.log(`Servidor HTTP y WebSocket listo en el puerto ${portHTTP}`);
  });

  // 5. Conexión al Broker MQTT
  const mqttClient = mqtt.connect(mqttUrl, {
    username: "iot_user",
    password: "zeta",
  });
  // Escuchar si hay un error de conexión (ej. credenciales inválidas)
  mqttClient.on("error", (err) => {
    console.error("🔴 Error de conexión MQTT en Node:", err.message);
  });

  mqttClient.on("connect", () => {
    console.log("Conectado al Broker MQTT");
    mqttClient.subscribe(topic);
  });
  // 6. Escuchar MQTT, guardar en BD y emitir al frontend
  mqttClient.on("message", async (topic, message) => {
    const valorRecibido = message.toString();
    console.log(`Dato recibido en ${topic}: ${valorRecibido}`);

    const documento = {
      sensor_id: "ESP32_01",
      topico: topic,
      valor: parseFloat(valorRecibido),
      fecha_registro: new Date(),
    };

    try {
      // Guarda en la base de datos
      await collection.insertOne(documento);

      // ENVÍA EL DATO EN TIEMPO REAL AL FRONTEND
      io.emit("nuevo_dato_sensor", documento);
    } catch (error) {
      console.error("Error al insertar en BD:", error);
    }
  });
}

main().catch(console.error);
