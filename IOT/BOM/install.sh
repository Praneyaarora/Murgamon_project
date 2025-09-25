#!/bin/bash
# Smart Farm BOM System Installation Script for Raspberry Pi 3 Model B
# This script sets up the complete BOM system with all dependencies

set -e

echo "=============================================="
echo "Smart Farm BOM System Installation"
echo "Platform: Raspberry Pi 3 Model B"
echo "=============================================="

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "Please do not run this script as root. Use a regular user account."
   exit 1
fi

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install system dependencies
echo "Installing system dependencies..."
sudo apt install -y \
    python3 \
    python3-pip \
    python3-venv \
    git \
    sqlite3 \
    i2c-tools \
    python3-smbus \
    libgpiod2 \
    python3-libgpiod \
    python3-opencv \
    python3-serial \
    supervisor \
    nginx

# Enable I2C and SPI interfaces
echo "Enabling I2C and SPI interfaces..."
sudo raspi-config nonint do_i2c 0
sudo raspi-config nonint do_spi 0
sudo raspi-config nonint do_serial 0

# Add user to required groups
echo "Adding user to required groups..."
sudo usermod -a -G i2c,spi,gpio,dialout $USER

# Create project directory
BOM_DIR="/home/pi/smart-farm-bom"
echo "Creating project directory: $BOM_DIR"
mkdir -p $BOM_DIR
cd $BOM_DIR

# Create Python virtual environment
echo "Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create directory structure
echo "Creating directory structure..."
mkdir -p logs
mkdir -p data
mkdir -p images
mkdir -p config
mkdir -p scripts

# Set up SQLite database
echo "Initializing database..."
python3 -c "
import sqlite3
import sys
sys.path.append('.')
from bom_system import DatabaseManager
db = DatabaseManager('/home/pi/farm_data.db')
print('Database initialized successfully')
"

# Create systemd service file
echo "Creating systemd service..."
sudo tee /etc/systemd/system/bom-system.service > /dev/null <<EOF
[Unit]
Description=Smart Farm BOM System
After=network.target
Wants=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/smart-farm-bom
Environment=PATH=/home/pi/smart-farm-bom/venv/bin
ExecStart=/home/pi/smart-farm-bom/venv/bin/python bom_system.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Create log rotation config
echo "Setting up log rotation..."
sudo tee /etc/logrotate.d/bom-system > /dev/null <<EOF
/home/pi/bom_system.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 pi pi
}
EOF

# Set up file permissions
echo "Setting file permissions..."
chmod +x *.py
chown -R pi:pi $BOM_DIR
chmod 755 $BOM_DIR

# Enable and start services
echo "Enabling system services..."
sudo systemctl daemon-reload
sudo systemctl enable bom-system.service

# Create startup check script
tee scripts/check_system.py > /dev/null <<'EOF'
#!/usr/bin/env python3
"""System health check script"""
import subprocess
import json
import sqlite3
from datetime import datetime, timedelta

def check_services():
    """Check if all services are running"""
    services = ['bom-system']
    status = {}

    for service in services:
        try:
            result = subprocess.run(['systemctl', 'is-active', service], 
                                  capture_output=True, text=True)
            status[service] = result.stdout.strip() == 'active'
        except:
            status[service] = False

    return status

def check_database():
    """Check database connectivity and recent data"""
    try:
        conn = sqlite3.connect('/home/pi/farm_data.db')
        cursor = conn.cursor()

        # Check recent data (last 10 minutes)
        cursor.execute("""
            SELECT COUNT(*) FROM bom_readings 
            WHERE datetime(timestamp) > datetime('now', '-10 minutes')
        """)
        recent_readings = cursor.fetchone()[0]

        conn.close()
        return {'accessible': True, 'recent_readings': recent_readings}

    except Exception as e:
        return {'accessible': False, 'error': str(e)}

def check_hardware():
    """Check hardware interfaces"""
    hardware_status = {}

    # Check I2C
    try:
        result = subprocess.run(['i2cdetect', '-l'], capture_output=True, text=True)
        hardware_status['i2c'] = 'i2c-1' in result.stdout
    except:
        hardware_status['i2c'] = False

    # Check SPI
    try:
        import spidev
        hardware_status['spi'] = True
    except ImportError:
        hardware_status['spi'] = False

    # Check camera
    try:
        result = subprocess.run(['vcgencmd', 'get_camera'], capture_output=True, text=True)
        hardware_status['camera'] = 'detected=1' in result.stdout
    except:
        hardware_status['camera'] = False

    return hardware_status

if __name__ == "__main__":
    print("Smart Farm BOM System Health Check")
    print("=" * 40)

    # Check services
    services = check_services()
    print("Services:")
    for service, status in services.items():
        status_text = "✓ Running" if status else "✗ Stopped"
        print(f"  {service}: {status_text}")

    # Check database
    db_status = check_database()
    print("\nDatabase:")
    if db_status['accessible']:
        print(f"  ✓ Accessible (Recent readings: {db_status['recent_readings']})")
    else:
        print(f"  ✗ Error: {db_status.get('error', 'Unknown')}")

    # Check hardware
    hw_status = check_hardware()
    print("\nHardware:")
    for component, status in hw_status.items():
        status_text = "✓ Available" if status else "✗ Not detected"
        print(f"  {component.upper()}: {status_text}")

    print("\nHealth check completed.")
EOF

chmod +x scripts/check_system.py

# Create configuration template
tee bom_config.ini > /dev/null <<'EOF'
[DEFAULT]
# Smart Farm BOM Configuration

[HARDWARE]
lora_serial_port = /dev/ttyS0
lora_baudrate = 115200
lora_frequency = 866000000
camera_device = 0
dht_pin = 18

[CLOUD]
api_url = https://your-cloud-api.com/api/farm-data
api_key = your-api-key-here
sync_interval = 300
enabled = false

[SENSORS]
read_interval = 30
camera_interval = 600

[DATABASE]
db_path = /home/pi/farm_data.db
log_path = /home/pi/bom_system.log
image_storage = /home/pi/farm_images/

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
enabled = false
smtp_server = smtp.gmail.com
smtp_port = 587
username = your-email@example.com
password = your-app-password
recipients = admin@farm.com,alerts@farm.com

[WEBHOOK_ALERTS]
enabled = false
url = https://your-webhook-url.com/alerts
EOF

echo ""
echo "=============================================="
echo "Installation completed successfully!"
echo "=============================================="
echo ""
echo "Next steps:"
echo "1. Reboot your Raspberry Pi: sudo reboot"
echo "2. After reboot, check system status: python3 scripts/check_system.py"
echo "3. Edit configuration: nano bom_config.ini"
echo "4. Start the service: sudo systemctl start bom-system"
echo "5. Check service status: sudo systemctl status bom-system"
echo "6. View logs: journalctl -u bom-system -f"
echo ""
echo "Hardware Setup:"
echo "- Connect DHT22 to GPIO18"
echo "- Connect I2C sensors (SDA=GPIO2, SCL=GPIO3)"
echo "- Connect SPI sensors (SPI0 interface)"
echo "- Connect LoRa module to UART (GPIO14/15)"
echo "- Connect camera to camera interface"
echo ""
echo "Default directories:"
echo "- System files: $BOM_DIR"
echo "- Database: /home/pi/farm_data.db"
echo "- Images: /home/pi/farm_images/"
echo "- Logs: /home/pi/bom_system.log"
