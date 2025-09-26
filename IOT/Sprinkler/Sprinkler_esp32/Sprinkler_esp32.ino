/*
  Smart Farm Entry/Exit Sanitization System
  - Platform: ESP32
  - LoRa: RAK3172 (SiP) via Serial1 AT commands (P2P mode)
  - Frequency: 866 MHz (India ISM band 865-867 MHz)
  - Components:
      * Ultrasonic (HC-SR04) -> presence detection
      * MFRC522 RFID -> identify person (UID)
      * Moisture sensor -> water tank level monitoring
      * Relay -> pump/sanitizer control
  - Storage: SPIFFS for logs and inside list
  - Features:
      1) Presence detection -> RFID scan -> Entry/Exit tracking
      2) Automatic sanitization after 5s delay for entry
      3) Water tank level monitoring with low water alerts
      4) Real-time data transmission to BOM via LoRa
      5) Complete record maintenance with timestamps
*/

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include "time.h"
#include <ArduinoJson.h>

// RFID RC522
#include <MFRC522.h>
#define RFID_SS_PIN 5
#define RFID_RST_PIN 4
MFRC522 rfid(RFID_SS_PIN, RFID_RST_PIN);

// Ultrasonic HC-SR04
#define TRIG_PIN 12
#define ECHO_PIN 13
const unsigned int PRESENCE_DISTANCE_CM = 120;

// Moisture sensor (analog)
#define MOISTURE_PIN 34  // ADC1_6
const int MOISTURE_LOW_THRESHOLD = 1000;    // Adjust based on your sensor (0-4095 range)
const int MOISTURE_HIGH_THRESHOLD = 3000;   // Value when tank is full
const unsigned long MOISTURE_CHECK_INTERVAL = 30000; // Check every 30 seconds
const unsigned long MOISTURE_ALERT_INTERVAL = 300000; // Alert every 5 minutes if low

// Relay / Pump
#define RELAY_PIN 14
const unsigned long SANITIZE_DELAY_MS = 5000UL;       // 5 seconds after entering
const unsigned long SANITIZE_DURATION_MS = 10000UL;   // pump on for 10 seconds

// RAK3172 UART (Serial1)
#define RAK_RX_PIN 16
#define RAK_TX_PIN 17
HardwareSerial rakSerial(1);

// LoRa settings (P2P at India frequency)
const char *LORA_P2P_CMD = "AT+P2P=866000000:7:125:1:8:";
const char *LORA_SYNCWORD_CMD = "AT+SYNCWORD=34";
const char *LORA_PRECV_CMD = "AT+PRECV=65533";

// File paths on SPIFFS
const char *LOG_PATH = "/events.csv";
const char *INSIDE_PATH = "/inside.txt";

// WiFi credentials (Optional for NTP)
const char *WIFI_SSID = "";    // Set your WiFi credentials
const char *WIFI_PASS = "";
const char *NTP_POOL = "pool.ntp.org";

// Timing constants
const unsigned long LORA_CMD_RESP_TIMEOUT = 1000;
const unsigned long RFID_WAIT_AFTER_PRESENCE_MS = 10000UL;
const unsigned long PRESENCE_POLL_MS = 200;

// Global variables
unsigned long lastPresenceCheck = 0;
unsigned long lastMoistureCheck = 0;
unsigned long lastMoistureAlert = 0;
bool lowWaterAlertSent = false;
bool tankRefillNeeded = false;

// System states
enum SystemState {
  IDLE,
  PRESENCE_DETECTED,
  WAITING_FOR_RFID,
  PROCESSING_ENTRY,
  SANITIZING,
  PROCESSING_EXIT
};

SystemState currentState = IDLE;
unsigned long stateStartTime = 0;

// ---------- Utility Functions ----------

String uidToString(MFRC522::Uid &uid) {
  String s = "";
  for (byte i = 0; i < uid.size; i++) {
    if (uid.uidByte[i] < 0x10) s += "0";
    s += String(uid.uidByte[i], HEX);
  }
  s.toUpperCase();
  return s;
}

void rakSendAT(const String &cmd, bool printToSerial = true) {
  rakSerial.print(cmd);
  rakSerial.print("\r\n");
  if (printToSerial) {
    Serial.print("> ");
    Serial.println(cmd);
  }
}

String rakReadResponse(unsigned long timeout = 300) {
  String resp = "";
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (rakSerial.available()) {
      char c = rakSerial.read();
      resp += c;
    }
    if (resp.indexOf("\n") >= 0) break; // Got complete response
  }
  if (resp.length()) {
    Serial.print("< ");
    Serial.println(resp);
  }
  return resp;
}

String toHex(const String &s) {
  String out = "";
  for (size_t i = 0; i < s.length(); ++i) {
    uint8_t v = (uint8_t)s[i];
    char buf[3];
    sprintf(buf, "%02X", v);
    out += buf;
  }
  return out;
}

// ---------- SPIFFS Functions ----------

bool ensureSPIFFS() {
  if (!SPIFFS.begin(true)) {
    Serial.println("SPIFFS mount failed");
    return false;
  }
  return true;
}

String getTimestamp() {
  time_t now;
  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    char tbuf[32];
    strftime(tbuf, sizeof(tbuf), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
    return String(tbuf);
  } else {
    return String("uptime_ms:") + String(millis());
  }
}

std::vector<String> readInsideList() {
  std::vector<String> v;
  if (!SPIFFS.exists(INSIDE_PATH)) return v;
  File f = SPIFFS.open(INSIDE_PATH, FILE_READ);
  if (!f) return v;
  while (f.available()) {
    String line = f.readStringUntil('\n');
    line.trim();
    if (line.length()) v.push_back(line);
  }
  f.close();
  return v;
}

bool uidInList(const String &uid) {
  auto v = readInsideList();
  for (auto &s : v) if (s == uid) return true;
  return false;
}

bool addUidToInside(const String &uid) {
  if (uidInList(uid)) return false;
  File f = SPIFFS.open(INSIDE_PATH, FILE_APPEND);
  if (!f) return false;
  f.println(uid);
  f.close();
  return true;
}

bool removeUidFromInside(const String &uid) {
  auto v = readInsideList();
  bool found = false;
  std::vector<String> newv;
  for (auto &s : v) {
    if (s == uid) { found = true; continue; }
    newv.push_back(s);
  }
  File f = SPIFFS.open(INSIDE_PATH, FILE_WRITE);
  if (!f) return found;
  for (auto &s : newv) f.println(s);
  f.close();
  return found;
}

bool appendLog(const String &uid, const String &action, const String &timestamp, const String &extra = "") {
  if (!ensureSPIFFS()) return false;
  File f = SPIFFS.open(LOG_PATH, FILE_APPEND);
  if (!f) return false;
  String line = timestamp + "," + uid + "," + action;
  if (extra.length()) line += "," + extra;
  f.println(line);
  f.close();
  Serial.println("Logged: " + line);
  return true;
}

// ---------- Sensor Functions ----------

long readUltrasonicCM() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000);
  if (duration == 0) return 10000;
  long cm = duration / 29 / 2;
  return cm;
}

int readMoistureRaw() {
  return analogRead(MOISTURE_PIN);
}

float getMoisturePercentage() {
  int raw = readMoistureRaw();
  // Convert raw reading to percentage (adjust based on sensor calibration)
  float percentage = map(raw, MOISTURE_LOW_THRESHOLD, MOISTURE_HIGH_THRESHOLD, 0, 100);
  percentage = constrain(percentage, 0, 100);
  return percentage;
}

bool isWaterTankLow() {
  int moistureLevel = readMoistureRaw();
  return moistureLevel < MOISTURE_LOW_THRESHOLD;
}

// ---------- LoRa Functions ----------

void loraInit() {
  rakSerial.begin(115200, SERIAL_8N1, RAK_RX_PIN, RAK_TX_PIN);
  delay(500);

  // Clear any pending data
  while(rakSerial.available()) rakSerial.read();

  // Initialize RAK3172 for P2P mode
  rakSendAT("AT+NWM=0");
  delay(200);
  rakReadResponse(500);

  rakSendAT(LORA_P2P_CMD);
  delay(200);
  rakReadResponse(500);

  rakSendAT(LORA_SYNCWORD_CMD);
  delay(100);
  rakReadResponse(300);

  rakSendAT(LORA_PRECV_CMD);
  delay(100);
  rakReadResponse(300);

  Serial.println("RAK3172 configured for P2P mode at 866 MHz");
}

bool loraSendData(const String &messageType, const String &data) {
  // Create JSON payload
  StaticJsonDocument<512> doc;
  doc["type"] = messageType;
  doc["timestamp"] = getTimestamp();
  doc["device_id"] = "FARM_GATE_01";

  if (messageType == "ENTRY" || messageType == "EXIT") {
    doc["rfid_uid"] = data.substring(0, data.indexOf(','));
    doc["action"] = data.substring(data.indexOf(',') + 1);
  } else if (messageType == "WATER_ALERT") {
    doc["moisture_level"] = data.toFloat();
    doc["alert"] = "LOW_WATER_TANK";
  } else if (messageType == "MOISTURE_STATUS") {
    doc["moisture_level"] = data.toFloat();
    doc["tank_status"] = data.toFloat() > 30 ? "OK" : "LOW";
  }

  String payload;
  serializeJson(doc, payload);

  String hexPayload = toHex(payload);
  String atCommand = "AT+PSEND=" + hexPayload;

  rakSendAT(atCommand);
  String response = rakReadResponse(LORA_CMD_RESP_TIMEOUT);

  bool success = (response.indexOf("OK") >= 0 || response.indexOf("+EVT:TXP2P DONE") >= 0);

  if (success) {
    Serial.println("LoRa transmission successful: " + messageType);
  } else {
    Serial.println("LoRa transmission failed: " + response);
  }

  return success;
}

// ---------- System Functions ----------

void doSanitizeCycle() {
  Serial.println("Starting sanitization cycle...");

  // Check if we have water before starting
  if (isWaterTankLow()) {
    Serial.println("WARNING: Water tank is low! Sanitization may not be effective.");
    tankRefillNeeded = true;
  }

  digitalWrite(RELAY_PIN, HIGH);
  Serial.println("Pump ON - Sanitizing...");

  unsigned long startTime = millis();
  while (millis() - startTime < SANITIZE_DURATION_MS) {
    // Monitor water level during sanitization
    if (millis() % 1000 == 0) { // Check every second
      float moisture = getMoisturePercentage();
      Serial.printf("Sanitizing... Water level: %.1f%%\n", moisture);
    }
    delay(50);
  }

  digitalWrite(RELAY_PIN, LOW);
  Serial.println("Sanitization completed - Pump OFF");

  // Log sanitization event
  appendLog("SYSTEM", "SANITIZE_COMPLETE", getTimestamp(), String(getMoisturePercentage()));
}

void checkMoistureLevels() {
  unsigned long now = millis();

  if (now - lastMoistureCheck >= MOISTURE_CHECK_INTERVAL) {
    lastMoistureCheck = now;

    float moisturePercent = getMoisturePercentage();
    int moistureRaw = readMoistureRaw();

    Serial.printf("Water tank level: %.1f%% (raw: %d)\n", moisturePercent, moistureRaw);

    // Send periodic moisture status
    loraSendData("MOISTURE_STATUS", String(moisturePercent));

    // Check for low water condition
    if (isWaterTankLow()) {
      if (!lowWaterAlertSent || (now - lastMoistureAlert >= MOISTURE_ALERT_INTERVAL)) {
        Serial.println("ALERT: Water tank is LOW! Please refill.");
        loraSendData("WATER_ALERT", String(moisturePercent));
        lowWaterAlertSent = true;
        lastMoistureAlert = now;
        tankRefillNeeded = true;

        // Log low water event
        appendLog("SYSTEM", "LOW_WATER_ALERT", getTimestamp(), String(moisturePercent));
      }
    } else {
      // Reset alert flag when water is sufficient
      if (lowWaterAlertSent && moisturePercent > 40) {
        lowWaterAlertSent = false;
        tankRefillNeeded = false;
        Serial.println("Water tank level restored to normal");
        appendLog("SYSTEM", "WATER_LEVEL_NORMAL", getTimestamp(), String(moisturePercent));
      }
    }
  }
}

String waitForRFID(unsigned long timeoutMs) {
  unsigned long start = millis();
  while (millis() - start < timeoutMs) {
    if (rfid.PICC_IsNewCardPresent()) {
      if (rfid.PICC_ReadCardSerial()) {
        String uid = uidToString(rfid.uid);
        rfid.PICC_HaltA();
        rfid.PCD_StopCrypto1();
        return uid;
      }
    }
    delay(50);
  }
  return "";
}

bool setupWiFiAndTime() {
  if (String(WIFI_SSID).length() == 0 || String(WIFI_SSID) == "") {
    Serial.println("WiFi credentials not configured, skipping NTP setup");
    return false;
  }

  WiFi.begin(WIFI_SSID, WIFI_PASS);
  Serial.print("Connecting to WiFi");

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection failed");
    return false;
  }

  Serial.println("WiFi connected, configuring NTP...");
  configTime(19800, 0, NTP_POOL); // IST offset (UTC+5:30)
  delay(2000);

  struct tm timeinfo;
  if (getLocalTime(&timeinfo)) {
    Serial.println("Time synchronized successfully");
    return true;
  } else {
    Serial.println("Time synchronization failed");
    return false;
  }
}

// ---------- Main Setup ----------

void setup() {
  Serial.begin(115200);
  delay(1000);
  Serial.println("\n=== Smart Farm Entry/Exit System Starting ===");

  // Initialize pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(MOISTURE_PIN, INPUT);

  digitalWrite(RELAY_PIN, LOW); // Ensure pump is OFF

  // Initialize SPI for RFID
  SPI.begin();
  rfid.PCD_Init();
  Serial.println("RFID initialized");

  // Initialize SPIFFS
  if (ensureSPIFFS()) {
    Serial.println("SPIFFS mounted successfully");
  } else {
    Serial.println("SPIFFS mount failed - continuing without persistent storage");
  }

  // Setup WiFi and time
  setupWiFiAndTime();

  // Initialize LoRa
  loraInit();

  // Initial moisture reading
  float initialMoisture = getMoisturePercentage();
  Serial.printf("Initial water tank level: %.1f%%\n", initialMoisture);

  // startup message
  loraSendData("SYSTEM_STARTUP", String(initialMoisture));

  Serial.println("=== System Ready ===\n");

  lastPresenceCheck = millis();
  lastMoistureCheck = millis();
  stateStartTime = millis();
}

// ---------- Main Loop ----------

void loop() {
  unsigned long now = millis();

  // Always check moisture levels
  checkMoistureLevels();

  // State machine for main system operation
  switch (currentState) {

    case IDLE:
      if (now - lastPresenceCheck >= PRESENCE_POLL_MS) {
        lastPresenceCheck = now;
        long distance = readUltrasonicCM();

        if (distance > 0 && distance <= PRESENCE_DISTANCE_CM) {
          Serial.printf("Presence detected at %ld cm\n", distance);
          currentState = WAITING_FOR_RFID;
          stateStartTime = now;
        }
      }
      break;

    case WAITING_FOR_RFID:
      {
        String uid = waitForRFID(100); // Quick check

        if (uid.length() > 0) {
          Serial.println("RFID detected: " + uid);
          String timestamp = getTimestamp();

          if (!uidInList(uid)) {
            // ENTRY process
            Serial.println("Processing ENTRY for " + uid);
            addUidToInside(uid);
            appendLog(uid, "ENTER", timestamp);
            loraSendData("ENTRY", uid + ",ENTER");

            currentState = PROCESSING_ENTRY;
            stateStartTime = now;
          } else {
            // EXIT process
            Serial.println("Processing EXIT for " + uid);
            removeUidFromInside(uid);
            appendLog(uid, "EXIT", timestamp);
            loraSendData("EXIT", uid + ",EXIT");

            currentState = IDLE;
            delay(1000); // Brief delay to avoid immediate re-trigger
          }
        } else if (now - stateStartTime >= RFID_WAIT_AFTER_PRESENCE_MS) {
          Serial.println("RFID scan timeout - returning to IDLE");
          currentState = IDLE;
        }
      }
      break;

    case PROCESSING_ENTRY:
      if (now - stateStartTime >= SANITIZE_DELAY_MS) {
        Serial.println("Starting sanitization after entry delay");
        currentState = SANITIZING;
        stateStartTime = now;
        doSanitizeCycle();
      }
      break;

    case SANITIZING:
      // Sanitization is handled in doSanitizeCycle()
      currentState = IDLE;
      delay(2000); // Prevent immediate re-trigger
      break;
  }

  // Small delay to prevent excessive CPU usage
  delay(10);
}
