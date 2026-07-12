// ==============================================================================
// HELPER: IKN BOUNDARY (DETAILED POLYGON)
// Paste fungsi ini di awal script GEE Anda untuk menggunakan batas IKN yang akurat
// ==============================================================================

// Load dari GEE Asset (RECOMMENDED - setelah upload IKN_Boundary_Detailed.geojson)
var iknBoundary = ee.FeatureCollection('projects/my-project-2026-488909/assets/Delineasi_IKN_250K')
 .geometry();


print('IKN Boundary loaded');
print('Area (km²):', iknBoundary.area().divide(1e6).getInfo());
