// ==============================================================================
// FASE 1: DATA ACQUISITION & PREPROCESSING
// Proyek: IKN Built-Up Area Change Detection (2023/24 vs 2025)
// ==============================================================================

// 1. DEFINISI BATAS AREA STUDI (IKN)
// Batas administrasi IKN yang lebih detail (bukan kotak sederhana)
// OPSI A: Load dari Asset (jika sudah upload IKN_Boundary_Detailed.geojson):
var iknBoundary = ee.FeatureCollection('projects/gen-lang-client-0127135473/assets/Delineasi_IKN_250K').geometry();



Map.centerObject(iknBoundary, 11);
Map.addLayer(iknBoundary, {color: 'yellow', fillColor: 'transparent'}, 'Batas IKN Resmi', true);

// Print informasi boundary
print('=== IKN BOUNDARY INFO ===');
print('Area IKN (km²):', iknBoundary.area().divide(1e6).getInfo());

// 2. FUNGSI CLOUD MASKING (S2 QA60)
function maskS2clouds(image) {
  var qa = image.select('QA60');
  // Bit 10 = clouds, Bit 11 = cirrus
  var cloudBitMask = 1 << 10;
  var cirrusBitMask = 1 << 11;
  var mask = qa.bitwiseAnd(cloudBitMask).eq(0)
    .and(qa.bitwiseAnd(cirrusBitMask).eq(0));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ["system:time_start"]);
}

// 3. FUNGSI PERHITUNGAN INDEKS SPEKTRAL & FEATURE STACK
function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
  
  // BSI = ((SWIR1+Red)-(NIR+Blue)) / ((SWIR1+Red)+(NIR+Blue))
  var bsi = image.expression(
    '((SWIR1 + RED) - (NIR + BLUE)) / ((SWIR1 + RED) + (NIR + BLUE))', {
      'SWIR1': image.select('B11'),
      'RED': image.select('B4'),
      'NIR': image.select('B8'),
      'BLUE': image.select('B2')
  }).rename('BSI');

  // Pilih band utama yang dibutuhkan + 3 Index
  return image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
              .addBands([ndvi, ndbi, bsi]);
}

// 4. MENGAMBIL DAN MEMPROSES CITRA
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iknBoundary)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20))
  .map(maskS2clouds)
  .map(addIndices);

// Periode 1: 2023/2024
var composite2324 = s2.filterDate('2023-07-01', '2024-12-31')
  .median()
  .clip(iknBoundary);

// Periode 2: 2025
var composite25 = s2.filterDate('2025-01-01', '2025-12-31')
  .median()
  .clip(iknBoundary);

// 5. VISUALISASI DI MAP (RGB & False Color)
var visRGB = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3};
var visFalse = {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4}; // NIR, Red, Green (vegetasi merah)

Map.addLayer(composite2324, visRGB, 'RGB 2023/24', false);
Map.addLayer(composite25, visRGB, 'RGB 2025', false);
Map.addLayer(composite25, visFalse, 'False Color 2025', true);

// 6. EXPORT KE ASSETS (Opsional tapi disarankan agar lebih cepat saat training)
// Hapus komentar (//) di bawah ini untuk mengaktifkan export
/*
Export.image.toAsset({
  image: composite2324,
  description: 'IKN_Composite_2023_2024',
  assetId: 'IKN_Composite_2023_2024',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

Export.image.toAsset({
  image: composite25,
  description: 'IKN_Composite_2025',
  assetId: 'IKN_Composite_2025',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});
*/

print("Pre-processing selesai. Silakan lanjut digitasi Ground Truth!");
