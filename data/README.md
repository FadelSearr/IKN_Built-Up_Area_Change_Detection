# Data Folder
Folder ini berisi file GeoJSON hasil export dari Google Earth Engine.

## File yang Dibutuhkan:
- `IKN_Boundary.geojson` - Batas administrasi IKN
- `IKN_BuiltUp_2023_2024.geojson` - Area terbangun periode 2023/2024
- `IKN_BuiltUp_2025.geojson` - Area terbangun periode 2025
- `IKN_Change_Gain.geojson` - Polygon ekspansi area terbangun
- `IKN_Change_Loss.geojson` - Polygon pengurangan area terbangun
- `ground_truth_points.csv` - Titik sampel ground truth (opsional)

## Cara Mendapatkan File:
1. Jalankan script `gee/04_evaluation_change_detection.js` di Google Earth Engine
2. Klik tab **Tasks** di GEE Code Editor
3. Klik **Run** pada setiap task export
4. File akan tersimpan di Google Drive Anda
5. Download semua file dan letakkan di folder ini
6. WebGIS akan otomatis membaca file-file ini
