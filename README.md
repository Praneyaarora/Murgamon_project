# 🐔 Murgamon: AI-IoT Powered Smart Biosecurity and Livestock Monitoring System

![IoT Farm Schematic Block](https://user-images.githubusercontent.com/path/to/schematic-block.png)

*Next-generation predictive livestock health surveillance, disease outbreak prevention, and automated farm biosecurity compliance platform*

---

## Table of Contents
- [Overview](#overview)
- [System Architecture](#system-architecture)
  - [Animal Wearable Tags](#animal-wearable-tags)
  - [Farm Environmental Monitoring Hub (BOM)](#farm-environmental-monitoring-hub-bom)
  - [Smart Sprinkler Access System](#smart-sprinkler-access-system)
- [Software & Firmware Details](#software--firmware-details)
  - [Device Firmware](#device-firmware)
  - [Backend Platform](#backend-platform)
  - [AI/ML Pipeline](#aiml-pipeline)
  - [Web Dashboard](#web-dashboard)
- [Installation & Deployment](#installation--deployment)
- [Tech Stack](#tech-stack)
- [Features & Data Model](#features--data-model)
- [Alerts & Reporting](#alerts--reporting)

---

## Overview

**Problem:**
- Livestock farming is highly vulnerable to infectious disease outbreaks (avian influenza, swine fever, and more).
- Traditional surveillance is reactive; diagnosis occurs only when disease is visible, often too late to prevent large-scale losses.
- Biosecurity enforcement and compliance tracking remain tedious for farmers and regulators.
- Rapid disease spread threatens human health through zoonoses and ignites economic disruptions.

**Our Solution:**
- A comprehensive AI-IoT platform enabling real-time monitoring of animal health and farm biosecurity.
- Animal-wearable sensor tags for continuous vitals and traceability.
- Farm hub environmental monitoring with gas sensors, camera, and central control.
- Smart access system integrating RFID, sanitization (sprinkler), and automated entry/exit tracking.
- Machine learning models for predictive risk scoring, early outbreak detection, and actionable alerts.
- Multilingual dashboard for instant insights and compliance audit.

---

## System Architecture

### Animal Wearable Tags
- **Platform:** ESP32 + RAK3172 LoRa
- **Sensors:**
  - RFID RC522: Unique animal identification
  - DHT22: Temperature & humidity
  - MPU6050: Accelerometer for movement/activity
  - MAX30102: Heart rate & SpO₂
- **Communication:** LoRa P2P @ 866 MHz (India ISM band)
- **Power:** Rechargeable battery
- **Data Interval:** Configurable (default: 3s)
- **Firmware:** `Ear_Tag_esp32_code.ino` implements sensor reading and LoRa transmission.

---

### Farm Environmental Monitoring Hub (BOM)
- **Platform:** Raspberry Pi 3 Model B
- **Sensors:**
  - DHT22: Temperature & humidity
  - SCD4x: CO₂
  - PM2.5 sensor: Air quality
  - MCP3008 with NH₃ (ammonia), CO analog sensors
  - Camera module: Flock and barn monitoring
- **Communication:** LoRa receiver for tags/sprinklers; WiFi for cloud sync
- **Persistence:** Local SQLite database
- **Display:** LCD for status
- **Software:** `bom_system.py`, `smart_farm_bom_complete.py` handle data reception, storage, automation, and integrations.

---

### Smart Sprinkler Access System
- **Platform:** ESP32 + RAK3172 LoRa
- **Sensors:**
  - MFRC522: RFID for staff/visitor logs
  - HC-SR04: Ultrasonic presence detection (up to 120cm)
  - Moisture sensor (analog): Water tank level
- **Actuators:** Relay module for pump control; auto-sanitization after 5s entry delay.
- **Persistence:** SPIFFS for entry/exit/event logs
- **Firmware:** `Sprinkler_esp32.ino` implements RFID tracking, relay control, and LoRa reporting.
- **Features:** Entry/exit tracking, automatic sanitization, water level alerts, LoRa events

---

## Software & Firmware Details

### Device Firmware
- **Ear_Tag_esp32_code.ino:**
  - RFID, DHT22, MPU6050, MAX30102 sensor initialization
  - LoRa UART AT command communication
  - JSON payload encoding and transmission
  - Secure retry logic for LoRa transmission

- **Sprinkler_esp32.ino:**
  - RFID + ultrasonic for entry/exit events
  - Water tank management
  - Automatic relay/pump control for sanitization
  - Persistent log writing
  - Real-time LoRa reporting to BOM

---

### Backend Platform
- **BOM Hub** (`bom_system.py`, `smart_farm_bom_complete.py`):
  - Sensor acquisition and aggregation
  - LoRa data reception (tags/sprinkler)
  - SQLite data storage and updates
  - Camera image capture
  - Real-time status analytics
  - Integration with alert & cloud sync modules

- **Cloud Sync** (`cloud_sync.py`): Efficient periodic/batch upload to remote server; robust retry and status tracking.

- **Alert System** (`alert_system.py`): Custom threshold rules, SQL logging, email/SMS/webhooks for actionable events.

---

### AI/ML Pipeline
- **Pipeline Notebook** (`AIML_MODEL_PROJECT_MURGAMON.ipynb`):
  - Data ingestion, feature engineering (vitals, environment, behavioral)
  - XGBoost models for health classification and outbreak prediction
  - Proposed CNN/LSTM/YOLO models for advanced behavior & anomaly detection
  - Outputs: Individual health class, disease risk, farm outbreak probability, compliance score

---

### Web Dashboard
- **Frontend:** Modern stack, including React, TypeScript, Vite, Tailwind, Shadcn/Radix UI
- **Features:**
  - Live sensor and model output monitoring for each animal/farm
  - Status visualization, analytics, historical trends
  - Downloadable CSV/PDF health/compliance reports
  - Alert notifications with role-based access for farmers/vets/government
  - Configurable action logs and workflow auditing

---

## Installation & Deployment

### Hardware
- Wire ESP32, RFID, sensors, and relay as shown in schematic/block diagrams
- Place tags on animals, deploy BOM in central barn, setup sprinkler systems at all access points
- Calibrate all sensors according to farm conditions and livestock type

### Software
- `git clone <repo-url> && cd Murgamon`
- Setup Pi BOM with Python 3 and necessary libraries
- Place scripts in designated Pi folders; configure paths in `.ini`
- Build dashboard: `npm install`, `npm run dev` (for production `npm run build && npm run preview`)
- Ensure LoRa initialization and cloud API keys are properly set

---

## Tech Stack
- **Backend:** Python 3, SQLite, OpenCV, Adafruit/Raspberry Pi libraries
- **Frontend:** React, TypeScript, Tailwind, Shadcn
- **Microcontrollers:** ESP32, LoRa RAK3172
- **AI/ML:** XGBoost, (planned: YOLO/CNN)
- **Protocols:** LoRaWAN, WiFi, REST API sync

---

## Features & Data Model

| Category         | Features                              | Source                  |
|------------------|--------------------------------------|-------------------------|
| Animal Vitals    | Temperature, HR, SpO₂, Activity      | Animal Tag (ESP32)      |
| Animal ID/Trace  | RFID events, tag data                | Ear tag/sprinkler ESP32 |
| Access Log       | Entry/exit, compliance               | Sprinkler ESP32         |
| Sprinkler Log    | Tank level, sanitization cycles      | Moisture, relay, logs   |
| Environment      | Temp, NH₃, CO₂, PM2.5, CO, humidity  | BOM Hub Sensors         |
| Motion & Camera  | Posture, movement, flock analysis    | BOM Camera + ML         |

---

## Alerts & Reporting
- Custom threshold rules for all sensors; real-time alerts
- Multi-channel notifications: email, SMS, webhook/Twilio
- Downloadable farm health/compliance reports (CSV/PDF)
- Full audit trail for regulatory compliance and outbreak reporting

---

## License & Citation
This repository is open-source for educational and research purposes. Cite usage in academic works or contact project authors for enterprise deployment.
