# Analisis Deteksi Perubahan Area Terbangun IKN (2023-2026)

Proyek ini bertujuan untuk mengidentifikasi dan menganalisis perubahan *Built-up Area* (Area Terbangun) di kawasan Ibu Kota Nusantara (IKN) dengan membandingkan data citra satelit Sentinel-2 pada dua periode: 2023-2024 dan 2026.

## Anggota Kelompok
(Isi dengan nama dan NIM anggota)
1. Anggota 1 (Data Acquisition)
2. Anggota 2 (Preprocessing)
3. Anggota 3 (Model Training)
4. Anggota 4 (Evaluation)
5. Anggota 5 (WebGIS & Documentation)

## Metodologi
- **Platform**: Google Earth Engine (GEE).
- **Dataset**: Citra Sentinel-2 Harmonized (Level-2A).
- **Indeks**: NDVI (Vegetasi) dan NDBI (Bangunan).
- **Klasifikasi**: Algoritma Random Forest (100 trees, Seed=42) dengan split data 80% Training dan 20% Testing secara otomatis.
- **Kelas**: `1` untuk Area Terbangun, `0` untuk Non-Terbangun (Vegetasi dan Lahan Terbuka).

## Struktur Folder
- `/gee/` - Berisi script Javascript untuk Google Earth Engine (Preprocessing, Ground Truth, Model Training, Change Analysis).
- `/webgis/` - Berisi HTML, CSS, JS untuk menampilkan peta interaktif.
- `/data/` - Tempat menyimpan file GeoJSON hasil ekspor GEE (Batas IKN, Gain, Loss) untuk dibaca oleh WebGIS.

## Cara Menjalankan WebGIS
1. Ekspor hasil analisis GEE ke format `.geojson` (atau Shapefile lalu konversi).
2. Simpan file `boundary.geojson`, `gain.geojson`, dan `loss.geojson` di dalam folder `/data/`.
3. Buka folder proyek ini menggunakan ekstensi **Live Server** di VSCode (atau web server lokal lainnya).
4. Akses file `/webgis/index.html` dari localhost.

## Tautan WebGIS (Live)
(Isi dengan link publik jika dihosting via GitHub Pages/Vercel)

## Laporan Lengkap
Laporan lengkap hasil analisis (PDF) dapat diunduh pada repositori ini di: `[link laporan akhir pdf]`.
