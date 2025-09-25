MODEL-A: Individual Chicken Disease Risk Monitoring
Overview

MODEL-A focuses on monitoring and predicting the risk of specific diseases for individual chickens using sensor and environmental data.

It defines a base class (AnimalMonitoring) and a specialized subclass (ChickenMonitoring) that provide methods for data handling, feature engineering, disease risk modeling, and prediction.

Key Features

Data Handling:

Loads individual chicken sensor data (accelerometer, temperature, SpO₂).

Merges with environmental data (BOM data: temperature, humidity, CO₂, CO, NH₃, PM2.5).

Feature Engineering:

Activity levels derived from accelerometer signals.

Standardized temperature and SpO₂ readings.

Combined features for health modeling.

Model Training:

Uses XGBoost classifiers for predicting risk of specific diseases:

Avian Influenza

Fowl Typhoid

Coccidiosis

Risk Categorization:

Converts prediction scores into categories: Low, Medium, High.

Output:

Results saved in JSON format, including per-chicken predictions with detailed risk levels.

Example Usage

Define paths for chicken data and BOM data.

Instantiate ChickenMonitoring.

Train disease prediction models.

Run predictions for new data.

Save results to chicken_prediction_results.json.

Preview predictions for each chicken.

Data Requirements

Individual Chicken Sensor Data (CSV):

Required columns:

timestamp, accelerometer_x, accelerometer_y, accelerometer_z, temperature_x, SpO2

Environmental BOM Data (CSV):

Required columns:

timestamp, temperature, humidity, CO2_ppm, CO_ppm, NH3_ppm, PM2.5

MODEL-B: Farm-Level Chicken Health Risk Prediction
Overview

MODEL-B focuses on predicting farm-wide chicken health risk using aggregated daily features derived from environmental (BOM) and activity (sprinkler) data.

The process is encapsulated in the calculate_farm_risk function for ease of use.

Key Features

Data Loading:

Loads BOM data (BOM for chicken.csv).

Loads sprinkler activity data (sprinkler for chicken.csv).

Data Preprocessing:

Converts timestamps to datetime.

Handles missing values with forward-fill.

Feature Engineering:

Daily aggregate features from BOM: mean temperature, humidity, gases, PM2.5.

Sprinkler features: activity count, operator activity, per-operator metrics.

Derived features like Temperature-Humidity Index (THI).

Model Development:

Trains an XGBoost Regressor to predict daily farm-level risk scores.

Includes dummy target risk scores for demonstration (replaceable with real data).

Output:

Predicted farm-level risk scores per day with engineered features.

Example Usage

Call calculate_farm_risk with BOM and sprinkler file paths.

Get a DataFrame with features, dummy risk (if generated), and predicted scores.

View results with timestamp and predicted risk score.

Data Requirements

BOM Data (CSV):

Required columns:

timestamp, temperature, humidity, CO2_ppm, CO_ppm, NH3_ppm, PM2.5

Sprinkler Data (CSV):

Required columns:

timestamp, activity (e.g., entry, exit), operator_1, operator_2, operator_3

Combined Workflow

MODEL-A provides fine-grained, individual-level disease risk monitoring.

MODEL-B provides aggregate, farm-level health risk predictions.

Together, these enable a hierarchical health management system:

Early detection of risks per chicken.

Daily risk tracking for the entire farm.
