const mqtt = require("mqtt");

class IoTService {
  constructor(topic) {
    const credentials = {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
    };
    const mqttUrl = process.env.MQTT_URL || "mqtt://localhost:1883";
    this.mqttClient = mqtt.connect(mqttUrl, credentials);

    this.mqttClient.on("connect", () => {
      console.log("Conectado al Broker MQTT ---->", mqttUrl);
      this.mqttClient.subscribe(topic);
    });

    this.mqttClient.on("error", (err) => {
      console.error("🔴 Error de conexión MQTT en Node:", err.message);
    });
  }
  
  listener(callback) {
    this.mqttClient.on("message", async (topic, message) => {
      const valorRecibido = message.toString();
      console.log(`MQTT MESSAGE: Dato recibido en ${topic}: ${valorRecibido}`);

      await callback(topic, valorRecibido);
    });
  }
}

module.exports = IoTService;