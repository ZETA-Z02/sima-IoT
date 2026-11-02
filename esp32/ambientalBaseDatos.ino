#include <WiFi.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <DHT.h>
#include <Adafruit_BMP280.h>
#define BMP280_ADDRESS 0x77

// Configuracion de red wifi
const char* ssid = "";
const char* password = "";

// Configuracion del servidor MQTT
const char* mqtt_server = "192.168.18.7"; // IP donde está instalado Mosquitto
const int mqtt_port = 1883;
const char* mqtt_topic = "zeta/sensor1";
const char* user_mqtt = "iot_user";
const char* password_mqtt = "zeta";

// --- CONFIGURACIÓN DE SENSORES ---
#define DHTPIN 4
#define DHTTYPE DHT22 // Cambia a DHT11 si tu sensor es el azul
DHT dht(DHTPIN, DHTTYPE);
Adafruit_BMP280 bmp; // Usa I2C por hardware (Pines 21 y 22)

// Instancias de cliente
WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi(){
  delay(10);
  Serial.print("\nCOnectando a");
  Serial.println(ssid);
  WiFi.begin(ssid,password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  Serial.println("\nWiFi conectado. IP: " + WiFi.localIP().toString());
  
}

// Función para conectar y reconectar al broker MQTT
void reconnect() {
  while (!client.connected()) {
    Serial.print("Intentando conexión MQTT...");
    
    // Crear un ID de cliente aleatorio
    String clientId = "ESP32Client-";
    clientId += String(random(0, 1000), HEX);
    
    // Intentar conectar (si usas usuario y contraseña en mosquitto: client.connect(clientId.c_str(), "usuario", "password"))
    if (client.connect(clientId.c_str(), user_mqtt, password_mqtt)) {
      Serial.println("¡Conectado al broker!");
    } else {
      Serial.print("Falló, rc=");
      Serial.print(client.state());
      Serial.println(" Intentando de nuevo en 5 segundos...");
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  dht.begin();

  while (!Serial) delay(100);  // wait for native usb
  Serial.println(F("BMP280 test"));
  
  if(!bmp.begin(BMP280_ADDRESS)){
    Serial.println("No se encontro el sensor BMP280, verifica cableado");
  }
  
  setup_wifi(); 

  // Configurar el servidor MQTT
  client.setServer(mqtt_server, mqtt_port);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop(); // Mantiene viva la conexión MQTT

  // 1. Leer datos de los sensores
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  float p = bmp.readPressure(); // Convierte de Pascales a hPa (milibares)
  float altitude = bmp.readAltitude(1013.25);

  // Validar que las lecturas sean correctas
  if (isnan(t) || isnan(h)) {
    Serial.println("Error leyendo el DHT!");
    return;
  }

  // 2. Armar el JSON (Concatenación de Strings)
  // Formato destino: {"temperatura":25.5,"humedad":60.2,"presion":1013.25}
  String payload = "{";
  payload += "\"temperatura\":" + String(t) + ",";
  payload += "\"humedad\":" + String(h) + ",";
  payload += "\"presion\":" + String(p);
  payload += "}";

  // 3. Publicar por MQTT
  Serial.print("Publicando datos: ");
  Serial.println(payload);
  client.publish(mqtt_topic, payload.c_str());

  // Esperar 10 segundos antes de la siguiente lectura
  delay(1000);
}
