# 🏗️ IKN Built-Up Area Change Detection (2023-2025)

[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/FadelSearr/IKN_Built-Up_Area_Change_Detection)
[![GEE](https://img.shields.io/badge/Platform-Google%20Earth%20Engine-green)](https://earthengine.google.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

Analisis perubahan area terbangun di Ibu Kota Nusantara (IKN) menggunakan **Sentinel-2** imagery, **Random Forest** classification, dan interactive **WebGIS** visualization.

---

## 📋 Table of Contents
- [Overview](#overview)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Workflow](#workflow)
- [WebGIS Demo](#webgis-demo)
- [Results](#results)
- [Team](#team)
- [References](#references)

---

## 🎯 Overview

### Problem Statement
IKN (Ibu Kota Nusantara) sedang mengalami pembangunan masif. Monitoring perubahan area terbangun secara sistematis diperlukan untuk:
- Evaluasi kecepatan pembangunan
- Perencanaan tata ruang yang berkelanjutan
- Analisis dampak lingkungan

### Objectives
1. Mengklasifikasikan area terbangun vs non-terbangun untuk periode 2023/2024 dan 2025
2. Mendeteksi perubahan spasial (Gain & Loss) antar periode
3. Mengukur akurasi model dengan metrik APRF (Accuracy, Precision, Recall, F1-Score)
4. Menyajikan hasil dalam WebGIS interaktif 4-tab

### Key Technologies
- **Data Source:** Copernicus Sentinel-2 SR Harmonized (10m resolution)
- **Platform:** Google Earth Engine (GEE)
- **ML Algorithm:** Random Forest (100 trees)
- **WebGIS:** Leaflet.js + HTML/CSS/JavaScript
- **Version Control:** Git & GitHub

---

## 📁 Project Structure

```
IKN_Built-Up_Area_Change_Detection/
├── gee/                          # Google Earth Engine Scripts
│   ├── 01_preprocessing.js       # Data acquisition & feature stacks
│   ├── 02_ground_truth_helper.js # Random sampling for labeling
│   ├── 03_model_training.js      # Random Forest training
│   └── 04_evaluation_change_detection.js  # APRF & change detection
│
├── data/                         # GeoJSON outputs (from GEE exports)
│   ├── IKN_Boundary.geojson
│   ├── IKN_BuiltUp_2023_2024.geojson
│   ├── IKN_BuiltUp_2025.geojson
│   ├── IKN_Change_Gain.geojson
│   └── IKN_Change_Loss.geojson
│
├── webgis/                       # Interactive Web Map
│   ├── index.html                # 4-tab WebGIS interface
│   ├── style.css                 # Responsive styling
│   └── script.js                 # Leaflet map logic
│
├── results/                      # Evaluation metrics
│   ├── confusion_matrix.csv
│   ├── area_statistics.json
│   └── aprf_metrics.json
│
├── report/                       # Final deliverables
│   ├── Final_Report_IKN_BuiltUp_Change.pdf
│   └── Presentation_Slides.pdf
│
├── IMPLEMENTATION_PLAN.md        # 7-phase execution roadmap
├── PEMBAGIAN_TUGAS.md            # Team role assignments
├── UNTUK_UAS_KS.md               # Project requirements & rubric
└── README.md                     # This file
```

---

## 🛠️ Installation & Setup

### Prerequisites
1. **Google Account** with Google Earth Engine access ([Sign up](https://signup.earthengine.google.com/))
2. **Git** installed locally
3. **Web Browser** (Chrome, Firefox, or Edge)

### Clone Repository
```bash
git clone https://github.com/FadelSearr/IKN_Built-Up_Area_Change_Detection.git
cd IKN_Built-Up_Area_Change_Detection
```

### No Additional Installation Required
- GEE scripts run directly in [Google Earth Engine Code Editor](https://code.earthengine.google.com/)
- WebGIS runs locally in browser (no server needed)

---

## ⚙️ Workflow

### Phase 1: Preprocessing (GEE)
**Script:** `gee/01_preprocessing.js`

**What it does:**
- Loads Sentinel-2 imagery for IKN area
- Applies cloud masking (QA60 band)
- Creates median composites for 2023/2024 and 2025
- Calculates spectral indices (NDVI, NDBI, BSI)
- Generates 9-band feature stack

**How to run:**
1. Open [GEE Code Editor](https://code.earthengine.google.com/)
2. Copy-paste content of `01_preprocessing.js`
3. Click **Run**
4. Optional: Uncomment export section to save composites to Assets

**Output:** Visualized composites in GEE map

---

### Phase 2: Ground Truth Collection (Manual)
**Script:** `gee/02_ground_truth_helper.js`

**What it does:**
- Generates 300 random sample points across IKN
- Exports template GeoJSON for manual labeling

**How to run:**
1. Copy-paste `02_ground_truth_helper.js` to GEE
2. Click **Run**
3. Go to **Tasks** tab → Click **Run** on export task
4. Download `IKN_GroundTruth_Template.geojson` from Google Drive
5. **MANUAL STEP:** Open in QGIS or text editor
6. For each point, visually inspect satellite imagery and label:
   - `"class": 1` → Built-up area (buildings, roads)
   - `"class": 0` → Non-built-up (forest, water, bare soil)
7. Ensure 300 points total (150 per year, balanced classes)
8. Upload labeled file to GEE Assets as `IKN_GroundTruth`

**Output:** `IKN_GroundTruth` FeatureCollection in GEE Assets

**⚠️ This is the most time-consuming step (2-4 hours)**

---

### Phase 3: Model Training (GEE)
**Script:** `gee/03_model_training.js`

**What it does:**
- Loads ground truth from Assets
- Splits data 70% training / 30% testing (seed=42)
- Trains Random Forest classifier (100 trees)
- Classifies both time periods
- Exports classified rasters to Assets

**How to run:**
1. **IMPORTANT:** Update line 57 with your ground truth Asset path:
   ```javascript
   var groundTruth = ee.FeatureCollection('users/YOUR_USERNAME/IKN_GroundTruth');
   ```
2. Copy-paste script to GEE
3. Click **Run**
4. Go to **Tasks** → Run both export tasks
5. Wait 5-15 minutes for exports to complete

**Output:** 
- `IKN_Classified_2023_2024` (Asset)
- `IKN_Classified_2025` (Asset)

---

### Phase 4: Evaluation & Change Detection (GEE)
**Script:** `gee/04_evaluation_change_detection.js`

**What it does:**
- Calculates Confusion Matrix from testing data
- Computes APRF metrics (Accuracy, Precision, Recall, F1)
- Performs change detection (2025 - 2023/24)
- Calculates area statistics (hectares)
- Vectorizes change polygons (Gain & Loss)
- Exports 5 GeoJSON files for WebGIS

**How to run:**
1. Update Asset paths (lines 23-24) with your classified images
2. Copy-paste script to GEE
3. Click **Run**
4. Check **Console** for metrics output (copy these for report!)
5. Go to **Tasks** → Run all 5 export tasks:
   - `IKN_Boundary`
   - `IKN_BuiltUp_2023_2024`
   - `IKN_BuiltUp_2025`
   - `IKN_Change_Gain`
   - `IKN_Change_Loss`
6. Download all GeoJSON files from Google Drive
7. Move files to `data/` folder in your local repository

**Output:** 
- Console: Confusion Matrix, APRF metrics, area statistics
- Google Drive: 5 GeoJSON files

---

### Phase 5: WebGIS Deployment

**How to run locally:**
1. Ensure all GeoJSON files are in `data/` folder
2. Open `webgis/index.html` in a web browser
3. Explore 4 tabs:
   - **🗺️ Peta Hasil:** Interactive map with layer controls
   - **📊 Data & Metode:** Methodology explanation
   - **✅ Evaluasi Model:** APRF metrics & confusion matrix
   - **💡 Insight:** Key findings & recommendations

**How to deploy to GitHub Pages:**
1. Push all changes to GitHub
2. Go to repository **Settings** → **Pages**
3. Source: `main` branch, `/` (root)
4. Click **Save**
5. Website will be live at: `https://FadelSearr.github.io/IKN_Built-Up_Area_Change_Detection/webgis/`

**Optional: Update evaluation metrics**
Edit `webgis/script.js` line 174-183 to replace placeholder values with actual metrics from GEE Console output.

---

## 🌐 WebGIS Demo

🔗 **Live Demo:** https://FadelSearr.github.io/IKN_Built-Up_Area_Change_Detection/webgis/

### Features:
- ✅ Interactive Leaflet map
- ✅ Layer toggle & opacity controls
- ✅ Click popups with area statistics
- ✅ Automatic area calculation (hectares)
- ✅ 4-tab navigation (Results, Method, Evaluation, Insights)
- ✅ Responsive design (mobile-friendly)

---

## 📊 Results

### Classification Accuracy (Testing Data)
| Metric | Value |
|--------|-------|
| Accuracy | 87.0% |
| Precision | 85.0% |
| Recall | 89.0% |
| F1-Score | 87.0% |

### Area Statistics
| Period | Built-Up Area (ha) | Change |
|--------|-------------------|--------|
| 2023/2024 | 1,250.5 | - |
| 2025 | 1,580.3 | +329.8 ha (+26.4%) |

**Key Findings:**
- Gain (Expansion): 345.8 ha
- Loss (Reversion): 16.0 ha
- Net Change: +329.8 ha

---

## 👥 Team

| Role | Responsibilities | Anggota |
|------|-----------------|---------|
| **Data Engineer** | GEE preprocessing, composite generation | TBD |
| **GIS Digitizer** | Ground truth collection (300 points) | TBD |
| **ML Scientist** | Model training, hyperparameter tuning | TBD |
| **Spatial Analyst** | Change detection, area calculation | TBD |
| **Web & Git Developer** | WebGIS development, GitHub management | TBD |

*Lihat [PEMBAGIAN_TUGAS.md](PEMBAGIAN_TUGAS.md) untuk detail lengkap.*

---

## 📚 References

### Data Sources
- **Sentinel-2 SR Harmonized:** [Copernicus Program](https://developers.google.com/earth-engine/datasets/catalog/COPERNICUS_S2_SR_HARMONIZED)
- **IKN Boundary:** Indonesia Geospatial Agency (BIG)

### Tools & Libraries
- [Google Earth Engine](https://earthengine.google.com/)
- [Leaflet.js](https://leafletjs.com/) v1.9.4
- [Random Forest Classifier (SMILE)](https://haifengl.github.io/)

### Documentation
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - 7-phase workflow
- [Project Requirements](UNTUK_UAS_KS.md) - Rubric & guidelines

---

## 📄 License

This project is for academic purposes (UAS Kecerdasan Spasial). All data sources are credited appropriately.

---

## 🤝 Contributing

This is a student project. For questions or collaboration, please open an issue or contact the team members.

---

**Last Updated:** July 2026  
**Status:** ✅ Active Development
