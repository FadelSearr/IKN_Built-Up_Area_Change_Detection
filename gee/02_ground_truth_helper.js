// ==============================================================================
// FASE 2: GROUND TRUTH COLLECTION HELPER
// Script ini membuat 300 titik acak untuk mempermudah digitasi ground truth
// ==============================================================================

// 1. LOAD BATAS IKN (gunakan yang sama dengan script preprocessing)
// Batas administrasi IKN yang lebih detail
var iknBoundary = ee.Geometry.Polygon([
  [
    [116.83, -0.75],
    [116.95, -0.78],
    [117.05, -0.82],
    [117.08, -0.88],
    [117.05, -0.94],
    [116.98, -0.98],
    [116.88, -1.00],
    [116.78, -1.02],
    [116.68, -1.01],
    [116.58, -0.98],
    [116.50, -0.94],
    [116.48, -0.88],
    [116.50, -0.82],
    [116.58, -0.78],
    [116.68, -0.75],
    [116.78, -0.73],
    [116.83, -0.75]
  ]
]);

Map.centerObject(iknBoundary, 11);
Map.addLayer(iknBoundary, {color: 'yellow'}, 'Batas IKN');

// 2. LOAD CITRA UNTUK REFERENSI VISUAL
var s2_2025 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iknBoundary)
  .filterDate('2025-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .median()
  .clip(iknBoundary);

var visRGB = {bands: ['B4', 'B3', 'B2'], min: 0, max: 3000};
Map.addLayer(s2_2025, visRGB, 'Citra 2025 (untuk referensi)', true);

// 3. GENERATE 300 TITIK ACAK STRATIFIED
// Kita buat 300 titik acak yang tersebar merata
var randomPoints = ee.FeatureCollection.randomPoints({
  region: iknBoundary,
  points: 300,
  seed: 12345 // Seed tetap agar hasil konsisten
});

// Tambahkan properti placeholder + ASSIGN YEAR OTOMATIS
// 150 titik pertama = 2023, 150 titik terakhir = 2025
var pointsList = randomPoints.toList(300);
var points2023 = ee.FeatureCollection(pointsList.slice(0, 150)).map(function(feature) {
  return feature.set({
    'class': -1,  // -1 = BELUM DILABELI (isi dengan 0 atau 1 nanti)
    'year': 2023,
    'id': feature.id()
  });
});

var points2025 = ee.FeatureCollection(pointsList.slice(150, 300)).map(function(feature) {
  return feature.set({
    'class': -1,  // -1 = BELUM DILABELI (isi dengan 0 atau 1 nanti)
    'year': 2025,
    'id': feature.id()
  });
});

// Gabungkan kembali
randomPoints = points2023.merge(points2025);

// Visualisasi titik di peta
Map.addLayer(randomPoints, {color: 'red'}, '300 Titik Sampel', true);

print('Total titik yang dibuat:', randomPoints.size());
print('Contoh 5 titik pertama:', randomPoints.limit(5));

// ==============================================================================
// CARA MANUAL LABELING (PILIH SALAH SATU):
// ==============================================================================

// OPSI A: EXPORT KE GOOGLE DRIVE sebagai Shapefile/GeoJSON
// Kemudian buka di QGIS/ArcGIS, edit kolom 'class' secara manual
Export.table.toDrive({
  collection: randomPoints,
  description: 'IKN_GroundTruth_Template',
  fileFormat: 'GeoJSON'
});

// OPSI B: SIMPAN KE ASSETS (lalu edit manual di GEE)
// Hapus komentar di bawah ini jika ingin langsung ke Assets
/*
Export.table.toAsset({
  collection: randomPoints,
  description: 'IKN_GroundTruth_Template',
  assetId: 'IKN_GroundTruth_Template'
});
*/

// ==============================================================================
// INSTRUKSI LABELING MANUAL:
// ==============================================================================
// 1. Klik "Run" untuk menghasilkan 300 titik
// 2. Klik "Tasks" (tab di sebelah kanan), lalu klik "Run" pada task export
// 3. File GeoJSON akan disimpan ke Google Drive Anda
// 4. Download file tersebut
// 5. Buka dengan QGIS atau text editor
// 6. Untuk setiap titik, zoom ke lokasinya di citra satelit lalu:
//    - Jika ada gedung/jalan/infrastruktur: ubah "class": -1 menjadi "class": 1
//    - Jika hutan/tanah kosong/air: ubah "class": -1 menjadi "class": 0
// 7. ✅ Properti "year" SUDAH OTOMATIS: 150 pertama = 2023, 150 terakhir = 2025
//    (tidak perlu diubah manual!)
// 8. Pastikan ada 75 titik class:0 dan 75 titik class:1 untuk SETIAP tahun
//    (total: 150 target/non-target per tahun)
// 9. Upload kembali ke GEE Assets dengan nama "IKN_GroundTruth"
// ==============================================================================

print("PENTING: Titik ini masih memiliki class = -1 (belum dilabeli)!");
print("Anda harus mengisi manual kolom 'class' dengan nilai 0 atau 1");
print("Lihat instruksi lengkap di komentar kode (baris 60-70)");
