// 1. DEFINISI BATAS AREA STUDI (IKN)
var iknBoundary = ee.FeatureCollection('projects/my-project-2026-488909/assets/Delineasi_IKN_250K').geometry();

Map.centerObject(iknBoundary, 11);
Map.addLayer(iknBoundary, {color: 'yellow', fillColor: 'transparent'}, 'Batas IKN Resmi', true);

// Print informasi boundary
print('=== IKN BOUNDARY INFO ===');
print('Area IKN (km²):', iknBoundary.area().divide(1e6).getInfo());

// 2. FUNGSI CLOUD MASKING MENGGUNAKAN SCL (Scene Classification)
function maskS2clouds(image) {
  var scl = image.select('SCL');
  // SCL: 3=Cloud Shadows, 8=Cloud Medium Prob, 9=Cloud High Prob, 10=Cirrus
  var mask = scl.neq(3).and(scl.neq(8)).and(scl.neq(9)).and(scl.neq(10));
  return image.updateMask(mask).divide(10000)
    .copyProperties(image, ["system:time_start"]);
}

// 3. FUNGSI PERHITUNGAN INDEKS SPEKTRAL
// Fokus: NDVI (Vegetasi) dan NDBI (Area Terbangun)
function addIndices(image) {
  var ndvi = image.normalizedDifference(['B8', 'B4']).rename('NDVI');
  var ndbi = image.normalizedDifference(['B11', 'B8']).rename('NDBI');
  
  // Pilih band utama + 2 indeks (NDVI & NDBI)
  return image.select(['B2', 'B3', 'B4', 'B8', 'B11', 'B12'])
              .addBands([ndvi, ndbi]);
}

// 4. MENGAMBIL DAN MEMPROSES CITRA
var s2 = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
  .filterBounds(iknBoundary)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 60))
  .map(maskS2clouds)
  .map(addIndices);

// Periode 1: Januari 2023 - Juli 2024
var composite2324 = s2.filterDate('2023-01-01', '2024-07-31')
  .median()
  .clip(iknBoundary);

// Periode 2: Januari 2025 - Juli 2026
var composite2526 = s2.filterDate('2025-01-01', '2026-07-31')
  .median()
  .clip(iknBoundary);

// 5. VISUALISASI DI MAP
var visRGB = {bands: ['B4', 'B3', 'B2'], min: 0, max: 0.3};
var visFalse = {bands: ['B8', 'B4', 'B3'], min: 0, max: 0.4}; // NIR, Red, Green (vegetasi merah)

Map.addLayer(composite2324, visRGB, 'RGB 2023-2024', false);
Map.addLayer(composite2526, visRGB, 'RGB 2025-2026', false);
Map.addLayer(composite2526, visFalse, 'False Color 2025-2026', true);

// Visualisasi Indeks
var ndviVis = {min: -0.2, max: 0.8, palette: ['brown', 'yellow', 'green', 'darkgreen']};
var ndbiVis = {min: -0.5, max: 0.5, palette: ['green', 'white', 'red']};

Map.addLayer(composite2324.select('NDVI'), ndviVis, 'NDVI 2023-2024', false);
Map.addLayer(composite2324.select('NDBI'), ndbiVis, 'NDBI 2023-2024', false);
Map.addLayer(composite2526.select('NDVI'), ndviVis, 'NDVI 2025-2026', false);
Map.addLayer(composite2526.select('NDBI'), ndbiVis, 'NDBI 2025-2026', false);

// 6. EXPORT KE ASSETS 
Export.image.toAsset({
  image: composite2324,
  description: 'IKN_Composite_2023_2024',
  assetId: 'IKN_Composite_2023_2024',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

Export.image.toAsset({
  image: composite2526,
  description: 'IKN_Composite_2025_2026',
  assetId: 'IKN_Composite_2025_2026',
  scale: 10,
  region: iknBoundary,
  maxPixels: 1e13
});

print("======================================");
print("Pre-processing selesai!");
print("Periode 1: Januari 2023 - Juli 2024");
print("Periode 2: Januari 2025 - Juli 2026");
print("Fitur: NDVI (Vegetasi) & NDBI (Area Terbangun)");
print("Klik 'Tasks' untuk export ke Assets");
print("======================================");
