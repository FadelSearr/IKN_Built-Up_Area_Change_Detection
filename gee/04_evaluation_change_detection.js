// ==============================================================================
// FASE 4: MODEL EVALUATION & CHANGE DETECTION
// Confusion Matrix, APRF Metrics, dan Deteksi Perubahan Spasial
// ==============================================================================

// 1. LOAD BATAS IKN
var iknBoundary = ee.FeatureCollection('projects/gen-lang-client-0127135473/assets/Delineasi_IKN_250K').geometry();

Map.centerObject(iknBoundary, 11);

// 2. LOAD HASIL KLASIFIKASI (dari Phase 3)
// GANTI dengan Asset Anda setelah export selesai:
// var classified2324 = ee.Image('users/YOUR_USERNAME/IKN_Classified_2023_2024');
// var classified25 = ee.Image('users/YOUR_USERNAME/IKN_Classified_2025');

// Jika belum di-export, rebuild dari script sebelumnya (lebih lambat)
// [Copy fungsi dan kode training dari 03_model_training.js jika diperlukan]

// Untuk demo, kita asumsikan sudah ada:
var classified2324 = ee.Image('IKN_Classified_2023_2024').clip(iknBoundary);
var classified25 = ee.Image('IKN_Classified_2025').clip(iknBoundary);

// 3. LOAD GROUND TRUTH & SPLIT DATA (sama seperti Phase 3)
// var groundTruth = ee.FeatureCollection('users/YOUR_USERNAME/IKN_GroundTruth');
var groundTruth = ee.FeatureCollection([]); // GANTI dengan data asli Anda

var withRandom = groundTruth.randomColumn({seed: 42, columnName: 'random'});
var testingPoints = withRandom.filter(ee.Filter.gte('random', 0.7));

print('Testing points:', testingPoints.size());

// 4. EVALUASI MODEL (CONFUSION MATRIX & APRF)
// Sample klasifikasi di lokasi testing points
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDBI', 'BSI'];

// Rebuild composite untuk sampling (atau load dari Asset)
function maskS2clouds(image) {
  var qa = image.select('QA60');
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000);
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

var composite25 = s2.filterDate('2025-01-01', '2025-12-31')
  .median()
  .clip(iknBoundary);

// Train classifier (simplified version - gunakan classifier dari script sebelumnya)
var trainingData = composite25.select(bands).sampleRegions({
  collection: withRandom.filter(ee.Filter.lt('random', 0.7)),
  properties: ['class'],
  scale: 10
});

var classifier = ee.Classifier.smileRandomForest({numberOfTrees: 100, seed: 42})
  .train({features: trainingData, classProperty: 'class', inputProperties: bands});

// Klasifikasi testing points
var testingData = composite25.select(bands).sampleRegions({
  collection: testingPoints,
  properties: ['class'],
  scale: 10
});

var validated = testingData.classify(classifier);

// Confusion Matrix
var confusionMatrix = validated.errorMatrix('class', 'classification');
print('=== CONFUSION MATRIX ===');
print(confusionMatrix);
print('Overall Accuracy:', confusionMatrix.accuracy());

// APRF Metrics
print('=== APRF METRICS ===');
print('Producers Accuracy (Recall):', confusionMatrix.producersAccuracy());
print('Consumers Accuracy (Precision):', confusionMatrix.consumersAccuracy());
print('F1-Score:', confusionMatrix.fscore());
print('Kappa:', confusionMatrix.kappa());

// 5. CHANGE DETECTION
var change = classified25.subtract(classified2324).rename('change');
// Hasil: -1 = Loss (1→0), 0 = Stable, 1 = Gain (0→1)

Map.addLayer(change, {min: -1, max: 1, palette: ['blue', 'white', 'red']}, 
  'Change Detection (Blue=Loss, Red=Gain)');

// 6. AREA CALCULATION (dalam hektar)
var pixelArea = ee.Image.pixelArea().divide(10000); // m² ke hektar

var area2324 = classified2324.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13
  });

var area25 = classified25.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13
  });

var areaGain = change.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13
  });

var areaLoss = change.eq(-1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13
  });

print('=== AREA STATISTICS (Hektar) ===');
print('Built-up Area 2023/24:', area2324.get('classification'));
print('Built-up Area 2025:', area25.get('classification'));
print('Gain (0→1):', areaGain.get('change'));
print('Loss (1→0):', areaLoss.get('change'));

// 7. VECTORIZATION (Gain & Loss polygons)
var gain = change.eq(1).selfMask();
var loss = change.eq(-1).selfMask();

var gainVectors = gain.reduceToVectors({
  geometry: iknBoundary,
  scale: 30, // Simplifikasi ke 30m untuk performa
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13
});

var lossVectors = loss.reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13
});

// Simplifikasi geometri (mengurangi vertex untuk WebGIS)
gainVectors = gainVectors.map(function(f) {
  return f.simplify({maxError: 30}); // 3 pixel tolerance
});

lossVectors = lossVectors.map(function(f) {
  return f.simplify({maxError: 30});
});

// Filter polygon kecil (<0.1 ha = noise)
gainVectors = gainVectors.filter(ee.Filter.gt('count', 10)); // ~10 pixels = 0.1 ha
lossVectors = lossVectors.filter(ee.Filter.gt('count', 10));

Map.addLayer(gainVectors, {color: 'green'}, 'Gain Polygons', false);
Map.addLayer(lossVectors, {color: 'red'}, 'Loss Polygons', false);

print('Jumlah Gain polygons:', gainVectors.size());
print('Jumlah Loss polygons:', lossVectors.size());

// 8. EXPORT KE GEOJSON (untuk WebGIS)
Export.table.toDrive({
  collection: gainVectors,
  description: 'IKN_Change_Gain',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: lossVectors,
  description: 'IKN_Change_Loss',
  fileFormat: 'GeoJSON'
});

// Export classified rasters sebagai GeoJSON juga (untuk layer 2023/24 & 2025)
var builtup2324 = classified2324.eq(1).selfMask().reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13
}).map(function(f) { return f.simplify({maxError: 30}); });

var builtup25 = classified25.eq(1).selfMask().reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13
}).map(function(f) { return f.simplify({maxError: 30}); });

Export.table.toDrive({
  collection: builtup2324,
  description: 'IKN_BuiltUp_2023_2024',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: builtup25,
  description: 'IKN_BuiltUp_2025',
  fileFormat: 'GeoJSON'
});

// Export IKN boundary
Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(iknBoundary)]),
  description: 'IKN_Boundary',
  fileFormat: 'GeoJSON'
});

print("==============================================");
print("Evaluasi selesai! Klik 'Tasks' untuk export:");
print("- IKN_Change_Gain.geojson");
print("- IKN_Change_Loss.geojson");
print("- IKN_BuiltUp_2023_2024.geojson");
print("- IKN_BuiltUp_2025.geojson");
print("- IKN_Boundary.geojson");
print("Download semua file ke folder 'data/' di repo Anda.");
print("==============================================");
