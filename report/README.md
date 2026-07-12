# Report Folder
Folder ini berisi laporan akhir dan slide presentasi.

## File yang Harus Dibuat:
- `Final_Report_IKN_BuiltUp_Change.pdf` - Laporan akhir (5-8 halaman)
- `Presentation_Slides.pdf` atau `.pptx` - Slide presentasi (10-12 slide)

## Struktur Laporan Akhir (5-8 halaman):

### 1. Introduction (0.5 halaman)
- Latar belakang pembangunan IKN
- Pentingnya monitoring area terbangun
- Tujuan penelitian

### 2. Study Area & Data (1 halaman)
- Deskripsi wilayah IKN
- Spesifikasi Sentinel-2 SR Harmonized
- Periode temporal (2023/2024 vs 2026)

### 3. Methodology (2 halaman)
- Preprocessing workflow (cloud masking, median composite)
- Ground truth collection (300+ points)
- Random Forest training (100 trees, 70/30 split, seed=42)
- Change detection algorithm (subtraction method)
- Vectorization dan simplifikasi geometri

### 4. Results (2 halaman)
- Classification accuracy (APRF metrics)
- Confusion matrix
- Peta klasifikasi (2023/24 & 2026)
- Peta change detection (Gain/Loss)
- Statistik area (tabel & grafik)

### 5. Discussion (1 halaman)
- Interpretasi perubahan area terbangun
- Pola spasial ekspansi
- Limitasi (resolusi 10m, cloud cover, temporal gap)
- Implikasi untuk perencanaan tata ruang

### 6. Conclusion (0.5 halaman)
- Ringkasan temuan utama
- Rekomendasi untuk monitoring berkelanjutan

### 7. References
- Dataset: Copernicus Sentinel-2
- Software: Google Earth Engine
- Libraries: Leaflet.js

### 8. Appendix (opsional)
- Kontribusi anggota tim
- Screenshot WebGIS

---

## Struktur Presentasi (10-12 slide, 10 menit):

1. **Title Slide** - Judul, nama tim, logo
2. **Background & Objectives** - Mengapa IKN penting?
3. **Study Area Map** - Lokasi IKN di Kalimantan
4. **Methodology Flowchart** - Diagram alur kerja
5. **Ground Truth Collection** - Foto contoh digitasi
6. **Model Training & Evaluation** - APRF metrics
7. **Classification Results 2023/24** - Peta
8. **Classification Results 2026** - Peta
9. **Change Detection Map** - Gain/Loss visualization
10. **Area Statistics** - Tabel/grafik perubahan
11. **WebGIS Demo** - Screenshot + link live
12. **Conclusions & Recommendations** - Temuan utama
13. **Q&A** - Terima kasih

---

**Tips:**
- Gunakan template presentasi yang profesional
- Pastikan semua gambar/peta berkualitas tinggi (min 300 DPI)
- Cantumkan sumber data pada setiap peta/grafik
- Export PDF untuk submission, tapi siapkan PPTX untuk presentasi live
