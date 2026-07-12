// ==============================================================================
// FASE 4: MODEL EVALUATION & CHANGE DETECTION
// Confusion Matrix, APRF Metrics, dan Analisis Perubahan Spasial
// ==============================================================================

// 1. LOAD BATAS IKN
var iknBoundary = ee.FeatureCollection('projects/my-project-2026-488909/assets/Delineasi_IKN_250K').geometry();

Map.centerObject(iknBoundary, 11);

// 2. LOAD HASIL KLASIFIKASI (dari Phase 3)
var classified2324 = ee.Image('projects/my-project-2026-488909/assets/IKN_Classified_2023_2024');
var classified2526 = ee.Image('projects/my-project-2026-488909/assets/IKN_Classified_2025_2026');

// 3. LOAD GROUND TRUTH & SPLIT DATA (20% untuk Testing)
var groundTruth = ee.FeatureCollection('projects/my-project-2026-488909/assets/IKN_GroundTruth_Composite_Based');

var withRandom = groundTruth.randomColumn({seed: 42, columnName: 'random'});
var testingPoints = withRandom.filter(ee.Filter.gte('random', 0.8)); // 20% testing

print('=== TESTING DATA (20%) ===');
print('Total testing points:', testingPoints.size());

// 4. EVALUASI MODEL - Sample di lokasi testing
var testingPoints2324 = testingPoints.filter(ee.Filter.eq('year', 2024));
var testingPoints2526 = testingPoints.filter(ee.Filter.eq('year', 2026));

// Sample klasifikasi di lokasi testing
var sample2324 = classified2324.sampleRegions({
  collection: testingPoints2324,
  properties: ['class'],
  scale: 10,
  tileScale: 8
});

var sample2526 = classified2526.sampleRegions({
  collection: testingPoints2526,
  properties: ['class'],
  scale: 10,
  tileScale: 8
});

// Gabungkan testing samples
var allTestingSamples = sample2324.merge(sample2526);

print('Testing samples evaluated:', allTestingSamples.size());

// 5. CONFUSION MATRIX & METRICS
var confusionMatrix = allTestingSamples.errorMatrix('class', 'classification');

print('=================================');
print('=== CONFUSION MATRIX (2x2) ===');
print(confusionMatrix);
print('=================================');

// APRF Metrics
var accuracy = confusionMatrix.accuracy();
var kappa = confusionMatrix.kappa();
var producersAcc = confusionMatrix.producersAccuracy();
var consumersAcc = confusionMatrix.consumersAccuracy();
var fscore = confusionMatrix.fscore();

print('=== APRF METRICS ===');
print('Overall Accuracy:', accuracy);
print('Kappa Coefficient:', kappa);
print('---');
print('Class 0 (Vegetation):');
print('  Producers Accuracy (Recall):', producersAcc.get([0, 0]));
print('  Consumers Accuracy (Precision):', consumersAcc.get([0, 0]));
print('  F1-Score:', fscore.get([0]));
print('---');
print('Class 1 (Built-up):');
print('  Producers Accuracy (Recall):', producersAcc.get([1, 0]));
print('  Consumers Accuracy (Precision):', consumersAcc.get([0, 1]));
print('  F1-Score:', fscore.get([1]));
print('====================');

// 6. VISUALISASI KLASIFIKASI
Map.addLayer(classified2324, {min: 0, max: 1, palette: ['green', 'red']},
  'Klasifikasi 2023-2024 (Hijau=Veg, Merah=Built-up)');
Map.addLayer(classified2526, {min: 0, max: 1, palette: ['green', 'red']},
  'Klasifikasi 2025-2026 (Hijau=Veg, Merah=Built-up)');

// 7. CHANGE DETECTION
var change = classified2526.subtract(classified2324).rename('change');
// Hasil: -1 = Loss (Built-up→Veg), 0 = Stable, 1 = Gain (Veg→Built-up)

Map.addLayer(change, {min: -1, max: 1, palette: ['blue', 'gray', 'red']},
  'Change Detection (Merah=Gain, Biru=Loss)');

// 8. AREA CALCULATION (dalam hektar)
var pixelArea = ee.Image.pixelArea().divide(10000); // m² ke hektar

var area2324 = classified2324.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var area2526 = classified2526.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var areaGain = change.eq(1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

var areaLoss = change.eq(-1).multiply(pixelArea)
  .reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: iknBoundary,
    scale: 10,
    maxPixels: 1e13,
    tileScale: 8
  });

print('=== AREA STATISTICS (Hektar) ===');
print('Built-up Area 2023-2024:', area2324.get('classification'));
print('Built-up Area 2025-2026:', area2526.get('classification'));
print('Gain (Vegetasi→Built-up):', areaGain.get('change'));
print('Loss (Built-up→Vegetasi):', areaLoss.get('change'));
print('=================================');

// 9. VECTORIZATION (Gain & Loss polygons)
var gain = change.eq(1).selfMask();
var loss = change.eq(-1).selfMask();

var gainVectors = gain.reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13,
  tileScale: 8
});

var lossVectors = loss.reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  eightConnected: false,
  maxPixels: 1e13,
  tileScale: 8
});

// Simplifikasi & filter polygon kecil
gainVectors = gainVectors.map(function(f) {
  return f.simplify({maxError: 30});
}).filter(ee.Filter.gt('count', 10));

lossVectors = lossVectors.map(function(f) {
  return f.simplify({maxError: 30});
}).filter(ee.Filter.gt('count', 10));

Map.addLayer(gainVectors, {color: 'red'}, 'Gain Polygons (Ekspansi Built-up)', false);
Map.addLayer(lossVectors, {color: 'blue'}, 'Loss Polygons (Revegetasi)', false);

print('Jumlah Gain polygons:', gainVectors.size());
print('Jumlah Loss polygons:', lossVectors.size());

// 10. VECTORIZE CLASSIFIED RESULTS
var builtup2324 = classified2324.eq(1).selfMask().reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13,
  tileScale: 8
}).map(function(f) { return f.simplify({maxError: 30}); });

var builtup2526 = classified2526.eq(1).selfMask().reduceToVectors({
  geometry: iknBoundary,
  scale: 30,
  geometryType: 'polygon',
  maxPixels: 1e13,
  tileScale: 8
}).map(function(f) { return f.simplify({maxError: 30}); });

// 11. EXPORT KE GEOJSON (untuk WebGIS)
Export.table.toDrive({
  collection: gainVectors,
  description: 'change_gain',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: lossVectors,
  description: 'change_loss',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: builtup2324,
  description: 'building_2024',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: builtup2526,
  description: 'building_2026',
  fileFormat: 'GeoJSON'
});

Export.table.toDrive({
  collection: ee.FeatureCollection([ee.Feature(iknBoundary)]),
  description: 'boundary_kota',
  fileFormat: 'GeoJSON'
});

print("================================================");
print("Evaluasi & Change Detection selesai!");
print("Klik 'Tasks' untuk export ke Google Drive:");
print("1. change_gain.geojson");
print("2. change_loss.geojson");
print("3. building_2024.geojson");
print("4. building_2026.geojson");
print("5. boundary_kota.geojson");
print("Download semua file ke folder 'data/' di repo");
print("================================================");
