#!/usr/bin/env python3
"""
Cloud Synchronization Module for Smart Farm BOM System
Handles data upload to cloud services and real-time synchronization
"""

import json
import time
import requests
import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
import sqlite3
import threading
from pathlib import Path

class CloudSyncManager:
    def __init__(self, db_path: str, config: Dict[str, Any]):
        self.db_path = db_path
        self.api_url = config.get('api_url', 'https://your-cloud-api.com/api/farm-data')
        self.api_key = config.get('api_key', 'your-api-key-here')
        self.sync_interval = config.get('sync_interval', 300)
        self.batch_size = config.get('batch_size', 100)
        self.max_retries = config.get('max_retries', 3)

        self.running = False
        self.sync_thread = None

        # Statistics
        self.sync_stats = {
            'total_synced': 0,
            'failed_syncs': 0,
            'last_sync_time': None,
            'last_sync_status': 'Never'
        }

    def start_sync_service(self):
        """Start the cloud synchronization service"""
        self.running = True
        self.sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.sync_thread.start()
        logging.info("Cloud sync service started")

    def stop_sync_service(self):
        """Stop the cloud synchronization service"""
        self.running = False
        if self.sync_thread:
            self.sync_thread.join(timeout=5)
        logging.info("Cloud sync service stopped")

    def sync_all_data(self):
        """Manually trigger synchronization of all unsynced data"""
        tables = ['bom_readings', 'ear_tag_data', 'sprinkler_data', 'system_alerts']

        total_synced = 0
        for table in tables:
            try:
                synced_count = self._sync_table_data(table)
                total_synced += synced_count
                logging.info(f"Synced {synced_count} records from {table}")

            except Exception as e:
                logging.error(f"Failed to sync {table}: {e}")
                self.sync_stats['failed_syncs'] += 1

        self.sync_stats['total_synced'] += total_synced
        self.sync_stats['last_sync_time'] = datetime.now(timezone.utc).isoformat()
        self.sync_stats['last_sync_status'] = 'Success' if total_synced > 0 else 'No data'

        return total_synced

    def _sync_loop(self):
        """Main synchronization loop"""
        while self.running:
            try:
                self.sync_all_data()
                time.sleep(self.sync_interval)

            except Exception as e:
                logging.error(f"Sync loop error: {e}")
                time.sleep(60)  # Wait longer on error

    def _sync_table_data(self, table: str) -> int:
        """Sync specific table data to cloud"""
        unsynced_data = self._get_unsynced_data(table, self.batch_size)

        if not unsynced_data:
            return 0

        # Prepare data for cloud API
        payload = {
            'farm_id': 'FARM_001',  # Configure per farm
            'table': table,
            'records': unsynced_data,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'source': 'BOM_STATION',
            'batch_id': f"{table}_{int(time.time())}"
        }

        # Attempt to send data with retries
        for attempt in range(self.max_retries):
            try:
                success = self._send_to_cloud(payload)
                if success:
                    # Mark records as synced
                    ids = [record['id'] for record in unsynced_data]
                    self._mark_synced(table, ids)
                    return len(unsynced_data)
                else:
                    logging.warning(f"Sync attempt {attempt + 1} failed for {table}")

            except Exception as e:
                logging.error(f"Sync attempt {attempt + 1} error: {e}")

            time.sleep(2 ** attempt)  # Exponential backoff

        # All attempts failed
        logging.error(f"Failed to sync {table} after {self.max_retries} attempts")
        return 0

    def _send_to_cloud(self, payload: Dict[str, Any]) -> bool:
        """Send payload to cloud API"""
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.api_key}',
            'User-Agent': 'SmartFarm-BOM/1.0'
        }

        try:
            response = requests.post(
                self.api_url,
                json=payload,
                headers=headers,
                timeout=30
            )

            if response.status_code == 200:
                logging.info(f"Successfully synced {len(payload['records'])} records")
                return True
            elif response.status_code == 429:  # Rate limited
                logging.warning("Rate limited by cloud API, backing off")
                time.sleep(60)
                return False
            else:
                logging.error(f"Cloud API error: {response.status_code} - {response.text}")
                return False

        except requests.exceptions.Timeout:
            logging.error("Cloud API request timeout")
            return False
        except requests.exceptions.ConnectionError:
            logging.error("Could not connect to cloud API")
            return False
        except Exception as e:
            logging.error(f"Unexpected error sending to cloud: {e}")
            return False

    def _get_unsynced_data(self, table: str, limit: int) -> List[Dict]:
        """Get unsynced data from database"""
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

    def _mark_synced(self, table: str, ids: List[int]):
        """Mark records as successfully synced"""
        if not ids:
            return

        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        placeholders = ','.join('?' * len(ids))
        cursor.execute(f"""
            UPDATE {table} 
            SET synced = 1, 
                synced_at = CURRENT_TIMESTAMP
            WHERE id IN ({placeholders})
        """, ids)

        conn.commit()
        conn.close()

    def get_sync_statistics(self) -> Dict[str, Any]:
        """Get synchronization statistics"""
        # Add database statistics
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        tables = ['bom_readings', 'ear_tag_data', 'sprinkler_data', 'system_alerts']
        pending_counts = {}

        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table} WHERE synced = 0")
            pending_counts[table] = cursor.fetchone()[0]

        conn.close()

        return {
            **self.sync_stats,
            'pending_sync': pending_counts,
            'sync_interval': self.sync_interval,
            'api_url': self.api_url[:50] + '...' if len(self.api_url) > 50 else self.api_url
        }

    def force_sync_table(self, table: str) -> int:
        """Force immediate sync of a specific table"""
        try:
            return self._sync_table_data(table)
        except Exception as e:
            logging.error(f"Force sync failed for {table}: {e}")
            return 0

    def upload_camera_images(self, image_dir: str):
        """Upload camera images to cloud storage"""
        try:
            image_path = Path(image_dir)
            if not image_path.exists():
                return

            # Find unsynced images (implement your logic here)
            for image_file in image_path.glob("*.jpg"):
                # Check if already uploaded (you can track this in database)
                self._upload_single_image(image_file)

        except Exception as e:
            logging.error(f"Image upload error: {e}")

    def _upload_single_image(self, image_path: Path):
        """Upload single image to cloud storage"""
        try:
            # This is a placeholder - implement actual cloud storage upload
            # e.g., AWS S3, Google Cloud Storage, etc.
            logging.info(f"Would upload image: {image_path.name}")

        except Exception as e:
            logging.error(f"Failed to upload image {image_path}: {e}")

# Example usage and testing
if __name__ == "__main__":
    config = {
        'api_url': 'https://your-cloud-api.com/api/farm-data',
        'api_key': 'your-api-key-here',
        'sync_interval': 60,  # 1 minute for testing
        'batch_size': 50
    }

    sync_manager = CloudSyncManager('/home/pi/farm_data.db', config)

    # Test sync
    synced_count = sync_manager.sync_all_data()
    print(f"Synced {synced_count} records")

    # Print statistics
    stats = sync_manager.get_sync_statistics()
    print("Sync Statistics:", json.dumps(stats, indent=2))
