// ==============================================================================
// FASE 3: MODEL TRAINING & CLASSIFICATION
// Random Forest untuk klasifikasi area terbangun (2023/24 vs 2025)
// ==============================================================================

// 1. LOAD BATAS IKN
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

// 2. LOAD CITRA COMPOSITE (dari Phase 1)
// Jika sudah di-export ke Assets, gunakan ini:
// var composite2324 = ee.Image('users/YOUR_USERNAME/IKN_Composite_2023_2024');
// var composite25 = ee.Image('users/YOUR_USERNAME/IKN_Composite_2025');

// Jika belum di Assets, rebuild composite (lebih lama):
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ["system:time_start"]);
}

function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
  var bsi = image.expression(
    '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))', {
      'SWIR1': image.select('B11'),
      'RED': image.select('B4'),
      'NIR': image.select('B8'),
      'BLUE': image.select('B2')
  }).rename('BSI');
  return image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
              .addBands([ndvi, ndbi, bsi]);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iknBoundary)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .map(addIndices);

var composite2324 = s2.filterDate('2023-07-01', '2024-12-31')
  .median()
  .clip(iknBoundary);

var composite25 = s2.filterDate('2025-01-01', '2025-12-31')
  .median()
  .clip(iknBoundary);

// 3. LOAD GROUND TRUTH
// GANTI PATH INI dengan lokasi Asset Anda setelah upload ground truth yang sudah dilabeli
// var groundTruth = ee.FeatureCollection('users/YOUR_USERNAME/IKN_GroundTruth');

// Contoh dummy ground truth (HAPUS BARIS INI saat sudah punya data asli):
var groundTruth = ee.FeatureCollection([
  ee.Feature(ee.Geometry.Point([116.7, -0.85]), {class: 1, year: 2025}),
  ee.Feature(ee.Geometry.Point([116.8, -0.90]), {class: 0, year: 2025})
  // ... tambahkan 298 titik lainnya
]);

print('Jumlah Ground Truth:', groundTruth.size());

// 4. SPLIT TRAINING/TESTING (70/30) dengan SEED TETAP
var withRandom = groundTruth.randomColumn({seed: 42, columnName: 'random'});
var trainingPoints = withRandom.filter(ee.Filter.lt('random', 0.7));
var testingPoints = withRandom.filter(ee.Filter.gte('random', 0.7));

print('Training points:', trainingPoints.size());
print('Testing points:', testingPoints.size());

// 5. SAMPLE FEATURE VALUES di titik training
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDBI', 'BSI'];

// Untuk tahun 2023/2024
var training2324 = trainingPoints.filter(ee.Filter.lte('year', 2024));
var trainingData2324 = composite2324.select(bands).sampleRegions({
  collection: training2324,
  properties: ['class'],
  scale: 10
});

// Untuk tahun 2025
var training25 = trainingPoints.filter(ee.Filter.eq('year', 2025));
var trainingData25 = composite25.select(bands).sampleRegions({
  collection: training25,
  properties: ['class'],
  scale: 10
});

// Gabungkan semua training data
var trainingData = trainingData2324.merge(trainingData25);

// 6. TRAIN RANDOM FOREST MODEL
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  seed: 42
}).train({
  features: trainingData,
  classProperty: 'class',
  inputProperties: bands
});

print('Model Random Forest telah dilatih dengan', trainingData.size(), 'sampel');

// 7. KLASIFIKASI KEDUA PERIODE
var classified2324 = composite2324.select(bands).classify(classifier);
var classified25 = composite25.select(bands).classify(classifier);

// Visualisasi
var classVis = {min: 0, max: 1, palette: ['green', 'red']};
Map.addLayer(classified2324, classVis, 'Klasifikasi 2023/24', false);
Map.addLayer(classified25, classVis, 'Klasifikasi 2025', true);

// 8. EXPORT HASIL KLASIFIKASI (untuk Change Detection di script berikutnya)
Export.image.toAsset({
  image: classified2324.toInt8(),
  description: 'IKN_Classified_2023_2024',
  assetId: 'IKN_Classified_2023_2024',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

Export.image.toAsset({
  image: classified25.toInt8(),
  description: 'IKN_Classified_2025',
  assetId: 'IKN_Classified_2025',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

print("Training selesai! Klik 'Tasks' untuk export hasil klasifikasi.");
print("Lanjut ke script 04_evaluation_change_detection.js setelah export selesai.");
