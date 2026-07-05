# CARA MENGGUNAKAN BATAS IKN RESMI DI GOOGLE EARTH ENGINE

## File yang Sudah Dibuat:
✅ `data/IKN_Boundary_Official.geojson` (1.08 MB) - Batas IKN resmi dari shapefile

## Langkah-Langkah Upload ke GEE:

### Opsi 1: Upload via GEE Code Editor (RECOMMENDED)

1. **Buka Google Earth Engine**: https://code.earthengine.google.com/
2. Klik tab **Assets** (panel kiri)
3. Klik tombol **NEW** → **Table Upload**
4. **Select File**: Browse ke `data/IKN_Boundary_Official.geojson`
5. **Asset Name**: Isi dengan `IKN_Boundary_Official`
6. Klik **Upload**
7. Tunggu proses upload selesai (~1-2 menit)

### Opsi 2: Gunakan Boundary yang Sudah Saya Buat (Lebih Cepat)

Jika tidak mau upload file besar, gunakan polygon 17-titik yang sudah ada di script (sudah cukup akurat untuk analisis Sentinel-2 10m).

## Cara Menggunakan di Script GEE:

Setelah upload selesai, ganti baris pertama di semua script GEE:

**Script Lama:**
```javascript
var iknBoundary = ee.Geometry.Polygon([...]);
```

**Script Baru:**
```javascript
// Load dari Asset (ganti 'users/USERNAME' dengan username GEE Anda)
var iknBoundary = ee.FeatureCollection('users/YOUR_USERNAME/IKN_Boundary_Official')
  .geometry();

Map.addLayer(iknBoundary, {color: 'yellow'}, 'Batas IKN Resmi');
print('Area IKN (km²):', iknBoundary.area().divide(1e6).getInfo());
```

## Catatan Penting:

- **Ukuran File**: 1.08 MB (sangat detail)
- **Area IKN**: ~2,561 km² (sesuai data resmi)
- **CRS**: File akan otomatis diproyeksikan ke WGS84 oleh GEE
- **Performa**: Batas resmi lebih lambat diproses, tapi lebih akurat

## Pilihan Anda:

1. **Untuk Akurasi Maksimal**: Upload `IKN_Boundary_Official.geojson` ke GEE Assets
2. **Untuk Kecepatan**: Gunakan polygon 17-titik yang sudah ada di script (perbedaan area <5%)

Rekomendasi saya: **Gunakan polygon 17-titik** yang sudah ada, karena:
- Cukup akurat untuk Sentinel-2 10m
- Tidak perlu upload file besar
- Script lebih cepat dijalankan
- Hasil akhir hampir identik
