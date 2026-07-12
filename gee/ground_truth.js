
// 0. INISIALISASI

var iknBoundary = ee.FeatureCollection(
  'projects/my-project-2026-488909/assets/Delineasi_IKN_250K'
).geometry();

Map.centerObject(iknBoundary, 11);


// 1. BUILD COMPOSITE SENTINEL-2

function maskS2clouds(image) {
  var scl = image.select('SCL');
  // Hilangkan: shadow(3), cloud medium(8), cloud high(9), cirrus(10)
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ['system:time_start']);
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

// Periode 1: Januari 2023 – Juli 2024
var comp2324 = s2.filterDate('2023-01-01', '2024-07-31').median().clip(iknBoundary);

// Periode 2: Januari 2025 – Juli 2026
var comp2526 = s2.filterDate('2025-01-01', '2026-07-31').median().clip(iknBoundary);


// 2. DEFINISI MASK PER KELAS

// Fungsi pembuatan mask untuk setiap komposit
function buildMasks(comp) {
  var ndvi = comp.select('NDVI');
  var ndbi = comp.select('NDBI');

  // TARGET (1): Area Terbangun — NDBI tinggi DAN NDVI rendah
  var builtUp  = ndbi.gt(0.05).and(ndvi.lt(0.3));

  // NONTARGET (0) — BERAGAM (2 sub-kelas via NDVI & NDBI):
  // a. Vegetasi lebat : NDVI > 0.45
  var veg      = ndvi.gt(0.45);
  // b. Lahan terbuka / pertanian : NDVI 0.1-0.4 dan NDBI rendah
  var openLand = ndvi.gte(0.1).and(ndvi.lt(0.4)).and(ndbi.lt(0.0));

  return { builtUp: builtUp, veg: veg, openLand: openLand };
}

var mask2324 = buildMasks(comp2324);
var mask2526 = buildMasks(comp2526);


// 3. STRATIFIED SAMPLING — PERIODE 2023-2024 (label year=2024)

// Target (1): 100 titik built-up
var built2324 = mask2324.builtUp.selfMask().stratifiedSample({
  numPoints: 100, region: iknBoundary, scale: 30, seed: 42, geometries: true
}).map(function(f){ return f.set('class', 1, 'year', 2024); });

// NonTarget (0): 50 vegetasi + 50 lahan terbuka = 100 titik
var veg2324 = mask2324.veg.selfMask().stratifiedSample({
  numPoints: 50, region: iknBoundary, scale: 30, seed: 11, geometries: true
}).map(function(f){ return f.set('class', 0, 'year', 2024); });

var open2324 = mask2324.openLand.selfMask().stratifiedSample({
  numPoints: 50, region: iknBoundary, scale: 30, seed: 33, geometries: true
}).map(function(f){ return f.set('class', 0, 'year', 2024); });


// 4. STRATIFIED SAMPLING — PERIODE 2025-2026 (label year=2026)
// Target (1): 100 titik built-up
var built2526 = mask2526.builtUp.selfMask().stratifiedSample({
  numPoints: 100, region: iknBoundary, scale: 30, seed: 44, geometries: true
}).map(function(f){ return f.set('class', 1, 'year', 2026); });

// NonTarget (0): 50 vegetasi + 50 lahan terbuka = 100 titik
var veg2526 = mask2526.veg.selfMask().stratifiedSample({
  numPoints: 50, region: iknBoundary, scale: 30, seed: 55, geometries: true
}).map(function(f){ return f.set('class', 0, 'year', 2026); });

var open2526 = mask2526.openLand.selfMask().stratifiedSample({
  numPoints: 50, region: iknBoundary, scale: 30, seed: 77, geometries: true
}).map(function(f){ return f.set('class', 0, 'year', 2026); });


// 5. GABUNGKAN SEMUA GROUND TRUTH

var groundTruth = built2324
  .merge(veg2324).merge(open2324)
  .merge(built2526)
  .merge(veg2526).merge(open2526);


// 6. VERIFIKASI DI CONSOLE

print('================================================');
print('=== GROUND TRUTH SUMMARY ===');
print('Total titik:', groundTruth.size());
print('');
print('--- Periode 2023-2024 (year = 2024) ---');
print('  Class 1 (Built-up)         :', built2324.size());
print('  Class 0 (Vegetasi)         :', veg2324.size());
print('  Class 0 (Lahan Terbuka)    :', open2324.size());
print('');
print('--- Periode 2025-2026 (year = 2026) ---');
print('  Class 1 (Built-up)         :', built2526.size());
print('  Class 0 (Vegetasi)         :', veg2526.size());
print('  Class 0 (Lahan Terbuka)    :', open2526.size());
print('');
print('Target: 400 titik (200 per tahun)');
print('Fitur: NDVI (Vegetasi) & NDBI (Area Terbangun)');
print('Non-target BERAGAM: Vegetasi + Lahan Terbuka');
print('================================================');


// 7. VISUALISASI PADA PETA

// Tampilkan citra RGB kedua periode
Map.addLayer(comp2324, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB 2023-24 ✓', true);
Map.addLayer(comp2526, {bands:['B4','B3','B2'], min:0, max:0.3}, 'RGB 2025-26 ✓', false);

// Tampilkan sampel per kelas per tahun
Map.addLayer(built2324, {color:'FF0000'}, '1=Built-up 2024',  false);
Map.addLayer(veg2324,   {color:'00AA00'}, '0=Veg 2024',       false);
Map.addLayer(open2324,  {color:'FFA500'}, '0=Lahan Tbk 2024', false);

Map.addLayer(built2526, {color:'CC0000'}, '1=Built-up 2026',  false);
Map.addLayer(veg2526,   {color:'006600'}, '0=Veg 2026',       false);
Map.addLayer(open2526,  {color:'CC7700'}, '0=Lahan Tbk 2026', false);


// 8. EXPORT

// Export ke Asset GEE (untuk dipakai di FASE 3 - Training)
Export.table.toAsset({
  collection: groundTruth,
  description: 'IKN_GroundTruth_Composite_Based',
  assetId: 'IKN_GroundTruth_Composite_Based'
});


print("INSTRUKSI: Klik 'Tasks' lalu jalankan kedua task export.");

