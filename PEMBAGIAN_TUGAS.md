# Pembagian Tugas Kelompok (5 Anggota)
## Studi Kasus: Deteksi Perubahan Area Terbangun IKN (2023/2024 vs 2025)

Dokumen ini merinci peran, tanggung jawab, dan output spesifik untuk masing-masing dari 5 anggota kelompok guna memastikan alur kerja terstruktur dan penilaian kontribusi yang adil.

---

## 👥 Matriks Peran dan Tanggung Jawab

| Peran / Anggota | Tanggung Jawab Utama | GEE / File Output Utama |
| :--- | :--- | :--- |
| **Anggota 1**: *Data Engineer* | Preprocessing & Sentinel-2 Composite | `gee/preprocessing.js` |
| **Anggota 2**: *GIS Digitizer* | Ground Truth Collection & Sampling | `gee/ground_truth.js` |
| **Anggota 3**: *ML Scientist* | Model Training, Tuning, & Prediction | `gee/random_forest.js` |
| **Anggota 4**: *Spatial Analyst* | Change Detection & Vectorization | `gee/change_analysis.js` & `data/*.geojson` |
| **Anggota 5**: *Web & Git Developer* | WebGIS Development & Project Management | `webgis/` & `README.md` |

---

## 🛠️ Rincian Detail Instruksi per Anggota

### 1️⃣ Anggota 1: Data Engineer (Preprocessing & Citra)
Bertanggung jawab menyiapkan data citra satelit Sentinel-2 yang bersih dan siap digunakan untuk pemrosesan lanjut.

*   **Tugas Utama**:
    *   Mendapatkan batas administrasi IKN (Ibu Kota Nusantara).
    *   Mengakses koleksi data `COPERNICUS/S2_SR_HARMONIZED` di Google Earth Engine.
    *   Melakukan filter tanggal yang setara: tahun 2023/2024 vs 2025 (misal: Juli–Desember 2023/24 vs Juli–Desember 2025).
    *   Menyusun algoritma *cloud masking* menggunakan bitmask band QA atau SCL (Scene Classification Layer) untuk membuang awan dan bayangannya.
    *   Membuat komposit median (*median composite*) untuk kedua tahun agar bebas awan.
    *   Memotong (*clip*) citra komposit sesuai batas administratif IKN.
    *   Menghitung indeks spektral tambahan (NDVI, NDBI, BSI) pada citra tahun 2023/2024 dan 2025, kemudian menggabungkannya ke dalam *feature stack* (`ee.Image.cat`).
*   **Deliverables**:
    *   Script GEE: [preprocessing.js](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/gee/preprocessing.js)
    *   Screenshot hasil komposit citra True Color (B4/B3/B2) dan False Color (B8/B4/B3) IKN sebelum dan sesudah *cloud masking*.

---

### 2️⃣ Anggota 2: GIS Digitizer (Ground Truth & Data Label)
Bertanggung jawab penuh atas kualitas dan kebenaran data sampel latih (*ground truth*) yang akan dipelajari oleh model Random Forest.

*   **Tugas Utama**:
    *   Membuat minimal **300 titik sampling** menggunakan tool digitasi di GEE.
    *   Membagi titik secara seimbang:
        *   Tahun 2023/2024: 75 titik target (Area Terbangun) dan 75 titik non-target (Hutan, Lahan Terbuka, Perairan).
        *   Tahun 2025: 75 titik target (Area Terbangun) dan 75 titik non-target (Hutan, Lahan Terbuka, Perairan).
    *   Memastikan sebaran titik merata di seluruh wilayah IKN (tidak hanya menumpuk di zona konstruksi inti).
    *   Memastikan label non-target (0) bervariasi secara proporsional.
    *   Memberikan atribut wajib pada setiap titik: `class` (0 atau 1) dan `year` (2023/2024 atau 2025).
    *   Memverifikasi kebenaran titik menggunakan citra resolusi tinggi (basemap satelit) di masing-masing tahun.
*   **Deliverables**:
    *   Script/Data GEE: [ground_truth.js](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/gee/ground_truth.js)
    *   Peta sebaran titik sampel di IKN dan tabel atribut ekspor dalam format CSV/Shapefile/Asset GEE.

---

### 3️⃣ Anggota 3: ML Scientist (Pemodelan & Prediksi)
Bertanggung jawab merancang model Random Forest, melatihnya, dan melakukan prediksi klasifikasi.

*   **Tugas Utama**:
    *   Membaca *feature stack* dari Anggota 1 dan *ground truth* dari Anggota 2.
    *   Menulis script pemisahan data otomatis (*train-test split*) dengan proporsi **70% training** dan **30% testing** per kombinasi kelas-tahun menggunakan kolom nilai acak (*random value*).
    *   Menentukan dan mencatat nilai **fixed seed** untuk pembagian acak agar hasil klasifikasi dapat direproduksi (*reproducible*).
    *   Melatih satu model Random Forest (`ee.Classifier.smileRandomForest`) dengan parameter **100 trees**.
    *   Mengaplikasikan model Random Forest tersebut untuk memprediksi citra IKN tahun 2023/2024 dan 2025.
    *   Melakukan ekspor hasil klasifikasi raster (0/1) untuk kedua tahun.
*   **Deliverables**:
    *   Script GEE: [random_forest.js](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/gee/random_forest.js)
    *   Raster klasifikasi IKN 2023/2024 dan 2025 dalam format GeoTIFF/Asset GEE.

---

### 4️⃣ Anggota 4: Spatial Analyst (Evaluasi & Deteksi Perubahan)
Bertanggung jawab menghitung performa statistik model dan menganalisis dinamika perubahan spasial area terbangun IKN.

*   **Tugas Utama**:
    *   Membuat confusion matrix 2x2 pada data testing (30%) di GEE.
    *   Menghitung metrik **Accuracy, Precision, Recall, dan F1-score** untuk kelas target (Area Terbangun).
    *   Melakukan analisis deteksi perubahan (*change detection*) dengan membandingkan klasifikasi 2023/2024 dan 2025 (Kategori: *Gain, Loss, Stable Target, Stable Non-Target*).
    *   Menghitung statistik luasan perubahan lahan (dalam hektare) dan persentase perubahan bersih (*net change*).
    *   Melakukan vektorisasi (*raster to vector*) hasil perubahan.
    *   Melakukan *noise filtering* (menghilangkan polygon yang terlalu kecil) dan *simplify geometry* untuk memperkecil ukuran file.
    *   Mengekspor polygon perubahan (*Gain* dan *Loss*) dalam format GeoJSON.
*   **Deliverables**:
    *   Script GEE: [change_analysis.js](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/gee/change_analysis.js)
    *   Tabel metrik evaluasi model (APRF) & File vektor [change_gain.geojson](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/data/change_gain.geojson) & [change_loss.geojson](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/data/change_loss.geojson).

---

### 5️⃣ Anggota 5: Web & Git Developer (WebGIS & Integrasi)
Bertanggung jawab atas penyajian produk akhir dalam WebGIS, manajemen kode di GitHub, dan penyusunan laporan akhir.

*   **Tugas Utama**:
    *   Membangun kerangka WebGIS interaktif menggunakan HTML, CSS, dan JavaScript (menggunakan pustaka Leaflet atau MapLibre).
    *   Mengintegrasikan GeoJSON batas kota dan hasil polygon perubahan (*Gain/Loss*) yang dibuat oleh Anggota 4 ke dalam peta interaktif.
    *   Menerapkan **sistem 4 tab** wajib:
        1.  *Peta Hasil*: Peta interaktif dengan layer control, legend, opacity slider, statistik luasan, dan popup.
        2.  *Data & Proses*: Diagram alur kerja, data Sentinel-2, ground truth, dan parameter model.
        3.  *Evaluasi Model*: Tabel confusion matrix dan skor APRF.
        4.  *Insight*: Pola spasial pertumbuhan IKN, analisis penyebab, dan rekomendasi tata ruang.
    *   Mengatur struktur repository GitHub publik kelompok, memandu anggota lain untuk push kode ke folder masing-masing, dan menulis dokumen `README.md`.
    *   Melakukan kompilasi laporan PDF akhir kelompok.
*   **Deliverables**:
    *   Folder WebGIS lengkap: [index.html](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/webgis/index.html), [style.css](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/webgis/style.css), [script.js](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/webgis/script.js)
    *   Dokumen [README.md](file:///C:/Kuliah/TUGAS%20KS/UAS%20KS/README.md) di repository dan link WebGIS aktif (GitHub Pages/Vercel).
