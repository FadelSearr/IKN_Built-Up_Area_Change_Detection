// ==============================================================================
// GROUND TRUTH LABELING ASSISTANT
// Script untuk membantu labeling 300 titik ground truth secara manual
// ==============================================================================

// INSTRUKSI PENGGUNAAN:
// 1. Upload "IKN_GroundTruth_Template (1).geojson" ke GEE Assets terlebih dahulu
// 2. Ganti 'YOUR_USERNAME' di baris 13 dengan username GEE Anda
// 3. Run script ini
// 4. Klik pada setiap titik merah untuk melihat detailnya
// 5. Bandingkan citra 2023 vs 2025 untuk menentukan class

// LOAD BATAS IKN
var iknBoundary = ee.FeatureCollection('projects/gen-lang-client-0127135473/assets/Delineasi_IKN_250K').geometry();

// LOAD GROUND TRUTH POINTS (GANTI PATH INI!)
var groundTruth = ee.FeatureCollection('users/YOUR_USERNAME/IKN_GroundTruth_Template');

// FUNGSI CLOUD MASKING
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
}

// LOAD CITRA SENTINEL-2
var s2_2023 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(iknBoundary)
  .filterDate('2023-01-01', '2023-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .median()
  .clip(iknBoundary);

var s2_2025 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(iknBoundary)
  .filterDate('2025-01-01', '2025-12-31')
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .median()
  .clip(iknBoundary);

// VISUALISASI PARAMETER
var rgbVis = {
  bands: ['B4', 'B3', 'B2'],
  min: 0.0,
  max: 0.3,
  gamma: 1.4
};

// SETUP MAP
Map.centerObject(iknBoundary, 11);

// ADD LAYERS
Map.addLayer(iknBoundary, {color: 'yellow', fillColor: 'transparent'}, 'Batas IKN', true);
Map.addLayer(s2_2023, rgbVis, 'Sentinel-2 2023 (RGB)', false);
Map.addLayer(s2_2025, rgbVis, 'Sentinel-2 2025 (RGB)', true);

// VISUALISASI GROUND TRUTH POINTS
// Pisahkan berdasarkan tahun untuk memudahkan
var points2023 = groundTruth.filter(ee.Filter.eq('year', 2023));
var points2025 = groundTruth.filter(ee.Filter.eq('year', 2025));

Map.addLayer(points2023, {color: 'red'}, '150 Titik 2023', true);
Map.addLayer(points2025, {color: 'blue'}, '150 Titik 2025', true);

// PRINT INFO
print('=== GROUND TRUTH LABELING INFO ===');
print('Total Points:', groundTruth.size());
print('Points 2023:', points2023.size());
print('Points 2025:', points2025.size());
print('');
print('CARA LABELING:');
print('1. Nyalakan layer "Sentinel-2 2023" atau "Sentinel-2 2025"');
print('2. Klik titik MERAH (2023) atau BIRU (2025)');
print('3. Lihat console untuk koordinat dan ID');
print('4. Tentukan:');
print('   - Class 0 = Non-built (hutan, tanah, vegetasi, air)');
print('   - Class 1 = Built-up (gedung, jalan, konstruksi)');
print('5. Catat ID dan class di spreadsheet/file');
print('');
print('TIPS:');
print('- Gunakan zoom 15-18 untuk detail yang baik');
print('- Bandingkan RGB dan False Color untuk akurasi');
print('- Fokus pada perubahan signifikan antara 2023-2025');

// FUNGSI CLICK HANDLER
// Ketika user klik pada peta, tampilkan info titik terdekat
Map.onClick(function(coords) {
  var point = ee.Geometry.Point([coords.lon, coords.lat]);
  
  // Cari titik terdekat dalam radius 100m
  var nearest = groundTruth.filterBounds(point.buffer(100)).first();
  
  nearest.evaluate(function(feature) {
    if (feature) {
      print('');
      print('=== TITIK TERDEKAT ===');
      print('ID:', feature.properties.id);
      print('Year:', feature.properties.year);
      print('Current Class:', feature.properties.class);
      print('Coordinates:', feature.geometry.coordinates);
      print('');
      print('Isi class dengan:');
      print('  0 = Non-built-up (hutan/vegetasi/tanah)');
      print('  1 = Built-up (gedung/jalan/konstruksi)');
    }
  });
});

// LAYER TAMBAHAN: False Color untuk identifikasi vegetasi
var falseColorVis = {
  bands: ['B8', 'B4', 'B3'],
  min: 0.0,
  max: 0.3,
  gamma: 1.4
};

Map.addLayer(s2_2023, falseColorVis, 'S2 2023 (False Color)', false);
Map.addLayer(s2_2025, falseColorVis, 'S2 2025 (False Color)', false);

// EXPORT INSTRUCTIONS
print('');
print('=== SETELAH LABELING SELESAI ===');
print('1. Edit file GeoJSON lokal atau di QGIS');
print('2. Atau buat FeatureCollection baru dengan class yang sudah dilabeli');
print('3. Upload kembali ke GEE Assets sebagai "IKN_GroundTruth_Labeled"');
