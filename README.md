<<<<<<< HEAD
# VoltPulse - Electricity Usage & Cost Analyser

VoltPulse is a high-performance, responsive electricity intelligence platform built to monitor, analyze, and optimize residential and light commercial power consumption, electricity bills, carbon footprints, and appliance loads.

![VoltPulse Banner](https://img.shields.io/badge/VoltPulse-v1.0.0-00F0FF?style=for-the-badge&logo=electron&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-10B981?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Production_Ready-3B82F6?style=for-the-badge)

---

## ⚡ Key Capabilities & Features

### 1. Real-Time Telemetry & Smart Meter Simulation
- **Live Stream**: Simulated live smart meter pushing active power (kW), voltage (230V), current (A), and power factor at 2-second intervals.
- **Dynamic Load Curve**: Interactive 24-hour hourly load curve with color-coded **Time-of-Use (ToU)** tiers:
  - 🔴 **On-Peak** (2:00 PM – 8:00 PM): Highest tariff period.
  - 🟡 **Mid-Peak** (7:00 AM – 2:00 PM, 8:00 PM – 10:00 PM).
  - 🔵 **Off-Peak** (10:00 PM – 7:00 AM): Lowest tariff period.

### 2. Multi-Model Tariff & Billing Engine
- **Time-of-Use (ToU)**: Dynamic pricing with custom on-peak, mid-peak, and off-peak rates.
- **Tiered / Slab Rates**: Tier 1 (0–150 kWh), Tier 2 (151–400 kWh), and Tier 3 (>400 kWh).
- **Flat Rate**: Blended standard rate per kWh.
- **Solar Net Metering Offset**: Configure monthly rooftop solar generation (kWh) to calculate feed-in tariff credits.
- **Multi-Currency Support**: Instant switching between **USD ($)**, **INR (₹)**, **EUR (€)**, **GBP (£)**, and **AUD (A$)**.

### 3. Appliance Energy Disaggregation & "What-If" Simulator
- Pre-configured appliance catalog (Central HVAC, EV Level 2 Charger, Inverter Refrigerator, Heat Pump, Washer/Dryer, Workstation PC, OLED TV).
- **Live Slider Controls**: Adjust operating hours on the fly to see immediate changes in monthly costs and energy share percentages.
- **Custom Device Ingestion**: Add any appliance by specifying rated power (Watts), category, and daily runtime.
- **"What-If" Off-Peak Shift Tool**: Calculates exact monthly savings achieved by shifting heavy loads (e.g. EV charging or laundry) to off-peak hours.

### 4. Energy Analytics & Smart Diagnostics
- **Vampire / Standby Drain Detector**: Analyzes minimum nighttime baseload (1:00 AM – 5:00 AM) and projects annual cost wasted on idle standby devices.
- **Spike & Anomaly Detection**: Flags power draws exceeding 2.2x baseline median load.
- **Eco Impact & Carbon Footprint**: Computes CO2 emissions (kg and metric tons) and translates them into equivalent tree offset requirements and gasoline vehicle miles avoided.
- **Energy Efficiency Rating**: 0–100 score and letter grade (A+ to F) based on load factor, vampire ratio, and peak consumption.

### 5. Data Management & Reporting
- **Drag-and-Drop CSV Ingestion**: Upload custom smart meter logs or utility export files.
- **Bundled Sample Dataset**: Included `sample_smart_meter_data.csv` with hourly readings, voltage, power factor, and tariff tiers.
- **CSV Export**: Export analyzed hourly energy and cost breakdowns.
- **Audit Report Generator**: Print-ready and PDF-optimized layout with print media styles.

---

## 🚀 Getting Started

VoltPulse is built with vanilla web technologies, requiring **no build step, dependencies, or compilers**.

### Method 1: Local HTTP Server (Recommended)
You can run it using Python's built-in server or any static file server:

```bash
# Using Python
python -m http.server 8080

# Or using Node.js npx
npx serve .
```

Open your browser and navigate to:
```
http://localhost:8080
```

### Method 2: Direct File Launch
Simply double-click `index.html` to open the application directly in any modern web browser (Chrome, Edge, Firefox, Safari).

---

## 📁 Project Structure

```
Electricity_usage_Analyser/
├── index.html                  # Main application structure & semantic layout
├── css/
│   └── style.css               # Glassmorphism design system (Dark & Light themes)
├── js/
│   ├── data.js                 # Default profiles, appliance ratings & sample generators
│   ├── tariff.js               # Multi-tariff billing calculation engine
│   ├── analytics.js            # Anomaly, baseload, eco impact & scoring algorithms
│   ├── charts.js               # Chart.js visualization wrappers
│   └── app.js                  # Main controller, event listeners, live simulator & CSV parser
├── sample_smart_meter_data.csv # Ready-to-use smart meter dataset for upload testing
└── README.md                   # Documentation & User Guide
```

---

## 📐 Mathematical Formulas

1. **Appliance Energy Consumption (kWh/month)**:
   $$\text{kWh}_{\text{monthly}} = \frac{\text{Watts} \times \text{Duty Cycle} \times \text{Hours/Day} \times 30}{1000}$$

2. **Load Factor**:
   $$\text{Load Factor} = \frac{\text{Average Load (kW)}}{\text{Peak Demand (kW)}}$$

3. **Carbon Footprint**:
   $$\text{CO}_2\ (\text{kg}) = \text{Total kWh} \times \text{Emission Factor}\ (0.385\ \text{kg/kWh default})$$

4. **Tree Offset Equivalency**:
   $$\text{Trees Required} = \left\lceil \frac{\text{CO}_2\ (\text{kg})}{1.81\ \text{kg/month/tree}} \right\rceil$$

---

## 📄 License
This project is open-source under the [MIT License](LICENSE).
=======
# Electricity-Usage-Analyser
>>>>>>> 39d30db303c5dcc56ebf5400f5b77ed9ed5d4037
