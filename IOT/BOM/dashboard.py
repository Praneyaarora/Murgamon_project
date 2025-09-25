#!/usr/bin/env python3
"""
Simple Web Dashboard for Smart Farm BOM System
Provides real-time monitoring interface via web browser
"""

from flask import Flask, render_template, jsonify, request
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

app = Flask(__name__)

# Configuration
DATABASE_PATH = '/home/pi/farm_data.db'
IMAGE_STORAGE = '/home/pi/farm_images/'

def get_db_connection():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def dashboard():
    """Main dashboard page"""
    return render_template('dashboard.html')

@app.route('/api/status')
def api_status():
    """System status API endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get recent data counts
        cursor.execute("""
            SELECT 
                (SELECT COUNT(*) FROM bom_readings WHERE datetime(timestamp) > datetime('now', '-1 hour')) as recent_bom,
                (SELECT COUNT(*) FROM ear_tag_data WHERE datetime(timestamp) > datetime('now', '-1 hour')) as recent_ear_tags,
                (SELECT COUNT(*) FROM sprinkler_data WHERE datetime(timestamp) > datetime('now', '-1 hour')) as recent_sprinkler,
                (SELECT COUNT(*) FROM system_alerts WHERE acknowledged = 0) as unack_alerts
        """)

        stats = dict(cursor.fetchone())

        # Get active devices
        cursor.execute("""
            SELECT device_type, COUNT(*) as count
            FROM device_registry 
            WHERE datetime(last_seen) > datetime('now', '-2 hours')
            GROUP BY device_type
        """)

        active_devices = dict(cursor.fetchall())

        # Get latest sensor readings
        cursor.execute("""
            SELECT temperature, humidity, co2, nh3, pm25, co, timestamp
            FROM bom_readings 
            WHERE sensor_type = 'environmental'
            ORDER BY timestamp DESC 
            LIMIT 1
        """)

        latest_sensors = dict(cursor.fetchone()) if cursor.rowcount > 0 else {}

        conn.close()

        return jsonify({
            'status': 'online',
            'timestamp': datetime.now().isoformat(),
            'stats': stats,
            'active_devices': active_devices,
            'latest_sensors': latest_sensors
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/sensors')
def api_sensors():
    """Recent sensor data API endpoint"""
    try:
        hours = int(request.args.get('hours', 6))

        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT timestamp, temperature, humidity, co2, nh3, pm25, co
            FROM bom_readings 
            WHERE sensor_type = 'environmental'
            AND datetime(timestamp) > datetime('now', '-{} hours')
            ORDER BY timestamp DESC
            LIMIT 100
        """.format(hours))

        readings = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(readings)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/animals')
def api_animals():
    """Animal data API endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        # Get latest data for each animal
        cursor.execute("""
            SELECT device_id, 
                   MAX(timestamp) as last_seen,
                   AVG(heart_rate) as avg_hr,
                   AVG(spo2) as avg_spo2,
                   AVG(temperature) as avg_temp,
                   COUNT(*) as reading_count
            FROM ear_tag_data 
            WHERE datetime(timestamp) > datetime('now', '-24 hours')
            GROUP BY device_id
            ORDER BY last_seen DESC
        """)

        animals = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(animals)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts')
def api_alerts():
    """System alerts API endpoint"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, timestamp, alert_type, device_id, message, severity, acknowledged
            FROM system_alerts 
            ORDER BY timestamp DESC 
            LIMIT 50
        """)

        alerts = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify(alerts)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/alerts/<int:alert_id>/acknowledge', methods=['POST'])
def acknowledge_alert(alert_id):
    """Acknowledge an alert"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE system_alerts 
            SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (alert_id,))

        success = cursor.rowcount > 0
        conn.commit()
        conn.close()

        return jsonify({'success': success})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
