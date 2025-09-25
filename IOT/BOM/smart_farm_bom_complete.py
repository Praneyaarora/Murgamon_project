#!/usr/bin/env python3
"""
Complete Smart Farm BOM System with All Modules Integrated
Platform: Raspberry Pi 3 Model B - ARMv8 with 1G RAM
Handles: LoRa communication, environmental monitoring, cloud sync, alerts
"""

import json
import time
import sqlite3
import threading
import requests
import logging
import configparser
from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
import queue
import serial
import cv2
from pathlib import Path

# Import custom modules
from cloud_sync import CloudSyncManager
from alert_system import AlertManager

# Import sensor libraries with fallback
try:
    import board
    import busio
    import adafruit_dht
    import adafruit_scd4x
    from adafruit_pm25.i2c import PM25_I2C
    import adafruit_mcp3xxx.mcp3008 as MCP
    from adafruit_mcp3xxx.analog_in import AnalogIn
    SENSORS_AVAILABLE = True
except ImportError:
    print("⚠️  Sensor libraries not fully available - running in simulation mode")
    SENSORS_AVAILABLE = False

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

class ConfigManager:
    def __init__(self, config_file: str):
        self.config_file = config_file
        self.config = configparser.ConfigParser()
        self.load_config()

    def load_config(self):
        """Load configuration from file"""
        try:
            self.config.read(self.config_file)
            logging.info(f"Configuration loaded from {self.config_file}")
        except Exception as e:
            logging.warning(f"Could not load config file: {e}")
            self._create_default_config()

    def _create_default_config(self):
        """Create default configuration"""
        self.config['DEFAULT'] = {}

        self.config['HARDWARE'] = {
            'lora_serial_port': '/dev/ttyS0',
            'lora_baudrate': '115200',
            'lora_frequency': '866000000',
            'camera_device': '0',
            'dht_pin': '18'
        }

        self.config['CLOUD'] = {
            'api_url': 'https://your-cloud-api.com/api/farm-data',
            'api_key': 'your-api-key-here',
            'sync_interval': '300',
            'enabled': 'false'
        }

        self.config['SENSORS'] = {
            'read_interval': '30',
            'camera_interval': '600'
        }

        self.config['DATABASE'] = {
            'db_path': '/home/pi/farm_data.db',
            'log_path': '/home/pi/bom_system.log',
            'image_storage': '/home/pi/farm_images/'
        }

        # Save default config
        with open(self.config_file, 'w') as f:
            self.config.write(f)

    def get(self, section: str, key: str, fallback=None):
        """Get configuration value"""
        try:
            return self.config.get(section, key, fallback=fallback)
        except:
            return fallback

    def getint(self, section: str, key: str, fallback=0):
        """Get integer configuration value"""
        try:
            return self.config.getint(section, key, fallback=fallback)
        except:
            return fallback

    def getboolean(self, section: str, key: str, fallback=False):
        """Get boolean configuration value"""
        try:
            return self.config.getboolean(section, key, fallback=fallback)
        except:
            return fallback

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.init_database()

    def init_database(self):
        """Initialize SQLite database with all required tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Enable foreign keys
        cursor.execute("PRAGMA foreign_keys = ON")

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
                synced_at TEXT,
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
                synced_at TEXT,
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
                synced_at TEXT,
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
                acknowledged_at TEXT,
                synced INTEGER DEFAULT 0,
                synced_at TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Device registry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS device_registry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT UNIQUE NOT NULL,
                device_type TEXT NOT NULL,
                last_seen TEXT,
                status TEXT DEFAULT 'UNKNOWN',
                location TEXT,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # System statistics table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                metric_name TEXT NOT NULL,
                metric_value REAL,
                metadata TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Create indexes for better performance
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_bom_timestamp ON bom_readings(timestamp)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_ear_tag_device ON ear_tag_data(device_id)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_synced_bom ON bom_readings(synced)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_synced_ear_tag ON ear_tag_data(synced)")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_synced_sprinkler ON sprinkler_data(synced)")

        conn.commit()
        conn.close()
        logging.info("Database initialized successfully with all tables and indexes")

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
        """Insert ear tag data and update device registry"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Insert ear tag data
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

        # Update device registry
        cursor.execute("""
            INSERT OR REPLACE INTO device_registry 
            (device_id, device_type, last_seen, status, location)
            VALUES (?, 'EAR_TAG', ?, 'ACTIVE', ?)
        """, (data.device_id, data.timestamp, data.location))

        conn.commit()
        conn.close()

    def insert_sprinkler_data(self, data: SprinklerData):
        """Insert sprinkler system data and update device registry"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Insert sprinkler data
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

        # Update device registry
        cursor.execute("""
            INSERT OR REPLACE INTO device_registry 
            (device_id, device_type, last_seen, status, location)
            VALUES (?, 'SPRINKLER_SYSTEM', ?, 'ACTIVE', ?)
        """, (data.device_id, data.timestamp, data.location))

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
            SET synced = 1, synced_at = CURRENT_TIMESTAMP
            WHERE id IN ({placeholders})
        """, ids)

        conn.commit()
        conn.close()

    def get_system_statistics(self) -> Dict[str, Any]:
        """Get comprehensive system statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        stats = {}

        # Count records by table
        tables = ['bom_readings', 'ear_tag_data', 'sprinkler_data', 'system_alerts']
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            stats[f"{table}_count"] = cursor.fetchone()[0]

        # Active devices
        cursor.execute("""
            SELECT device_type, COUNT(*) 
            FROM device_registry 
            WHERE datetime(last_seen) > datetime('now', '-1 hour')
            GROUP BY device_type
        """)
        stats['active_devices'] = dict(cursor.fetchall())

        # Recent data (last hour)
        cursor.execute("""
            SELECT COUNT(*) FROM bom_readings 
            WHERE datetime(timestamp) > datetime('now', '-1 hour')
        """)
        stats['recent_bom_readings'] = cursor.fetchone()[0]

        # Sync status
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE synced = 0")
            stats[f"{table}_pending_sync"] = cursor.fetchone()[0]

        conn.close()
        return stats

class LoRaReceiver:
    def __init__(self, config: ConfigManager, data_queue: queue.Queue):
        self.port = config.get('HARDWARE', 'lora_serial_port', '/dev/ttyS0')
        self.baudrate = config.getint('HARDWARE', 'lora_baudrate', 115200)
        self.frequency = config.get('HARDWARE', 'lora_frequency', '866000000')
        self.data_queue = data_queue
        self.serial_conn = None
        self.running = False

        logging.info(f"LoRa configured: {self.port} @ {self.baudrate} baud, {self.frequency} Hz")

    def start(self):
        """Start LoRa receiver thread"""
        self.running = True
        receiver_thread = threading.Thread(target=self._receive_loop, daemon=True)
        receiver_thread.start()
        logging.info("LoRa receiver thread started")

    def stop(self):
        """Stop LoRa receiver"""
        self.running = False
        if self.serial_conn:
            self.serial_conn.close()
            logging.info("LoRa receiver stopped")

    def _init_lora(self):
        """Initialize LoRa module for receiving"""
        try:
            self.serial_conn = serial.Serial(self.port, self.baudrate, timeout=1)
            time.sleep(2)

            # Clear any pending data
            while self.serial_conn.in_waiting:
                self.serial_conn.read()

            # Configure LoRa for P2P mode
            commands = [
                "AT+NWM=0",  # P2P mode
                f"AT+P2P={self.frequency}:7:125:1:8:",  # Freq:SF:BW:CR:Preamble
                "AT+SYNCWORD=34",  # Sync word
                "AT+PRECV=65533"   # Continuous receive mode
            ]

            for cmd in commands:
                self._send_at_command(cmd)
                time.sleep(0.2)

            logging.info(f"LoRa module initialized at {self.frequency} Hz")
            return True

        except Exception as e:
            logging.error(f"LoRa initialization failed: {e}")
            return False

    def _send_at_command(self, command: str) -> str:
        """Send AT command and get response"""
        if not self.serial_conn:
            return ""

        try:
            self.serial_conn.write(f"{command}\r\n".encode())
            time.sleep(0.1)

            response = ""
            start_time = time.time()
            while time.time() - start_time < 0.5:  # 500ms timeout
                if self.serial_conn.in_waiting:
                    response += self.serial_conn.read(self.serial_conn.in_waiting).decode('utf-8', errors='ignore')
                    break
                time.sleep(0.01)

            if response:
                logging.debug(f"AT Command: {command} -> {response.strip()}")

            return response.strip()

        except Exception as e:
            logging.error(f"AT command error: {e}")
            return ""

    def _receive_loop(self):
        """Main LoRa receive loop"""
        if not self._init_lora():
            logging.error("Failed to initialize LoRa - receiver will not start")
            return

        buffer = ""
        last_data_time = time.time()

        logging.info("LoRa receiver loop started - waiting for data...")

        while self.running:
            try:
                if self.serial_conn.in_waiting:
                    new_data = self.serial_conn.read(self.serial_conn.in_waiting)
                    buffer += new_data.decode('utf-8', errors='ignore')
                    last_data_time = time.time()

                    # Process complete lines
                    while '\n' in buffer:
                        line, buffer = buffer.split('\n', 1)
                        line = line.strip()

                        if "+EVT:RXP2P" in line:
                            self._parse_lora_message(line)
                            logging.debug(f"LoRa message processed: {line[:100]}...")

                # Clear buffer if no data for 5 seconds
                if time.time() - last_data_time > 5 and buffer:
                    buffer = ""

                time.sleep(0.05)  # 50ms loop

            except Exception as e:
                logging.error(f"LoRa receive error: {e}")
                time.sleep(1)

                # Try to reconnect
                try:
                    if self.serial_conn:
                        self.serial_conn.close()
                    self._init_lora()
                except:
                    pass

    def _parse_lora_message(self, message: str):
        """Parse incoming LoRa P2P message"""
        try:
            # Format: +EVT:RXP2P,RSSI:-XX,SNR:X:HEX_PAYLOAD
            parts = message.split(':')
            if len(parts) < 4:
                return

            hex_payload = parts[-1].strip()
            if not hex_payload:
                return

            # Extract RSSI
            rssi = -999
            for part in parts:
                if 'RSSI' in part and ',' in part:
                    try:
                        rssi_str = part.split(',')[0].replace('RSSI', '').strip()
                        rssi = int(rssi_str)
                    except:
                        pass

            # Convert hex to JSON
            try:
                json_str = bytes.fromhex(hex_payload).decode('utf-8')
                data = json.loads(json_str)

                # Add metadata
                message_data = {
                    'source': 'lora',
                    'data': data,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                    'rssi': rssi,
                    'raw_hex': hex_payload
                }

                # Queue for processing
                self.data_queue.put(message_data)

                logging.info(f"LoRa data received (RSSI: {rssi}dBm): {json_str[:100]}{'...' if len(json_str) > 100 else ''}")

            except ValueError as e:
                logging.error(f"Invalid hex payload: {hex_payload} - {e}")
            except json.JSONDecodeError as e:
                logging.error(f"Invalid JSON in LoRa message: {json_str} - {e}")

        except Exception as e:
            logging.error(f"Failed to parse LoRa message '{message}': {e}")

class SensorManager:
    def __init__(self, config: ConfigManager):
        self.config = config
        self.sensors_ready = SENSORS_AVAILABLE
        self.dht_sensor = None
        self.co2_sensor = None
        self.pm25_sensor = None
        self.mcp = None
        self.camera = None

        self.read_interval = config.getint('SENSORS', 'read_interval', 30)
        self.camera_interval = config.getint('SENSORS', 'camera_interval', 600)

        if self.sensors_ready:
            self._init_sensors()
        else:
            logging.warning("Running in sensor simulation mode")

    def _init_sensors(self):
        """Initialize all physical sensors"""
        try:
            # DHT22 temperature/humidity sensor
            dht_pin = self.config.getint('HARDWARE', 'dht_pin', 18)
            self.dht_sensor = adafruit_dht.DHT22(getattr(board, f'D{dht_pin}'))
            logging.info(f"DHT22 initialized on GPIO{dht_pin}")

            # I2C bus setup
            i2c = busio.I2C(board.SCL, board.SDA)

            # SCD4X CO2 sensor
            try:
                self.co2_sensor = adafruit_scd4x.SCD4X(i2c)
                self.co2_sensor.start_periodic_measurement()
                logging.info("SCD4X CO2 sensor initialized")
            except Exception as e:
                logging.warning(f"CO2 sensor init failed: {e}")

            # PM2.5 sensor
            try:
                self.pm25_sensor = PM25_I2C(i2c)
                logging.info("PM2.5 sensor initialized")
            except Exception as e:
                logging.warning(f"PM2.5 sensor init failed: {e}")

            # MCP3008 ADC for analog sensors (NH3, CO)
            try:
                spi = busio.SPI(clock=board.SCLK, MISO=board.MISO, MOSI=board.MOSI)
                cs = board.D5
                self.mcp = MCP.MCP3008(spi, cs)
                logging.info("MCP3008 ADC initialized")
            except Exception as e:
                logging.warning(f"ADC init failed: {e}")

            # Camera
            try:
                camera_device = self.config.getint('HARDWARE', 'camera_device', 0)
                self.camera = cv2.VideoCapture(camera_device)
                if self.camera.isOpened():
                    logging.info(f"Camera initialized on device {camera_device}")
                else:
                    self.camera = None
                    logging.warning("Camera not available")
            except Exception as e:
                logging.warning(f"Camera init failed: {e}")
                self.camera = None

        except Exception as e:
            logging.error(f"Sensor initialization error: {e}")
            self.sensors_ready = False

    def read_all_sensors(self) -> Dict[str, Any]:
        """Read all available sensors"""
        if not self.sensors_ready:
            return self._get_simulated_data()

        data = {}

        # DHT22 - Temperature and Humidity
        try:
            if self.dht_sensor:
                data['temperature'] = self.dht_sensor.temperature
                data['humidity'] = self.dht_sensor.humidity
        except Exception as e:
            logging.debug(f"DHT22 read failed: {e}")
            data['temperature'] = None
            data['humidity'] = None

        # SCD4X - CO2
        try:
            if self.co2_sensor and self.co2_sensor.data_ready:
                data['co2'] = self.co2_sensor.CO2
            else:
                data['co2'] = None
        except Exception as e:
            logging.debug(f"CO2 read failed: {e}")
            data['co2'] = None

        # PM2.5
        try:
            if self.pm25_sensor:
                pm_data = self.pm25_sensor.read()
                data['pm25'] = pm_data.get('pm25_env', None)
            else:
                data['pm25'] = None
        except Exception as e:
            logging.debug(f"PM2.5 read failed: {e}")
            data['pm25'] = None

        # Analog sensors via MCP3008
        try:
            if self.mcp:
                # NH3 sensor on channel 0
                nh3_channel = AnalogIn(self.mcp, MCP.P0)
                data['nh3'] = self._convert_nh3_voltage(nh3_channel.voltage)

                # CO sensor on channel 1  
                co_channel = AnalogIn(self.mcp, MCP.P1)
                data['co'] = self._convert_co_voltage(co_channel.voltage)
            else:
                data['nh3'] = None
                data['co'] = None
        except Exception as e:
            logging.debug(f"Analog sensor read failed: {e}")
            data['nh3'] = None
            data['co'] = None

        # Log successful readings
        valid_readings = [k for k, v in data.items() if v is not None]
        if valid_readings:
            logging.debug(f"Sensor readings: {valid_readings}")

        return data

    def capture_camera_image(self) -> Optional[str]:
        """Capture image from camera"""
        if not self.camera or not self.camera.isOpened():
            return None

        try:
            ret, frame = self.camera.read()
            if not ret:
                logging.warning("Failed to capture camera frame")
                return None

            # Generate filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"farm_{timestamp}.jpg"

            # Ensure storage directory exists
            storage_dir = Path(self.config.get('DATABASE', 'image_storage', '/home/pi/farm_images/'))
            storage_dir.mkdir(parents=True, exist_ok=True)

            filepath = storage_dir / filename

            # Save image
            cv2.imwrite(str(filepath), frame)

            # Get file size for logging
            file_size = filepath.stat().st_size
            logging.info(f"Camera image captured: {filename} ({file_size} bytes)")

            return filename

        except Exception as e:
            logging.error(f"Camera capture failed: {e}")
            return None

    def _convert_nh3_voltage(self, voltage: float) -> float:
        """Convert NH3 sensor voltage to ppm concentration"""
        # MQ-137 NH3 sensor calibration (approximate)
        # This needs calibration with known NH3 concentrations
        if voltage < 0.4:
            return 0.0
        return max(0.0, (voltage - 0.4) * 50.0)

    def _convert_co_voltage(self, voltage: float) -> float:
        """Convert CO sensor voltage to ppm concentration"""  
        # MQ-7 CO sensor calibration (approximate)
        # This needs calibration with known CO concentrations
        if voltage < 0.1:
            return 0.0
        return max(0.0, (voltage - 0.1) * 100.0)

    def _get_simulated_data(self) -> Dict[str, Any]:
        """Generate simulated sensor data for testing"""
        import random

        base_time = time.time()

        return {
            'temperature': round(22.0 + 8.0 * random.random() + 3.0 * math.sin(base_time / 3600), 2),
            'humidity': round(45.0 + 25.0 * random.random() + 10.0 * math.cos(base_time / 1800), 1),
            'co2': round(420.0 + 180.0 * random.random(), 1),
            'nh3': round(5.0 * random.random(), 2),
            'pm25': round(25.0 + 15.0 * random.random(), 1),
            'co': round(3.0 * random.random(), 2)
        }

class SmartFarmBOM:
    def __init__(self, config_file: str = "bom_config.ini"):
        """Initialize the complete Smart Farm BOM System"""

        # Load configuration
        self.config = ConfigManager(config_file)

        # Setup logging
        log_file = self.config.get('DATABASE', 'log_path', '/home/pi/bom_system.log')
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(log_file),
                logging.StreamHandler()
            ]
        )

        logging.info("Smart Farm BOM System initializing...")

        # Initialize core components
        db_path = self.config.get('DATABASE', 'db_path', '/home/pi/farm_data.db')
        self.db_manager = DatabaseManager(db_path)

        # Data processing queue
        self.data_queue = queue.Queue(maxsize=1000)

        # Component managers
        self.lora_receiver = LoRaReceiver(self.config, self.data_queue)
        self.sensor_manager = SensorManager(self.config)

        # Alert system
        alert_config = self._build_alert_config()
        self.alert_manager = AlertManager(db_path, alert_config)

        # Cloud synchronization
        if self.config.getboolean('CLOUD', 'enabled', False):
            cloud_config = {
                'api_url': self.config.get('CLOUD', 'api_url'),
                'api_key': self.config.get('CLOUD', 'api_key'),
                'sync_interval': self.config.getint('CLOUD', 'sync_interval', 300),
                'batch_size': 100,
                'max_retries': 3
            }
            self.cloud_sync = CloudSyncManager(db_path, cloud_config)
        else:
            self.cloud_sync = None
            logging.info("Cloud synchronization disabled")

        # System state
        self.running = False
        self.start_time = datetime.now(timezone.utc)

        # Statistics
        self.stats = {
            'lora_messages_received': 0,
            'sensor_readings_count': 0,
            'alerts_generated': 0,
            'cloud_sync_count': 0,
            'last_sensor_reading': None,
            'last_lora_message': None
        }

        logging.info("Smart Farm BOM System initialized successfully")

    def _build_alert_config(self) -> Dict[str, Any]:
        """Build alert configuration from config file"""
        return {
            'email': {
                'enabled': self.config.getboolean('EMAIL_ALERTS', 'enabled', False),
                'smtp_server': self.config.get('EMAIL_ALERTS', 'smtp_server', ''),
                'smtp_port': self.config.getint('EMAIL_ALERTS', 'smtp_port', 587),
                'username': self.config.get('EMAIL_ALERTS', 'username', ''),
                'password': self.config.get('EMAIL_ALERTS', 'password', ''),
                'recipients': self.config.get('EMAIL_ALERTS', 'recipients', '').split(',')
            },
            'webhook': {
                'enabled': self.config.getboolean('WEBHOOK_ALERTS', 'enabled', False),
                'url': self.config.get('WEBHOOK_ALERTS', 'url', '')
            }
        }

    def start(self):
        """Start all system components"""
        logging.info("Starting Smart Farm BOM System...")
        self.running = True

        # Start LoRa receiver
        self.lora_receiver.start()

        # Start processing threads
        threading.Thread(target=self._data_processing_loop, daemon=True, name="DataProcessor").start()
        threading.Thread(target=self._sensor_reading_loop, daemon=True, name="SensorReader").start()
        threading.Thread(target=self._camera_capture_loop, daemon=True, name="CameraCapture").start()
        threading.Thread(target=self._statistics_loop, daemon=True, name="Statistics").start()

        # Start cloud sync if enabled
        if self.cloud_sync:
            self.cloud_sync.start_sync_service()

        logging.info("All system components started successfully")

        # Print system status
        self._print_system_status()

        # Main loop
        try:
            while self.running:
                time.sleep(1)

        except KeyboardInterrupt:
            logging.info("Shutdown signal received (Ctrl+C)")
        except Exception as e:
            logging.error(f"Unexpected error in main loop: {e}")
        finally:
            self.stop()

    def stop(self):
        """Stop all system components gracefully"""
        logging.info("Stopping Smart Farm BOM System...")

        self.running = False

        # Stop components
        self.lora_receiver.stop()

        if self.cloud_sync:
            self.cloud_sync.stop_sync_service()

        if self.sensor_manager.camera:
            self.sensor_manager.camera.release()

        # Final statistics
        uptime = datetime.now(timezone.utc) - self.start_time
        logging.info(f"System uptime: {uptime}")
        logging.info(f"Final statistics: {self.stats}")

        logging.info("Smart Farm BOM System stopped")

    def _data_processing_loop(self):
        """Main data processing loop for LoRa messages"""
        logging.info("Data processing loop started")

        while self.running:
            try:
                # Get message from queue with timeout
                try:
                    message = self.data_queue.get(timeout=1.0)
                    self.stats['lora_messages_received'] += 1
                    self.stats['last_lora_message'] = datetime.now(timezone.utc).isoformat()
                except queue.Empty:
                    continue

                if message['source'] == 'lora':
                    self._process_lora_data(message)

                # Mark task done
                self.data_queue.task_done()

            except Exception as e:
                logging.error(f"Data processing error: {e}")
                time.sleep(1)

    def _process_lora_data(self, message: Dict[str, Any]):
        """Process received LoRa data based on message type"""
        try:
            data = message['data']
            rssi = message['rssi']
            timestamp = message['timestamp']

            # Determine message type and process accordingly
            if self._is_ear_tag_data(data):
                self._process_ear_tag_data(data, rssi)

            elif self._is_sprinkler_data(data):
                self._process_sprinkler_data(data, rssi)

            else:
                logging.warning(f"Unknown LoRa data format: {data}")

        except Exception as e:
            logging.error(f"Failed to process LoRa data: {e}")

    def _is_ear_tag_data(self, data: Dict[str, Any]) -> bool:
        """Check if data is from an ear tag device"""
        required_fields = ['id', 't', 'hr']  # id, temperature, heart rate
        return all(field in data for field in required_fields)

    def _is_sprinkler_data(self, data: Dict[str, Any]) -> bool:
        """Check if data is from sprinkler/sanitization system"""
        required_fields = ['type', 'device_id', 'timestamp']
        return all(field in data for field in required_fields)

    def _process_ear_tag_data(self, data: Dict[str, Any], rssi: int):
        """Process ear tag sensor data"""
        try:
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

            # Store in database
            self.db_manager.insert_ear_tag_data(ear_tag_data)

            # Check for health alerts
            health_data = {
                'heart_rate': ear_tag_data.heart_rate,
                'spo2': ear_tag_data.spo2,
                'temperature': ear_tag_data.temperature,
                'accel_x': ear_tag_data.accel_x,
                'accel_y': ear_tag_data.accel_y,
                'accel_z': ear_tag_data.accel_z
            }

            alerts = self.alert_manager.check_animal_health_alerts(
                ear_tag_data.device_id, 
                health_data
            )

            self.stats['alerts_generated'] += len(alerts)

            logging.info(f"Ear tag data processed: {ear_tag_data.device_id} "
                        f"(HR: {ear_tag_data.heart_rate}, SpO2: {ear_tag_data.spo2}%, "
                        f"Temp: {ear_tag_data.temperature}°C, RSSI: {rssi}dBm)")

        except Exception as e:
            logging.error(f"Failed to process ear tag data: {e}")

    def _process_sprinkler_data(self, data: Dict[str, Any], rssi: int):
        """Process sprinkler/sanitization system data"""
        try:
            sprinkler_data = SprinklerData(
                device_id=data['device_id'],
                timestamp=data['timestamp'],
                message_type=data['type'],
                rfid_uid=data.get('rfid_uid'),
                action=data.get('action'),
                moisture_level=data.get('moisture_level'),
                alert=data.get('alert')
            )

            # Store in database
            self.db_manager.insert_sprinkler_data(sprinkler_data)

            # Check for system alerts
            if sprinkler_data.message_type in ['WATER_ALERT', 'MOISTURE_STATUS']:
                system_data = {
                    'moisture_level': sprinkler_data.moisture_level,
                    'device_id': sprinkler_data.device_id
                }
                alerts = self.alert_manager.check_system_alerts(system_data)
                self.stats['alerts_generated'] += len(alerts)

            logging.info(f"Sprinkler data processed: {sprinkler_data.device_id} "
                        f"({sprinkler_data.message_type}, RSSI: {rssi}dBm)")

        except Exception as e:
            logging.error(f"Failed to process sprinkler data: {e}")

    def _sensor_reading_loop(self):
        """Continuous BOM sensor reading loop"""
        logging.info("Sensor reading loop started")

        read_interval = self.sensor_manager.read_interval

        while self.running:
            try:
                start_time = time.time()

                # Read all sensors
                sensor_data = self.sensor_manager.read_all_sensors()

                # Create sensor reading record
                reading = SensorReading(
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    sensor_type="environmental",
                    device_id="BOM_STATION",
                    data=sensor_data
                )

                # Store in database
                self.db_manager.insert_bom_reading(reading)

                # Check for environmental alerts
                alerts = self.alert_manager.check_environmental_alerts(sensor_data)
                self.stats['alerts_generated'] += len(alerts)

                # Update statistics
                self.stats['sensor_readings_count'] += 1
                self.stats['last_sensor_reading'] = reading.timestamp

                # Log reading summary
                valid_sensors = [k for k, v in sensor_data.items() if v is not None]
                logging.info(f"BOM sensors read ({len(valid_sensors)} active): "
                           f"T={sensor_data.get('temperature')}°C, "
                           f"H={sensor_data.get('humidity')}%, "
                           f"CO2={sensor_data.get('co2')}ppm")

                # Sleep for remaining interval time
                elapsed = time.time() - start_time
                sleep_time = max(0, read_interval - elapsed)
                time.sleep(sleep_time)

            except Exception as e:
                logging.error(f"Sensor reading error: {e}")
                time.sleep(10)  # Wait before retry

    def _camera_capture_loop(self):
        """Periodic camera image capture loop"""
        if not self.sensor_manager.camera:
            logging.info("Camera not available - skipping camera capture loop")
            return

        logging.info("Camera capture loop started")

        camera_interval = self.sensor_manager.camera_interval

        while self.running:
            try:
                # Capture image
                image_filename = self.sensor_manager.capture_camera_image()

                if image_filename:
                    # Store camera data as sensor reading
                    reading = SensorReading(
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        sensor_type="camera",
                        device_id="BOM_CAMERA",
                        data={'camera_image': image_filename}
                    )
                    self.db_manager.insert_bom_reading(reading)

                time.sleep(camera_interval)

            except Exception as e:
                logging.error(f"Camera capture error: {e}")
                time.sleep(60)  # Wait before retry

    def _statistics_loop(self):
        """Periodic system statistics and maintenance"""
        logging.info("Statistics loop started")

        while self.running:
            try:
                # Update system statistics every 5 minutes
                time.sleep(300)

                if not self.running:
                    break

                # Get database statistics
                db_stats = self.db_manager.get_system_statistics()

                # Log system status
                uptime = datetime.now(timezone.utc) - self.start_time
                logging.info(f"System Status - Uptime: {uptime}, "
                           f"LoRa messages: {self.stats['lora_messages_received']}, "
                           f"Sensor readings: {self.stats['sensor_readings_count']}, "
                           f"Alerts: {self.stats['alerts_generated']}")

                # Log database status
                logging.info(f"Database - BOM: {db_stats.get('bom_readings_count', 0)}, "
                           f"EarTags: {db_stats.get('ear_tag_data_count', 0)}, "
                           f"Sprinkler: {db_stats.get('sprinkler_data_count', 0)}, "
                           f"Alerts: {db_stats.get('system_alerts_count', 0)}")

                # Log pending sync counts if cloud sync enabled
                if self.cloud_sync:
                    pending_sync = sum([
                        db_stats.get('bom_readings_pending_sync', 0),
                        db_stats.get('ear_tag_data_pending_sync', 0),
                        db_stats.get('sprinkler_data_pending_sync', 0),
                        db_stats.get('system_alerts_pending_sync', 0)
                    ])
                    logging.info(f"Cloud sync - Pending: {pending_sync} records")

            except Exception as e:
                logging.error(f"Statistics loop error: {e}")

    def _print_system_status(self):
        """Print initial system status"""
        print("\n" + "="*60)
        print("SMART FARM BOM SYSTEM - STATUS")
        print("="*60)
        print(f"Start Time: {self.start_time}")
        print(f"Config File: {self.config.config_file}")
        print(f"Database: {self.db_manager.db_path}")
        print(f"LoRa Port: {self.lora_receiver.port}")
        print(f"Sensors: {'Physical' if self.sensor_manager.sensors_ready else 'Simulated'}")
        print(f"Camera: {'Available' if self.sensor_manager.camera else 'Not available'}")
        print(f"Cloud Sync: {'Enabled' if self.cloud_sync else 'Disabled'}")
        print(f"Alert System: Active")
        print("="*60)
        print("System running... Press Ctrl+C to stop")
        print("="*60 + "\n")

# Import required for simulated data
import math

if __name__ == "__main__":
    try:
        # Initialize and start the Smart Farm BOM System
        bom_system = SmartFarmBOM()
        bom_system.start()

    except Exception as e:
        logging.critical(f"System startup failed: {e}")
        raise
