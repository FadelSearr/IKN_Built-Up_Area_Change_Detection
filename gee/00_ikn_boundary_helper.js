// ==============================================================================
// HELPER: IKN BOUNDARY (DETAILED POLYGON)
// Paste fungsi ini di awal script GEE Anda untuk menggunakan batas IKN yang akurat
// ==============================================================================

// OPSI 1: Load dari GEE Asset (RECOMMENDED - setelah upload IKN_Boundary_Detailed.geojson)
// var iknBoundary = ee.FeatureCollection('users/YOUR_USERNAME/IKN_Boundary_Detailed')
//   .geometry();

// OPSI 2: Define langsung di kode (lebih praktis, tanpa upload)
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

print('IKN Boundary loaded');
print('Area (km²):', iknBoundary.area().divide(1e6).getInfo());
