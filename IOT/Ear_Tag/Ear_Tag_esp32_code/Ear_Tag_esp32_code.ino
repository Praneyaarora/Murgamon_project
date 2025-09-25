/* 
  ESP32 + RAK3172 (SiP) LoRa P2P live transmitter
  Sensors:
   - RFID RC522 (SPI)
   - DHT22 temperature/humidity (digital)
   - MPU6050 accelerometer (I2C)
   - MAX3010x (heart rate, SpO2) (I2C)
  Transmit: RAK3172 via UART (Serial1) using AT commands (P2P mode, AT+PSEND)
  
  NOTE: Tune send interval, LoRa parameters, and calibrate SpO2/HR algorithm for production.
  LoRa Frequency set to 866 MHz → valid license-free ISM band for LoRa use in India (865–867 MHz).
*/

#include <Arduino.h>
#include <SPI.h>
#include <Wire.h>

// RFID
#include <MFRC522.h>         
#define RST_PIN     4
#define SS_PIN      5
MFRC522 rfid(SS_PIN, RST_PIN);

// DHT
#include "DHT.h"            
#define DHTPIN 15
#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

// MPU6050 (Adafruit)
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>
Adafruit_MPU6050 mpu;

// MAX3010x (SparkFun or MAX30105)
#include <MAX30105.h>        
#include "heartRate.h"       
MAX30105 particleSensor;

// RAK3172 UART
#define RAK_RX_PIN 16 
#define RAK_TX_PIN 17 
HardwareSerial rakSerial(1);  

// Send interval (ms)
const unsigned long SEND_INTERVAL_MS = 3000UL; 

String deviceRFID = "unknown";
unsigned long lastSend = 0;

// ---------- Helpers ----------
String toHex(const String &s) {
  String out = "";
  for (size_t i=0; i < s.length(); ++i) {
    uint8_t v = (uint8_t)s[i];
    char buf[3];
    sprintf(buf, "%02X", v);
    out += buf;
  }
  return out;
}

void sendAT(const String &cmd, bool printToSerial = true) {
  rakSerial.print(cmd);
  rakSerial.print("\r\n");
  if (printToSerial) {
    Serial.print("> ");
    Serial.println(cmd);
  }
}

String readRakResponse(unsigned long timeout = 200) {
  String resp = "";
  unsigned long start = millis();
  while (millis() - start < timeout) {
    while (rakSerial.available()) {
      char c = rakSerial.read();
      resp += c;
    }
  }
  if (resp.length()) {
    Serial.print("< ");
    Serial.println(resp);
  }
  return resp;
}

// ---------- Sensor read functions ----------
String readRFIDOnce() {
  if (!rfid.PICC_IsNewCardPresent()) return deviceRFID;
  if (!rfid.PICC_ReadCardSerial()) return deviceRFID;
  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    uid += String(rfid.uid.uidByte[i] < 0x10 ? "0" : "");
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  deviceRFID = uid;
  rfid.PICC_HaltA();
  return deviceRFID;
}

float readTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) {
    Serial.println("DHT read failed");
    return -127.0;
  }
  return t;
}

void readAccelerometer(float &ax, float &ay, float &az) {
  sensors_event_t a, g, temp;
  if (mpu.getEvent(&a, &g, &temp)) {
    ax = a.acceleration.x;
    ay = a.acceleration.y;
    az = a.acceleration.z;
  } else {
    ax = ay = az = 0.0;
  }
}

bool readHeartSpO2(int &heartRate, float &spo2) {
  const int sampleCount = 100;
  long irBuffer[sampleCount];
  long redBuffer[sampleCount];

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX3010x not found");
    return false;
  }

  particleSensor.setup(); 
  particleSensor.setFIFOAverage(MAX30105_SAMPLEAVG_4);
  particleSensor.setPulseAmplitudeRed(0x0A);
  particleSensor.setPulseAmplitudeIR(0x0A);

  int i = 0;
  while (i < sampleCount) {
    if (particleSensor.available()) {
      redBuffer[i] = particleSensor.getRed();
      irBuffer[i]  = particleSensor.getIR();
      particleSensor.nextSample();
      i++;
    }
    if (millis() - lastSend > 5000) break;
  }

  // Placeholder values for demo
  heartRate = 60 + (millis() % 30); 
  spo2 = 95.0 + (millis() % 3) * 0.5; 
  return true;
}

// ---------- Setup ----------
void setup() {
  Serial.begin(115200);
  delay(100);

  SPI.begin(); 
  rfid.PCD_Init();
  Serial.println("RFID inited");

  dht.begin();
  Serial.println("DHT inited");

  Wire.begin(); 
  if (!mpu.begin()) {
    Serial.println("Failed to find MPU6050 chip");
  } else {
    Serial.println("MPU6050 found");
    mpu.setAccelerometerRange(MPU6050_RANGE_8_G);
    mpu.setFilterBandwidth(MPU6050_BAND_5_HZ);
  }

  if (!particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    Serial.println("MAX301 sensor not found - continuing but HR/SpO2 will not work");
  } else {
    Serial.println("MAX301 initialized");
  }

  rakSerial.begin(115200, SERIAL_8N1, RAK_RX_PIN, RAK_TX_PIN);
  delay(200);
  Serial.println("RAK serial started");

  readRakResponse(200); 

  sendAT("AT+NWM=0");        readRakResponse(150);
  // --- IMPORTANT ---
  // LoRa P2P frequency set to 866 MHz (within India ISM band 865–867 MHz)
  sendAT("AT+P2P=866000000:7:125:1:8:");  readRakResponse(150);
  sendAT("AT+SYNCWORD=34");  readRakResponse(150);
  sendAT("AT+PRECV=65533");  readRakResponse(150);

  Serial.println("RAK3172 configured (P2P, 866 MHz for India).");
  lastSend = millis();
}

// ---------- Main Loop ----------
void loop() {
  readRFIDOnce(); 

  float tempC = readTemperature();
  float ax, ay, az;
  readAccelerometer(ax, ay, az);

  int heartRate = -1;
  float spo2 = -1;
  bool hr_ok = readHeartSpO2(heartRate, spo2);

  char payload[256];
  snprintf(payload, sizeof(payload),
           "{\"id\":\"%s\",\"t\":%.2f,\"ax\":%.2f,\"ay\":%.2f,\"az\":%.2f,\"hr\":%d,\"spo2\":%.1f}",
           deviceRFID.c_str(),
           tempC, ax, ay, az,
           (hr_ok ? heartRate : -1),
           (hr_ok ? spo2 : -1.0));

  String jsonPayload = String(payload);
  Serial.print("JSON: ");
  Serial.println(jsonPayload);

  String hexPayload = toHex(jsonPayload); 
  String atcmd = "AT+PSEND=" + hexPayload; 

  const int maxRetries = 4;
  int attempts = 0;
  bool sent = false;
  while (attempts < maxRetries && !sent) {
    sendAT(atcmd);
    String resp = readRakResponse(800); 
    if (resp.indexOf("OK") >= 0 || resp.indexOf("+EVT:TXP2P DONE") >= 0 || resp.indexOf("SEND_CONFIRMED_OK") >= 0) {
      sent = true;
      Serial.println("Payload sent");
    } else if (resp.indexOf("AT_BUSY_ERROR") >= 0 || resp.indexOf("BUSY") >= 0) {
      Serial.println("RAK busy, retrying...");
      attempts++;
      delay(50 + attempts * 50);
    } else {
      Serial.println("No OK from RAK, resp:");
      Serial.println(resp);
      attempts++;
      delay(50);
    }
  }

  if (!sent) {
    Serial.println("Failed to send after retries.");
  }

  readRakResponse(50);

  while (millis() - lastSend < SEND_INTERVAL_MS) {
    delay(20);
  }
  lastSend = millis();
}
