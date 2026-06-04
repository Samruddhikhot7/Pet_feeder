#include <WiFi.h>
#include <PubSubClient.h>
#include <ESP32Servo.h>

// ========== WiFi Configuration ==========
const char* ssid = "Oppo";
const char* password = "123456789k";

// ========== MQTT Configuration ==========
const char* mqtt_server = "broker.hivemq.com";
const int mqtt_port = 1883;

// IMPORTANT: Replace YOUR_USER_ID with your actual MongoDB user ID
// Get it from: MongoDB Atlas dashboard or from the app after login
const char* user_id = "69e70b4d05ac4e827c82c6db";  // Your MongoDB Atlas Account ID

// Dynamically construct topic
char topic[100];

// ========== Servo Configuration ==========
Servo myServo;
const int servoPin = 18;
const int servoOpenAngle = 0;   // 0 means spin full speed (continuous servo)
const int servoCloseAngle = 90; // 90 means stop (continuous servo)

// ========== Client Objects ==========
WiFiClient espClient;
PubSubClient client(espClient);

// ========== Status Variables ==========
unsigned long lastReconnectAttempt = 0;
const unsigned long reconnectInterval = 5000; // Try reconnect every 5 seconds
bool isFeeding = false; // Prevents recursive feeding over MQTT

// ========== Setup WiFi ==========
void setup_wifi() {
  delay(10);
  Serial.println("\n\n[WiFi] Connecting to: " + String(ssid));
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected!");
    Serial.println("[WiFi] IP address: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WiFi] Failed to connect. Retrying...");
  }
}

// ========== Smart Delay ==========
void smartDelay(int ms) {
  unsigned long start = millis();
  while (millis() - start < ms) {
    client.loop(); // Keep MQTT alive
    delay(10);
  }
}

// ========== Servo Control ==========
void feedPet(int durationMs, String level) {
  isFeeding = true;
  Serial.println("[Servo] Starting feed sequence - Level: " + level + ", Duration: " + String(durationMs) + "ms");
  
  // Open servo (spin)
  myServo.write(servoOpenAngle);
  Serial.println("[Servo] Opening/Spinning (angle: " + String(servoOpenAngle) + ")");
  smartDelay(500); // Let servo reach position
  
  // Keep open/spinning for specified duration
  smartDelay(durationMs);
  
  // Close servo (stop)
  myServo.write(servoCloseAngle);
  Serial.println("[Servo] Closing/Stopping (angle: " + String(servoCloseAngle) + ")");
  
  Serial.println("[Servo] Feeding complete!");
  isFeeding = false;
}

// ========== MQTT Callback ==========
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.println("[MQTT] Message received on topic: " + String(topic));

  if (isFeeding) {
    Serial.println("[MQTT] Ignored message - already feeding");
    return;
  }
  
  // Convert payload to string
  String msg = "";
  for (int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }
  
  Serial.println("[MQTT] Payload: " + msg);

  // Parse JSON message
  // Expected format: {"command":"feed_now","level":"medium","timestamp":123456}
  
  if (msg.indexOf("feed_now") != -1) {
    String level = "medium"; // default
    int duration = 40000; // default: 40 seconds for medium
    
    // Parse level
    if (msg.indexOf("\"level\":\"low\"") != -1 || msg.indexOf("low") != -1) {
      level = "low";
      duration = 20000; // 20 seconds for low
    } 
    else if (msg.indexOf("\"level\":\"high\"") != -1 || msg.indexOf("high") != -1) {
      level = "high";
      duration = 60000; // 60 seconds for high
    }
    else {
      level = "medium";
      duration = 40000; // 40 seconds for medium
    }
    
    Serial.println("[Feed] Triggering feed - Level: " + level + ", Duration: " + String(duration) + "ms");
    feedPet(duration, level);
  } else {
    Serial.println("[MQTT] Unknown command received");
  }
}

// ========== MQTT Reconnect ==========
void reconnect() {
  // Limit reconnect attempts
  if (millis() - lastReconnectAttempt < reconnectInterval) {
    return;
  }
  lastReconnectAttempt = millis();

  if (client.connected()) {
    return;
  }

  Serial.println("[MQTT] Attempting to connect...");
  
  // Create a client ID
  String clientId = "ESP32_Feeder_";
  clientId += String(random(0xffff), HEX);
  
  // Attempt to connect
  if (client.connect(clientId.c_str())) {
    Serial.println("[MQTT] Connected!");
    Serial.println("[MQTT] Subscribing to: " + String(topic));
    client.subscribe(topic);
  } else {
    Serial.print("[MQTT] Failed to connect, rc=");
    Serial.print(client.state());
    Serial.println(" (will retry in 5 seconds)");
  }
}

// ========== Setup ==========
void setup() {
  Serial.begin(115200);
  delay(2000); // Give serial monitor time to connect
  
  Serial.println("\n\n================================================");
  Serial.println("      Smart Pet Feeder - ESP32 Starting");
  Serial.println("================================================");
  
  // Construct MQTT topic
  snprintf(topic, sizeof(topic), "petfeeder/%s/feed", user_id);
  Serial.println("[Config] User ID: " + String(user_id));
  Serial.println("[Config] MQTT Topic: " + String(topic));
  Serial.println("[Config] MQTT Broker: " + String(mqtt_server) + ":" + String(mqtt_port));
  
  // Setup WiFi
  setup_wifi();
  
  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // Setup Servo
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  myServo.setPeriodHertz(50); // standard 50 hz servo
  myServo.attach(servoPin, 500, 2400); // Attach with standard min/max pulse width
  myServo.write(servoCloseAngle); // Start in closed position
  Serial.println("[Servo] Attached to GPIO " + String(servoPin) + ", initialized to closed position");
  
  Serial.println("\n[Ready] Waiting for MQTT connection...");
  Serial.println("================================================\n");
  
  // Initialize random seed for client ID
  randomSeed(analogRead(0));
}

// ========== Loop ==========
void loop() {
  // Reconnect WiFi if needed
  if (WiFi.status() != WL_CONNECTED) {
    static unsigned long lastWifiCheck = 0;
    // Check every 10 seconds
    if (millis() - lastWifiCheck >= 10000) { 
      lastWifiCheck = millis();
      Serial.println("[WiFi] Disconnected, attempting to reconnect...");
      WiFi.disconnect();
      WiFi.begin(ssid, password);
    }
    delay(10);
    return; // Don't proceed to MQTT if WiFi is disconnected
  }
  
  // Reconnect MQTT if needed
  if (!client.connected()) {
    reconnect();
  } else {
    // Process MQTT messages only if connected
    client.loop();
  }
  
  delay(10); // Small delay to prevent watchdog trigger
}
