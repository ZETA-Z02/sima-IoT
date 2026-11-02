const AmbientalModel = require("./Model/AmbientalModel");
const NodoSensorModel = require("./Model/NodoSensorModel");
const UsuarioModel = require("./Model/UsuarioModel");

const IoTService = require("./Services/Iot");
const ServerService = require("./Services/Socket");
const apiRouter = require("./Services/Api"); // <--- 1. Importar el router
const ambiental = new AmbientalModel();
const nodos = new NodoSensorModel();
const usuarios = new UsuarioModel();
const mqttService = new IoTService(process.env.MQTT_TOPIC);
const servidor = new ServerService();


servidor.app.use("/api", apiRouter({ ambiental, nodos, usuarios }));

async function main() {
  await Promise.all([
    ambiental.connect(),
    nodos.connect(),
    usuarios.connect(),
  ]);

  servidor.listen();

  mqttService.listener(guardarEnviarDataAmbiental);
}

async function guardarEnviarDataAmbiental(topic, message) {
  try {
    let datosJSON;
    try {
      datosJSON = JSON.parse(message);
    } catch {
      // Si el sensor envía un valor numérico simple
      const num = parseFloat(message);
      datosJSON = isNaN(num) ? { valor_crudo: message } : { temperatura: num };
    }

    if (typeof datosJSON !== "object" || datosJSON === null) {
      datosJSON = { valor: datosJSON };
    }

    datosJSON.topic = topic;
    datosJSON.sensor_id = datosJSON.sensor_id || "ESP32_01";

    await ambiental.insertAmbiental(datosJSON);
    servidor.emitirEvento("nuevo_dato_sensor", datosJSON);
  } catch (error) {
    console.error("Error procesando el mensaje MQTT:", error.message);
  }
}



main().catch(console.error);
