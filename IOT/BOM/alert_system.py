#!/usr/bin/env python3
"""
Alert Management System for Smart Farm BOM
Handles critical condition monitoring and notification system
"""

import json
import time
import sqlite3
import logging
import smtplib
import requests
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart

@dataclass
class AlertRule:
    parameter: str
    condition: str  # 'min', 'max', 'range'
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None
    severity: str = 'WARNING'  # INFO, WARNING, CRITICAL
    cooldown_minutes: int = 60  # Minimum time between same alerts

@dataclass
class Alert:
    id: int
    timestamp: str
    alert_type: str
    device_id: str
    message: str
    severity: str
    acknowledged: bool = False
    resolved: bool = False

class AlertManager:
    def __init__(self, db_path: str, config: Dict[str, Any] = None):
        self.db_path = db_path
        self.config = config or {}

        # Default alert rules for farm parameters
        self.default_rules = {
            # BOM Environmental Parameters
            'temperature': AlertRule('temperature', 'range', 5.0, 50.0, 'WARNING', 30),
            'humidity': AlertRule('humidity', 'range', 20.0, 95.0, 'WARNING', 30),
            'co2': AlertRule('co2', 'max', None, 1200.0, 'WARNING', 60),
            'nh3': AlertRule('nh3', 'max', None, 30.0, 'CRITICAL', 15),
            'pm25': AlertRule('pm25', 'max', None, 100.0, 'WARNING', 60),
            'co': AlertRule('co', 'max', None, 50.0, 'CRITICAL', 10),

            # Animal Health Parameters
            'heart_rate': AlertRule('heart_rate', 'range', 30.0, 150.0, 'WARNING', 30),
            'spo2': AlertRule('spo2', 'min', 88.0, None, 'CRITICAL', 15),
            'animal_temperature': AlertRule('animal_temperature', 'range', 35.0, 42.0, 'WARNING', 60),

            # System Parameters
            'moisture_level': AlertRule('moisture_level', 'min', 20.0, None, 'WARNING', 120),
        }

        # Load custom rules from config
        self.alert_rules = self._load_alert_rules()

        # Alert history for cooldown management
        self.recent_alerts = {}

        # Notification settings
        self.email_config = self.config.get('email', {})
        self.webhook_config = self.config.get('webhook', {})
        self.sms_config = self.config.get('sms', {})

    def _load_alert_rules(self) -> Dict[str, AlertRule]:
        """Load alert rules from config or use defaults"""
        rules = self.default_rules.copy()

        # Override with custom rules from config
        if 'alert_rules' in self.config:
            for param, rule_config in self.config['alert_rules'].items():
                rules[param] = AlertRule(
                    parameter=param,
                    condition=rule_config.get('condition', 'max'),
                    threshold_min=rule_config.get('min'),
                    threshold_max=rule_config.get('max'),
                    severity=rule_config.get('severity', 'WARNING'),
                    cooldown_minutes=rule_config.get('cooldown', 60)
                )

        return rules

    def check_environmental_alerts(self, sensor_data: Dict[str, Any]) -> List[Alert]:
        """Check environmental sensor readings against thresholds"""
        alerts = []

        for param, value in sensor_data.items():
            if value is None or param not in self.alert_rules:
                continue

            rule = self.alert_rules[param]
            alert_message = self._evaluate_rule(param, value, rule)

            if alert_message and self._check_cooldown(param, rule.cooldown_minutes):
                alert = self._create_alert(
                    alert_type='ENVIRONMENTAL_THRESHOLD',
                    device_id='BOM_STATION',
                    message=alert_message,
                    severity=rule.severity
                )
                alerts.append(alert)
                self._record_alert_time(param)

        return alerts

    def check_animal_health_alerts(self, device_id: str, health_data: Dict[str, Any]) -> List[Alert]:
        """Check animal health parameters"""
        alerts = []

        # Heart rate check
        if 'heart_rate' in health_data:
            hr = health_data['heart_rate']
            if hr > 0:  # Valid reading
                rule = self.alert_rules.get('heart_rate')
                if rule:
                    alert_msg = self._evaluate_rule('heart_rate', hr, rule)
                    if alert_msg and self._check_cooldown(f"{device_id}_hr", rule.cooldown_minutes):
                        alert = self._create_alert(
                            'ANIMAL_HEART_RATE',
                            device_id,
                            f"Animal {device_id}: {alert_msg}",
                            rule.severity
                        )
                        alerts.append(alert)
                        self._record_alert_time(f"{device_id}_hr")

        # SpO2 check
        if 'spo2' in health_data:
            spo2 = health_data['spo2']
            if spo2 > 0:  # Valid reading
                rule = self.alert_rules.get('spo2')
                if rule:
                    alert_msg = self._evaluate_rule('spo2', spo2, rule)
                    if alert_msg and self._check_cooldown(f"{device_id}_spo2", rule.cooldown_minutes):
                        alert = self._create_alert(
                            'ANIMAL_OXYGEN_LEVEL',
                            device_id,
                            f"Animal {device_id}: {alert_msg}",
                            rule.severity
                        )
                        alerts.append(alert)
                        self._record_alert_time(f"{device_id}_spo2")

        # Temperature check
        if 'temperature' in health_data:
            temp = health_data['temperature']
            rule = self.alert_rules.get('animal_temperature')
            if rule:
                alert_msg = self._evaluate_rule('animal_temperature', temp, rule)
                if alert_msg and self._check_cooldown(f"{device_id}_temp", rule.cooldown_minutes):
                    alert = self._create_alert(
                        'ANIMAL_TEMPERATURE',
                        device_id,
                        f"Animal {device_id}: {alert_msg}",
                        rule.severity
                    )
                    alerts.append(alert)
                    self._record_alert_time(f"{device_id}_temp")

        # Activity level check (basic implementation)
        if all(key in health_data for key in ['accel_x', 'accel_y', 'accel_z']):
            activity = (
                health_data['accel_x']**2 + 
                health_data['accel_y']**2 + 
                health_data['accel_z']**2
            )**0.5

            if activity < 0.3 and self._check_cooldown(f"{device_id}_activity", 180):  # 3 hour cooldown
                alert = self._create_alert(
                    'LOW_ACTIVITY',
                    device_id,
                    f"Animal {device_id}: Very low activity detected (activity={activity:.2f})",
                    'INFO'
                )
                alerts.append(alert)
                self._record_alert_time(f"{device_id}_activity")

        return alerts

    def check_system_alerts(self, system_data: Dict[str, Any]) -> List[Alert]:
        """Check system-level parameters"""
        alerts = []

        # Water tank level
        if 'moisture_level' in system_data:
            moisture = system_data['moisture_level']
            rule = self.alert_rules.get('moisture_level')
            if rule:
                alert_msg = self._evaluate_rule('moisture_level', moisture, rule)
                if alert_msg and self._check_cooldown('water_tank', rule.cooldown_minutes):
                    alert = self._create_alert(
                        'LOW_WATER_TANK',
                        system_data.get('device_id', 'SPRINKLER_SYSTEM'),
                        alert_msg,
                        rule.severity
                    )
                    alerts.append(alert)
                    self._record_alert_time('water_tank')

        return alerts

    def _evaluate_rule(self, param: str, value: float, rule: AlertRule) -> Optional[str]:
        """Evaluate if a value violates an alert rule"""
        if rule.condition == 'min' and rule.threshold_min is not None:
            if value < rule.threshold_min:
                return f"{param.replace('_', ' ').title()} too low: {value:.2f}"

        elif rule.condition == 'max' and rule.threshold_max is not None:
            if value > rule.threshold_max:
                return f"{param.replace('_', ' ').title()} too high: {value:.2f}"

        elif rule.condition == 'range':
            if rule.threshold_min is not None and value < rule.threshold_min:
                return f"{param.replace('_', ' ').title()} too low: {value:.2f}"
            elif rule.threshold_max is not None and value > rule.threshold_max:
                return f"{param.replace('_', ' ').title()} too high: {value:.2f}"

        return None

    def _check_cooldown(self, alert_key: str, cooldown_minutes: int) -> bool:
        """Check if enough time has passed since last alert"""
        if alert_key not in self.recent_alerts:
            return True

        last_alert_time = self.recent_alerts[alert_key]
        time_diff = datetime.now(timezone.utc) - last_alert_time
        return time_diff.total_seconds() > (cooldown_minutes * 60)

    def _record_alert_time(self, alert_key: str):
        """Record when an alert was triggered"""
        self.recent_alerts[alert_key] = datetime.now(timezone.utc)

    def _create_alert(self, alert_type: str, device_id: str, message: str, severity: str) -> Alert:
        """Create new alert and store in database"""
        timestamp = datetime.now(timezone.utc).isoformat()

        # Insert into database
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO system_alerts 
            (timestamp, alert_type, device_id, message, severity, acknowledged)
            VALUES (?, ?, ?, ?, ?, 0)
        """, (timestamp, alert_type, device_id, message, severity))

        alert_id = cursor.lastrowid
        conn.commit()
        conn.close()

        alert = Alert(alert_id, timestamp, alert_type, device_id, message, severity)

        # Send notifications
        self._send_notifications(alert)

        logging.warning(f"ALERT [{severity}] {alert_type}: {message}")
        return alert

    def _send_notifications(self, alert: Alert):
        """Send alert notifications via configured channels"""
        try:
            if alert.severity == 'CRITICAL':
                # Send immediate notifications for critical alerts
                self._send_email_notification(alert)
                self._send_webhook_notification(alert)
                # self._send_sms_notification(alert)  # Implement if needed
            elif alert.severity == 'WARNING':
                # Send email for warnings
                self._send_email_notification(alert)
                self._send_webhook_notification(alert)
            else:
                # Just webhook for info alerts
                self._send_webhook_notification(alert)

        except Exception as e:
            logging.error(f"Failed to send alert notification: {e}")

    def _send_email_notification(self, alert: Alert):
        """Send email notification"""
        if not self.email_config.get('enabled', False):
            return

        try:
            smtp_server = self.email_config.get('smtp_server')
            smtp_port = self.email_config.get('smtp_port', 587)
            username = self.email_config.get('username')
            password = self.email_config.get('password')
            recipients = self.email_config.get('recipients', [])

            if not all([smtp_server, username, password, recipients]):
                return

            msg = MimeMultipart()
            msg['From'] = username
            msg['To'] = ', '.join(recipients)
            msg['Subject'] = f"[FARM ALERT - {alert.severity}] {alert.alert_type}"

            body = f"""
Farm Alert Notification

Alert Type: {alert.alert_type}
Severity: {alert.severity}
Device: {alert.device_id}
Time: {alert.timestamp}
Message: {alert.message}

Please check your farm monitoring system for more details.
"""
            msg.attach(MimeText(body, 'plain'))

            with smtplib.SMTP(smtp_server, smtp_port) as server:
                server.starttls()
                server.login(username, password)
                server.sendmail(username, recipients, msg.as_string())

            logging.info(f"Email alert sent for {alert.alert_type}")

        except Exception as e:
            logging.error(f"Failed to send email alert: {e}")

    def _send_webhook_notification(self, alert: Alert):
        """Send webhook notification"""
        if not self.webhook_config.get('enabled', False):
            return

        try:
            webhook_url = self.webhook_config.get('url')
            if not webhook_url:
                return

            payload = {
                'alert_id': alert.id,
                'timestamp': alert.timestamp,
                'alert_type': alert.alert_type,
                'device_id': alert.device_id,
                'message': alert.message,
                'severity': alert.severity,
                'farm_id': 'FARM_001'  # Configure per farm
            }

            response = requests.post(
                webhook_url,
                json=payload,
                timeout=10,
                headers={'Content-Type': 'application/json'}
            )

            if response.status_code == 200:
                logging.info(f"Webhook alert sent for {alert.alert_type}")
            else:
                logging.warning(f"Webhook responded with status {response.status_code}")

        except Exception as e:
            logging.error(f"Failed to send webhook alert: {e}")

    def get_active_alerts(self, limit: int = 50) -> List[Alert]:
        """Get active (unacknowledged) alerts"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM system_alerts 
            WHERE acknowledged = 0 
            ORDER BY timestamp DESC 
            LIMIT ?
        """, (limit,))

        rows = cursor.fetchall()
        conn.close()

        return [Alert(**dict(row)) for row in rows]

    def acknowledge_alert(self, alert_id: int) -> bool:
        """Acknowledge an alert"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE system_alerts 
                SET acknowledged = 1, acknowledged_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (alert_id,))

            success = cursor.rowcount > 0
            conn.commit()
            conn.close()

            if success:
                logging.info(f"Alert {alert_id} acknowledged")

            return success

        except Exception as e:
            logging.error(f"Failed to acknowledge alert {alert_id}: {e}")
            return False

    def get_alert_statistics(self) -> Dict[str, Any]:
        """Get alert system statistics"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Count alerts by severity in last 24 hours
        cursor.execute("""
            SELECT severity, COUNT(*) as count
            FROM system_alerts 
            WHERE datetime(timestamp) > datetime('now', '-1 day')
            GROUP BY severity
        """)
        recent_alerts = dict(cursor.fetchall())

        # Count unacknowledged alerts
        cursor.execute("SELECT COUNT(*) FROM system_alerts WHERE acknowledged = 0")
        unacknowledged = cursor.fetchone()[0]

        # Most common alert types in last week
        cursor.execute("""
            SELECT alert_type, COUNT(*) as count
            FROM system_alerts 
            WHERE datetime(timestamp) > datetime('now', '-7 days')
            GROUP BY alert_type 
            ORDER BY count DESC 
            LIMIT 5
        """)
        common_alerts = dict(cursor.fetchall())

        conn.close()

        return {
            'recent_alerts_24h': recent_alerts,
            'unacknowledged_count': unacknowledged,
            'common_alert_types_7d': common_alerts,
            'active_rules': len(self.alert_rules),
            'notification_channels': {
                'email': self.email_config.get('enabled', False),
                'webhook': self.webhook_config.get('enabled', False),
                'sms': self.sms_config.get('enabled', False)
            }
        }

# Example usage
if __name__ == "__main__":
    config = {
        'email': {
            'enabled': True,
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'username': 'your-email@gmail.com',
            'password': 'your-app-password',
            'recipients': ['farm-manager@example.com', 'alerts@example.com']
        },
        'webhook': {
            'enabled': True,
            'url': 'https://your-webhook-url.com/farm-alerts'
        },
        'alert_rules': {
            'temperature': {
                'condition': 'range',
                'min': 10.0,
                'max': 45.0,
                'severity': 'WARNING',
                'cooldown': 30
            }
        }
    }

    alert_manager = AlertManager('/home/pi/farm_data.db', config)

    # Test environmental alert
    sensor_data = {'temperature': 50.0, 'humidity': 30.0}
    alerts = alert_manager.check_environmental_alerts(sensor_data)

    print(f"Generated {len(alerts)} alerts")
    for alert in alerts:
        print(f"- {alert.severity}: {alert.message}")
