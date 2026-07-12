// ==============================================================================
// FASE 3: MODEL TRAINING & CLASSIFICATION
// Random Forest untuk klasifikasi Built-up Area dan Vegetasi
// Split: 80% Training, 20% Testing | Fitur: NDVI & NDBI
// ==============================================================================

// 1. LOAD BATAS IKN
var iknBoundary = ee.FeatureCollection('projects/my-project-2026-488909/assets/Delineasi_IKN_250K').geometry();

Map.centerObject(iknBoundary, 11);

// 2. LOAD CITRA COMPOSITE (dari Phase 1)
// Jika sudah di-export ke Assets, gunakan ini:
var composite2324 = ee.Image('projects/my-project-2026-488909/assets/IKN_Composite_2023_2024');
var composite2526 = ee.Image('projects/my-project-2026-488909/assets/IKN_Composite_2025_2026');

// Jika belum di Assets, rebuild composite:
function maskS2clouds(image) {
  var scl = image.select('SCL');
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ["system:time_start"]);
}

function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
  return image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
              .addBands([ndvi, ndbi]);
}

var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iknBoundary)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
  .map(maskS2clouds)
  .map(addIndices);

// Periode 1: Jan 2023 - Jul 2024
var composite2324 = s2.filterDate('2023-01-01', '2024-07-31')
  .median()
  .clip(iknBoundary);

// Periode 2: Jan 2025 - Jul 2026
var composite2526 = s2.filterDate('2025-01-01', '2026-07-31')
  .median()
  .clip(iknBoundary);

// 3. LOAD GROUND TRUTH
var groundTruth = ee.FeatureCollection('projects/my-project-2026-488909/assets/IKN_GroundTruth_Composite_Based');
print('Jumlah Ground Truth Keseluruhan:', groundTruth.size());

// Cek Keseimbangan Kelas
var target2024 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2024), ee.Filter.eq('class', 1))).size();
var nonTarget2024 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2024), ee.Filter.eq('class', 0))).size();
var target2026 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2026), ee.Filter.eq('class', 1))).size();
var nonTarget2026 = groundTruth.filter(ee.Filter.and(ee.Filter.eq('year', 2026), ee.Filter.eq('class', 0))).size();

print('=== DISTRIBUSI KELAS ===');
print('Periode 2023-2024:');
print('  Class 1 (Built-up):', target2024);
print('  Class 0 (Vegetation):', nonTarget2024);
print('Periode 2025-2026:');
print('  Class 1 (Built-up):', target2026);
print('  Class 0 (Vegetation):', nonTarget2026);
print('========================');

// 4. SPLIT TRAINING/TESTING (80/20) dengan SEED TETAP
var withRandom = groundTruth.randomColumn({seed: 42, columnName: 'random'});
var trainingPoints = withRandom.filter(ee.Filter.lt('random', 0.8));
var testingPoints = withRandom.filter(ee.Filter.gte('random', 0.8));

print('=== DATA SPLIT (80:20) ===');
print('Training points (80%):', trainingPoints.size());
print('Testing points (20%):', testingPoints.size());
print('Seed: 42 (fixed untuk reproducibility)');
print('==========================');

// 5. SAMPLE FEATURE VALUES di titik training
// Fitur: Band spektral + NDVI + NDBI
var bands = ['B2', 'B3', 'B4', 'B8', 'B11', 'B12', 'NDVI', 'NDBI'];

// Untuk tahun 2023-2024
var training2324 = trainingPoints.filter(ee.Filter.eq('year', 2024));
var trainingData2324 = composite2324.select(bands).sampleRegions({
  collection: training2324,
  properties: ['class'],
  scale: 10,
  tileScale: 16
});

// Untuk tahun 2025-2026
var training2526 = trainingPoints.filter(ee.Filter.eq('year', 2026));
var trainingData2526 = composite2526.select(bands).sampleRegions({
  collection: training2526,
  properties: ['class'],
  scale: 10,
  tileScale: 16
});

// Gabungkan semua training data
var trainingData = trainingData2324.merge(trainingData2526);

print('Training samples extracted:', trainingData.size());

// 6. TRAIN RANDOM FOREST MODEL
var classifier = ee.Classifier.smileRandomForest({
  numberOfTrees: 100,
  seed: 42
}).train({
  features: trainingData,
  classProperty: 'class',
  inputProperties: bands
});

print('=== MODEL PARAMETERS ===');
print('Algorithm: Random Forest');
print('Number of Trees: 100');
print('Features: B2, B3, B4, B8, B11, B12, NDVI, NDBI');
print('Training samples:', trainingData.size());
print('========================');

// 7. KLASIFIKASI KEDUA PERIODE (SATU MODEL, DUA TAHUN)
var classified2324 = composite2324.select(bands).classify(classifier).rename('classification');
var classified2526 = composite2526.select(bands).classify(classifier).rename('classification');

// Visualisasi
var classVis = {min: 0, max: 1, palette: ['green', 'red']};
Map.addLayer(classified2324, classVis, 'Klasifikasi 2023-2024 (Merah=Built-up)', false);
Map.addLayer(classified2526, classVis, 'Klasifikasi 2025-2026 (Merah=Built-up)', true);

// 8. EXPORT HASIL KLASIFIKASI
Export.image.toAsset({
  image: classified2324.toByte(),
  description: 'IKN_Classified_2023_2024',
  assetId: 'IKN_Classified_2023_2024',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

Export.image.toAsset({
  image: classified2526.toByte(),
  description: 'IKN_Classified_2025_2026',
  assetId: 'IKN_Classified_2025_2026',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

print("==========================================");
print("Training selesai!");
print("Prinsip Fair Comparison:");
print("✓ Satu model yang sama untuk dua periode");
print("✓ Fitur identik (NDVI & NDBI)");
print("✓ Split 80:20 dengan seed tetap");
print("Klik 'Tasks' untuk export hasil klasifikasi");
print("==========================================");
