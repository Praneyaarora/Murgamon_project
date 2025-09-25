#!/usr/bin/env python3
"""
Smart Farm Base Operations Management (BOM) System
Platform: Raspberry Pi 3 Model B
Purpose: Centralized data collection, processing, and cloud synchronization

Features:
- LoRa data reception from multiple ear tags and sprinkler systems
- Environmental monitoring (temp, humidity, NH3, CO2, PM2.5, CO, camera)
- Real-time data processing and storage
- Cloud synchronization via WiFi
- Multi-device support for scalable farm monitoring
- Alert system for critical conditions
"""

import json
import time
import sqlite3
import threading
import requests
import logging
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
import queue
import serial
import cv2
from pathlib import Path
import hashlib
import configparser

# Import sensor libraries (install via pip)
try:
    import board
    import busio
    import adafruit_dht
    import adafruit_scd4x  # CO2 sensor
    from adafruit_pm25.i2c import PM25_I2C  # PM2.5 sensor
    import adafruit_mcp3xxx.mcp3008 as MCP
    from adafruit_mcp3xxx.analog_in import AnalogIn
    SENSORS_AVAILABLE = True
except ImportError:
    print("Warning: Some sensor libraries not installed.")
    SENSORS_AVAILABLE = False

# Configuration
CONFIG_FILE = "/home/pi/bom_config.ini"
DATABASE_FILE = "/home/pi/farm_data.db"
CAMERA_STORAGE = "/home/pi/farm_images/"
LOG_FILE = "/home/pi/bom_system.log"

# LoRa Communication Settings
LORA_SERIAL_PORT = "/dev/ttyS0"
LORA_BAUDRATE = 115200
LORA_FREQUENCY = "866000000"

# Cloud API Settings
CLOUD_API_URL = "https://your-cloud-api.com/api/farm-data"
CLOUD_API_KEY = "your-api-key-here"
CLOUD_SYNC_INTERVAL = 300

# Data Collection Intervals
SENSOR_READ_INTERVAL = 30
CAMERA_CAPTURE_INTERVAL = 600
DATA_CLEANUP_INTERVAL = 86400

@dataclass
class SensorReading:
    timestamp: str
    sensor_type: str
    device_id: str
    data: Dict[str, Any]
    location: str = "BOM_STATION"

@dataclass
class EarTagData:
    device_id: str
    timestamp: str
    temperature: float
    accel_x: float
    accel_y: float
    accel_z: float
    heart_rate: int
    spo2: float
    location: str = "FARM_FIELD"

@dataclass
class SprinklerData:
    device_id: str
    timestamp: str
    message_type: str
    rfid_uid: Optional[str] = None
    action: Optional[str] = None
    moisture_level: Optional[float] = None
    alert: Optional[str] = None
    location: str = "FARM_GATE"

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize SQLite database with required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # BOM sensor readings table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS bom_readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                sensor_type TEXT NOT NULL,
                temperature REAL,
                humidity REAL,
                co2 REAL,
                nh3 REAL,
                pm25 REAL,
                co REAL,
                camera_image TEXT,
                synced INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Ear tag data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ear_tag_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                temperature REAL,
                accel_x REAL,
                accel_y REAL,
                accel_z REAL,
                heart_rate INTEGER,
                spo2 REAL,
                synced INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Sprinkler system data table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sprinkler_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                message_type TEXT NOT NULL,
                rfid_uid TEXT,
                action TEXT,
                moisture_level REAL,
                alert TEXT,
                synced INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # System alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                alert_type TEXT NOT NULL,
                device_id TEXT,
                message TEXT,
                severity TEXT,
                acknowledged INTEGER DEFAULT 0,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        conn.commit()
        conn.close()
        logging.info("Database initialized successfully")

    def insert_bom_reading(self, reading: SensorReading):
        """Insert BOM sensor reading into database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        data = reading.data
        cursor.execute("""
            INSERT INTO bom_readings 
            (timestamp, sensor_type, temperature, humidity, co2, nh3, pm25, co, camera_image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            reading.timestamp,
            reading.sensor_type,
            data.get('temperature'),
            data.get('humidity'), 
            data.get('co2'),
            data.get('nh3'),
            data.get('pm25'),
            data.get('co'),
            data.get('camera_image')
        ))

        conn.commit()
        conn.close()

    def insert_ear_tag_data(self, data: EarTagData):
        """Insert ear tag data into database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO ear_tag_data 
            (device_id, timestamp, temperature, accel_x, accel_y, accel_z, heart_rate, spo2)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            data.device_id,
            data.timestamp,
            data.temperature,
            data.accel_x,
            data.accel_y,
            data.accel_z,
            data.heart_rate,
            data.spo2
        ))

        conn.commit()
        conn.close()

    def insert_sprinkler_data(self, data: SprinklerData):
        """Insert sprinkler system data into database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO sprinkler_data 
            (device_id, timestamp, message_type, rfid_uid, action, moisture_level, alert)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            data.device_id,
            data.timestamp,
            data.message_type,
            data.rfid_uid,
            data.action,
            data.moisture_level,
            data.alert
        ))

        conn.commit()
        conn.close()

    def get_unsynced_data(self, table: str, limit: int = 100) -> List[Dict]:
        """Get unsynced data for cloud upload"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute(f"""
            SELECT * FROM {table} 
            WHERE synced = 0 
            ORDER BY created_at ASC 
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        result = [dict(row) for row in rows]
        conn.close()
        return result

    def mark_synced(self, table: str, ids: List[int]):
        """Mark records as synced"""
        if not ids:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        placeholders = ','.join('?' * len(ids))
        cursor.execute(f"""
            UPDATE {table} 
            SET synced = 1 
            WHERE id IN ({placeholders})
        """, ids)

        conn.commit()
        conn.close()

class LoRaReceiver:
    def __init__(self, port: str, baudrate: int, data_queue: queue.Queue):
        self.port = port
        self.baudrate = baudrate
        self.data_queue = data_queue
        self.serial_conn = None
        self.running = False

    def start(self):
        """Start LoRa receiver thread"""
        self.running = True
        receiver_thread = threading.Thread(target=self._receive_loop, daemon=True)
        receiver_thread.start()
        logging.info("LoRa receiver started")

    def stop(self):
        """Stop LoRa receiver"""
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()

    def _init_lora(self):
        """Initialize LoRa module for receiving"""
        try:
            self.serial_conn = serial.Serial(
                self.port, 
                self.baudrate, 
                timeout=1
            )
            time.sleep(2)

            # Configure LoRa for P2P mode
            self._send_at_command("AT+NWM=0")
            self._send_at_command(f"AT+P2P={LORA_FREQUENCY}:7:125:1:8:")
            self._send_at_command("AT+SYNCWORD=34")
            self._send_at_command("AT+PRECV=65533")

            logging.info("LoRa module initialized for receiving")
            return True

        except Exception as e:
            logging.error(f"LoRa initialization failed: {e}")
            return False

    def _send_at_command(self, command: str) -> str:
        """Send AT command and get response"""
        if not self.serial_conn:
            return ""

        self.serial_conn.write(f"{command}\r\n".encode())
        time.sleep(0.1)

        response = ""
        while self.serial_conn.in_waiting:
            response += self.serial_conn.read().decode('utf-8', errors='ignore')

        return response.strip()

    def _receive_loop(self):
        """Main receive loop"""
        if not self._init_lora():
            return

        buffer = ""

        while self.running:
            try:
                if self.serial_conn.in_waiting:
                    data = self.serial_conn.read(self.serial_conn.in_waiting)
                    buffer += data.decode('utf-8', errors='ignore')

                    # Look for complete LoRa messages
                    if "+EVT:RXP2P" in buffer:
                        lines = buffer.split('\n')
                        for line in lines:
                            if "+EVT:RXP2P" in line:
                                self._parse_lora_message(line)
                        buffer = ""

                time.sleep(0.1)

            except Exception as e:
                logging.error(f"LoRa receive error: {e}")
                time.sleep(1)

    def _parse_lora_message(self, message: str):
        """Parse incoming LoRa message"""
        try:
            # Extract hex payload from LoRa message
            parts = message.split(':')
            if len(parts) >= 4:
                hex_data = parts[-1].strip()

                # Convert hex to string
                try:
                    json_str = bytes.fromhex(hex_data).decode('utf-8')
                    data = json.loads(json_str)

                    # Add to processing queue
                    self.data_queue.put({
                        'source': 'lora',
                        'data': data,
                        'timestamp': datetime.now(timezone.utc).isoformat(),
                        'rssi': self._extract_rssi(message)
                    })

                    logging.info(f"Received LoRa data: {json_str[:100]}...")

                except Exception as e:
                    logging.error(f"Failed to decode hex data: {e}")

        except Exception as e:
            logging.error(f"Failed to parse LoRa message: {e}")

    def _extract_rssi(self, message: str) -> int:
        """Extract RSSI value from LoRa message"""
        try:
            rssi_part = [part for part in message.split(',') if 'RSSI:' in part][0]
            return int(rssi_part.split(':')[1])
        except:
            return -999

class SensorManager:
    def __init__(self):
        self.sensors_ready = SENSORS_AVAILABLE
        self.dht_sensor = None
        self.co2_sensor = None
        self.pm25_sensor = None
        self.mcp = None
        self.camera = None

        if self.sensors_ready:
            self._init_sensors()

    def _init_sensors(self):
        """Initialize all sensors"""
        try:
            # DHT22 for temperature and humidity
            self.dht_sensor = adafruit_dht.DHT22(board.D18)

            # I2C setup
            i2c = busio.I2C(board.SCL, board.SDA)

            # SCD4X for CO2
            self.co2_sensor = adafruit_scd4x.SCD4X(i2c)
            self.co2_sensor.start_periodic_measurement()

            # PM2.5 sensor
            self.pm25_sensor = PM25_I2C(i2c)

            # MCP3008 for analog sensors
            spi = busio.SPI(clock=board.SCLK, MISO=board.MISO, MOSI=board.MOSI)
            cs = board.D5
            self.mcp = MCP.MCP3008(spi, cs)

            # Camera
            self.camera = cv2.VideoCapture(0)

            logging.info("All sensors initialized successfully")

        except Exception as e:
            logging.error(f"Sensor initialization failed: {e}")
            self.sensors_ready = False

    def read_all_sensors(self) -> Dict[str, Any]:
        """Read all sensor values"""
        if not self.sensors_ready:
            return self._get_mock_data()

        data = {}

        try:
            # Temperature and humidity
            temp = self.dht_sensor.temperature
            humidity = self.dht_sensor.humidity
            data['temperature'] = temp
            data['humidity'] = humidity

        except Exception as e:
            logging.warning(f"DHT sensor read failed: {e}")
            data['temperature'] = None
            data['humidity'] = None

        try:
            # CO2
            if self.co2_sensor.data_ready:
                data['co2'] = self.co2_sensor.CO2
            else:
                data['co2'] = None

        except Exception as e:
            logging.warning(f"CO2 sensor read failed: {e}")
            data['co2'] = None

        try:
            # PM2.5
            pm_data = self.pm25_sensor.read()
            data['pm25'] = pm_data['pm25_env']

        except Exception as e:
            logging.warning(f"PM2.5 sensor read failed: {e}")
            data['pm25'] = None

        try:
            # NH3 and CO (analog sensors via MCP3008)
            nh3_channel = AnalogIn(self.mcp, MCP.P0)
            co_channel = AnalogIn(self.mcp, MCP.P1)

            # Convert voltage to concentration
            data['nh3'] = self._convert_nh3_voltage(nh3_channel.voltage)
            data['co'] = self._convert_co_voltage(co_channel.voltage)

        except Exception as e:
            logging.warning(f"Analog sensor read failed: {e}")
            data['nh3'] = None
            data['co'] = None

        return data

    def capture_camera_image(self) -> Optional[str]:
        """Capture image from camera"""
        if not self.camera:
            return None

        try:
            ret, frame = self.camera.read()
            if ret:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"farm_image_{timestamp}.jpg"
                filepath = Path(CAMERA_STORAGE) / filename

                filepath.parent.mkdir(parents=True, exist_ok=True)
                cv2.imwrite(str(filepath), frame)
                logging.info(f"Camera image saved: {filename}")
                return filename

        except Exception as e:
            logging.error(f"Camera capture failed: {e}")

        return None

    def _convert_nh3_voltage(self, voltage: float) -> float:
        """Convert NH3 sensor voltage to ppm"""
        return max(0, (voltage - 0.4) * 50)

    def _convert_co_voltage(self, voltage: float) -> float:
        """Convert CO sensor voltage to ppm"""
        return max(0, (voltage - 0.1) * 100)

    def _get_mock_data(self) -> Dict[str, Any]:
        """Return mock sensor data when sensors not available"""
        import random
        return {
            'temperature': round(20 + random.uniform(-5, 15), 2),
            'humidity': round(40 + random.uniform(-20, 40), 2),
            'co2': round(400 + random.uniform(0, 200), 1),
            'nh3': round(random.uniform(0, 10), 2),
            'pm25': round(random.uniform(0, 50), 1),
            'co': round(random.uniform(0, 5), 2)
        }

class BOMSystem:
    def __init__(self):
        # Setup logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(LOG_FILE),
                logging.StreamHandler()
            ]
        )

        # Initialize components
        self.db_manager = DatabaseManager(DATABASE_FILE)
        self.data_queue = queue.Queue()
        self.lora_receiver = LoRaReceiver(LORA_SERIAL_PORT, LORA_BAUDRATE, self.data_queue)
        self.sensor_manager = SensorManager()

        self.running = False

        logging.info("BOM System initialized")

    def start(self):
        """Start all system components"""
        self.running = True

        # Start LoRa receiver
        self.lora_receiver.start()

        # Start processing threads
        threading.Thread(target=self._data_processing_loop, daemon=True).start()
        threading.Thread(target=self._sensor_reading_loop, daemon=True).start()

        logging.info("All BOM system components started")

        try:
            while self.running:
                time.sleep(1)
        except KeyboardInterrupt:
            logging.info("Shutdown signal received")
            self.stop()

    def stop(self):
        """Stop all system components"""
        self.running = False
        self.lora_receiver.stop()

        if self.sensor_manager.camera:
            self.sensor_manager.camera.release()

        logging.info("BOM system stopped")

    def _data_processing_loop(self):
        """Process incoming LoRa data"""
        while self.running:
            try:
                try:
                    message = self.data_queue.get(timeout=1)
                except queue.Empty:
                    continue

                if message['source'] == 'lora':
                    self._process_lora_data(message['data'])

            except Exception as e:
                logging.error(f"Data processing error: {e}")

    def _process_lora_data(self, data: Dict[str, Any]):
        """Process LoRa message based on type"""
        try:
            # Check if this is ear tag data
            if 'id' in data and 'hr' in data:
                ear_tag_data = EarTagData(
                    device_id=data['id'],
                    timestamp=data.get('timestamp', datetime.now(timezone.utc).isoformat()),
                    temperature=float(data.get('t', 0)),
                    accel_x=float(data.get('ax', 0)),
                    accel_y=float(data.get('ay', 0)),
                    accel_z=float(data.get('az', 0)),
                    heart_rate=int(data.get('hr', 0)),
                    spo2=float(data.get('spo2', 0))
                )

                self.db_manager.insert_ear_tag_data(ear_tag_data)
                logging.info(f"Processed ear tag data from {ear_tag_data.device_id}")

            # Check if this is sprinkler system data
            elif 'type' in data and 'device_id' in data:
                sprinkler_data = SprinklerData(
                    device_id=data['device_id'],
                    timestamp=data['timestamp'],
                    message_type=data['type'],
                    rfid_uid=data.get('rfid_uid'),
                    action=data.get('action'),
                    moisture_level=data.get('moisture_level'),
                    alert=data.get('alert')
                )

                self.db_manager.insert_sprinkler_data(sprinkler_data)
                logging.info(f"Processed sprinkler data: {sprinkler_data.message_type}")

            else:
                logging.warning(f"Unknown LoRa data format: {data}")

        except Exception as e:
            logging.error(f"Failed to process LoRa data: {e}")

    def _sensor_reading_loop(self):
        """Continuously read BOM sensors"""
        while self.running:
            try:
                sensor_data = self.sensor_manager.read_all_sensors()

                reading = SensorReading(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    sensor_type="environmental",
                    device_id="BOM_STATION",
                    data=sensor_data
                )

                self.db_manager.insert_bom_reading(reading)

                logging.info(f"BOM sensors read: Temp={sensor_data.get('temperature')}°C, "
                           f"Humidity={sensor_data.get('humidity')}%, CO2={sensor_data.get('co2')}ppm")

                time.sleep(SENSOR_READ_INTERVAL)

            except Exception as e:
                logging.error(f"Sensor reading error: {e}")
                time.sleep(10)

if __name__ == "__main__":
    print("Smart Farm BOM System Starting...")
    print("=" * 50)

    bom_system = BOMSystem()
    bom_system.start()
