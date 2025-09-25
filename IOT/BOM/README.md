# Smart Farm BOM (Base Operations Management) System

Complete IoT-based farm monitoring and management system for Raspberry Pi 3 Model B with LoRa communication, environmental sensors, animal health monitoring, and cloud synchronization.

## 🌾 System Overview

The Smart Farm BOM system provides centralized monitoring and control for modern farming operations:

- **LoRa Communication**: Receives data from multiple ear tags and sprinkler systems
- **Environmental Monitoring**: Temperature, humidity, NH₃, CO₂, PM2.5, CO sensors
- **Animal Health Tracking**: Heart rate, SpO₂, temperature, and activity monitoring
- **Water Management**: Tank level monitoring with automated alerts
- **Cloud Integration**: Real-time data synchronization and remote monitoring
- **Alert System**: Email, webhook, and on-screen notifications for critical conditions
- **Web Dashboard**: Real-time visualization and system control

## 📋 Hardware Requirements

### Raspberry Pi Setup
- **Platform**: Raspberry Pi 3 Model B (ARMv8, 1GB RAM)
- **Storage**: 32GB+ microSD card (Class 10)
- **Power**: 5V 2.5A power supply

### LoRa Communication
- **Module**: RAK3172 SiP LoRa module
- **Frequency**: 866 MHz (India ISM band 865-867 MHz)
- **Connection**: UART (GPIO14/15)

### Environmental Sensors
- **Temperature/Humidity**: DHT22 (GPIO18)
- **CO₂**: SCD4X I2C sensor
- **PM2.5**: I2C particulate matter sensor
- **NH₃/CO**: Analog sensors via MCP3008 ADC (SPI)

### Other Components
- **Camera**: Raspberry Pi camera module or USB camera
- **I2C**: SDA (GPIO2), SCL (GPIO3)
- **SPI**: SCLK (GPIO11), MISO (GPIO9), MOSI (GPIO10), CE0 (GPIO8)

## 🔧 Installation

### 1. Prepare Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Enable interfaces
sudo raspi-config
# Enable: I2C, SPI, Serial, Camera

# Reboot
sudo reboot
```

### 2. Clone and Install

```bash
# Clone the repository (or copy files)
cd /home/pi
mkdir smart-farm-bom
cd smart-farm-bom

# Copy all system files here
# (bom_system.py, cloud_sync.py, alert_system.py, etc.)

# Run installation script
chmod +x install.sh
./install.sh
```

### 3. Configure System

```bash
# Edit configuration file
nano bom_config.ini

# Key settings to update:
# - Cloud API URL and key
# - Email alert settings  
# - Sensor calibration values
# - LoRa parameters
```

### 4. Hardware Connections

```
DHT22 Temperature/Humidity Sensor:
- VCC → 3.3V
- GND → GND
- DATA → GPIO18

MCP3008 ADC (for NH₃/CO sensors):
- VDD → 3.3V
- VREF → 3.3V
- AGND → GND
- DGND → GND
- CLK → GPIO11 (SCLK)
- DOUT → GPIO9 (MISO)
- DIN → GPIO10 (MOSI)
- CS → GPIO8 (CE0)

RAK3172 LoRa Module:
- VCC → 3.3V
- GND → GND
- TX → GPIO15 (RX)
- RX → GPIO14 (TX)

I2C Sensors (CO₂, PM2.5):
- VCC → 3.3V
- GND → GND
- SDA → GPIO2
- SCL → GPIO3
```

## 🚀 Usage

### Start System

```bash
# Start the service
sudo systemctl start bom-system

# Enable auto-start
sudo systemctl enable bom-system

# Check status
sudo systemctl status bom-system

# View logs
journalctl -u bom-system -f
```

### Web Dashboard

```bash
# Start web dashboard
cd /home/pi/smart-farm-bom
python3 dashboard.py

# Access dashboard at:
http://raspberry-pi-ip:5000
```

### System Health Check

```bash
# Run health check
python3 scripts/check_system.py

# Output example:
# Smart Farm BOM System Health Check
# ========================================
# Services:
#   bom-system: ✓ Running
# 
# Database:
#   ✓ Accessible (Recent readings: 12)
# 
# Hardware:
#   I2C: ✓ Available
#   SPI: ✓ Available
#   CAMERA: ✓ Available
```

## 📊 Data Flow

### 1. LoRa Data Reception
```
Ear Tags → LoRa → BOM System → Database
Sprinkler → LoRa → BOM System → Database
```

### 2. Sensor Data Collection
```
Environmental Sensors → BOM System → Database
Camera → Image Capture → Storage → Database
```

### 3. Data Processing
```
Raw Data → Alert Processing → Notifications
Raw Data → Cloud Sync → Remote Storage
```

## 📝 Data Formats

### Ear Tag Data (JSON over LoRa)
```json
{
  "id": "ABC123DEF456",
  "t": 38.5,
  "ax": 0.12,
  "ay": -0.05,
  "az": 9.81,
  "hr": 75,
  "spo2": 97.5,
  "timestamp": "2025-09-25T21:30:00Z"
}
```

### Sprinkler System Data
```json
{
  "type": "ENTRY",
  "device_id": "FARM_GATE_01",
  "timestamp": "2025-09-25T21:30:00Z",
  "rfid_uid": "ABC123",
  "action": "ENTER",
  "moisture_level": 75.5
}
```

### BOM Environmental Data
```json
{
  "timestamp": "2025-09-25T21:30:00Z",
  "temperature": 25.3,
  "humidity": 65.2,
  "co2": 450.1,
  "nh3": 2.1,
  "pm25": 15.3,
  "co": 0.8
}
```

## 🚨 Alert System

### Alert Types
- **Environmental**: Temperature, humidity, air quality thresholds
- **Animal Health**: Heart rate, SpO₂, temperature anomalies  
- **System**: Water tank levels, device connectivity
- **Security**: Entry/exit events, unauthorized access

### Notification Channels
- **Email**: SMTP-based alerts for critical conditions
- **Webhook**: REST API notifications to external systems
- **Dashboard**: Real-time web interface alerts
- **Logging**: Persistent alert history

### Alert Configuration
```ini
[ALERTS]
temperature_min = 10
temperature_max = 45
humidity_min = 30
humidity_max = 90
co2_max = 1000
nh3_max = 25
pm25_max = 75
co_max = 50

[EMAIL_ALERTS]
enabled = true
smtp_server = smtp.gmail.com
smtp_port = 587
username = your-email@gmail.com
password = your-app-password
recipients = admin@farm.com,alerts@farm.com
```

## ☁️ Cloud Integration

### Supported Cloud Platforms
- REST API endpoints for data upload
- Configurable sync intervals and batch sizes
- Automatic retry with exponential backoff
- Data compression and encryption support

### Cloud Configuration
```ini
[CLOUD]
api_url = https://your-cloud-api.com/api/farm-data
api_key = your-api-key-here
sync_interval = 300
enabled = true
```

## 🔧 Maintenance

### Database Management
```bash
# View database statistics
sqlite3 /home/pi/farm_data.db "
SELECT 
  (SELECT COUNT(*) FROM bom_readings) as bom_readings,
  (SELECT COUNT(*) FROM ear_tag_data) as ear_tag_data,
  (SELECT COUNT(*) FROM sprinkler_data) as sprinkler_data,
  (SELECT COUNT(*) FROM system_alerts) as alerts;
"

# Clean old data (older than 30 days)
sqlite3 /home/pi/farm_data.db "
DELETE FROM bom_readings WHERE datetime(timestamp) < datetime('now', '-30 days');
DELETE FROM ear_tag_data WHERE datetime(timestamp) < datetime('now', '-30 days');
"
```

### Log Management
```bash
# View recent logs
tail -f /home/pi/bom_system.log

# Rotate logs manually
sudo logrotate -f /etc/logrotate.d/bom-system
```

### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Python dependencies
cd /home/pi/smart-farm-bom
source venv/bin/activate
pip install --upgrade -r requirements.txt
```

## 📱 API Endpoints

### REST API
- `GET /api/status` - System status and statistics
- `GET /api/sensors?hours=6` - Recent sensor data
- `GET /api/animals` - Animal health summary
- `GET /api/alerts` - System alerts
- `POST /api/alerts/{id}/acknowledge` - Acknowledge alert

### Example API Usage
```bash
# Get system status
curl http://raspberry-pi-ip:5000/api/status

# Get recent sensor data
curl http://raspberry-pi-ip:5000/api/sensors?hours=1

# Acknowledge alert
curl -X POST http://raspberry-pi-ip:5000/api/alerts/123/acknowledge
```

## 🔐 Security Considerations

### Network Security
- Change default passwords
- Enable SSH key authentication
- Configure firewall rules
- Use VPN for remote access

### Data Security
- Encrypt cloud API communications
- Regular database backups
- Secure sensor data transmission
- Access logging and monitoring

### Physical Security
- Secure device mounting
- Weather protection
- Power backup systems
- Anti-tampering measures

## 🐛 Troubleshooting

### Common Issues

**LoRa Communication Problems**
```bash
# Check serial port
ls -l /dev/ttyS0

# Test LoRa module
screen /dev/ttyS0 115200
# Send: AT
# Expected response: OK
```

**Sensor Reading Issues**
```bash
# Check I2C devices
i2cdetect -y 1

# Check SPI
ls -l /dev/spidev*

# Test camera
raspistill -o test.jpg
```

**Service Issues**
```bash
# Check service status
sudo systemctl status bom-system

# Restart service
sudo systemctl restart bom-system

# Check logs for errors
journalctl -u bom-system --since "1 hour ago"
```

### Performance Monitoring
```bash
# System resources
htop

# Disk usage
df -h

# Memory usage
free -h

# Temperature
vcgencmd measure_temp
```

## 📈 Performance Specifications

### Data Throughput
- **LoRa Reception**: Up to 100 messages/minute
- **Sensor Readings**: 30-second intervals
- **Database Writes**: 1000+ records/minute
- **Cloud Sync**: Configurable batch uploads

### System Resources
- **RAM Usage**: ~200-400MB typical
- **CPU Usage**: ~5-15% average
- **Storage**: ~1GB/month data storage
- **Network**: <1MB/hour cloud sync

## 🤝 Contributing

### Development Setup
```bash
# Create development environment
python3 -m venv dev-venv
source dev-venv/bin/activate
pip install -r requirements.txt

# Run tests
pytest tests/

# Code formatting
black *.py
```

### Adding New Sensors
1. Update `SensorManager` class in `bom_system.py`
2. Add calibration functions
3. Update database schema if needed
4. Add alert rules
5. Update dashboard display

### Adding New LoRa Devices
1. Define data structure in dataclasses
2. Add parsing logic in `_process_lora_data()`
3. Update database tables
4. Add device-specific alerts
5. Update dashboard views

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Support

For technical support and questions:
- Check troubleshooting section above
- Review system logs for error details
- Verify hardware connections
- Test individual components separately

## 🔄 Version History

### v1.0.0 (Initial Release)
- LoRa communication with ear tags and sprinkler systems
- Environmental sensor monitoring
- SQLite database storage
- Basic alert system
- Web dashboard interface

### Future Enhancements
- Machine learning for predictive analytics
- Mobile app for remote monitoring
- Additional sensor support
- Enhanced data visualization
- Multi-farm management
- Weather station integration

---

**Smart Farm BOM System** - Revolutionizing agriculture through IoT and data-driven decisions 🌱
