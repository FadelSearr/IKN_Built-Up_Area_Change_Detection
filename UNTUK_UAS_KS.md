# Panduan Proyek Akhir UAS: Maha Data & Kapita Selekta GIS
## Klasifikasi Objek Permukaan Bumi Menggunakan Sentinel-2 dan Random Forest

Proyek akhir ini merupakan kolaborasi dan integrasi kompetensi dari dua mata kuliah:
*   **Kapita Selekta GIS**: Menyiapkan konteks spasial, mengakses Sentinel-2, memahami raster dan band, serta menyajikan hasil akhir dalam bentuk WebGIS interaktif.
*   **Maha Data**: Membangun, melatih, mengevaluasi, dan menguji model machine learning (GeoAI - Random Forest), membandingkan label aktual vs prediksi, serta menghitung metrik evaluasi model (APRF).

---

## 🎯 Konsep Utama Proyek

Tugas kelompok ini bertujuan untuk menjawab pertanyaan: 
> **"Apakah objek target di kota terpilih mengalami peningkatan (gain) atau penyusutan (loss) antara tahun 2024 dan 2025?"**

### Prinsip Utama Perbandingan Adil (Fair Comparison)
*   **Satu Model untuk Dua Tahun**: Model Random Forest yang dilatih harus sama untuk mengklasifikasikan citra tahun 2024 dan 2025. Jika menggunakan model yang berbeda untuk tiap tahun, perbedaan hasil klasifikasi bisa disebabkan oleh perbedaan model/kesalahan klasifikasi, bukan perubahan nyata di lapangan.
*   **Struktur Fitur Konsisten**: Band spektral dan indeks spektral yang digunakan sebagai input fitur pada tahun 2024 dan 2025 harus persis sama.

---

## 🛠️ Alur Kerja Lengkap (9 Langkah)

Berikut adalah detail 9 langkah wajib yang harus dilakukan:

### 📋 Detail Setiap Langkah

#### 1️⃣ LANGKAH 1: Tentukan yang Dicari dan Di Mana Mencarinya
Pilih satu wilayah administratif setingkat kota/kabupaten di negara mana pun dan tentukan satu objek target spesifik yang ingin dipetakan.

*   **Ketentuan Wilayah**:
    *   Batas administrasi harus jelas.
    *   Data Sentinel-2 memadai (minim awan).
    *   Tidak boleh sama dengan kelompok lain.
    *   Luas wilayah harus realistis untuk diproses dan ditampilkan (setingkat City, Municipality, Urban District, Commune, atau Kota).
*   **Ketentuan Objek Target**:
    *   *Pilihan Standar*: Vegetasi, Perairan, Area Terbangun, atau Lahan Terbuka.
    *   *Catatan Area Terbangun*: Menolak deteksi bangunan individual; harus berupa kawasan (permukiman, industri, pusat kota, dll.).
    *   *Pilihan Khusus (Butuh Persetujuan Dosen)*: Mangrove, sawah, tambak, hutan kota, perkebunan. Harus dipastikan objek cukup besar untuk dideteksi resolusi Sentinel-2, dapat dibedakan, tersedia pada kedua tahun, dan memiliki karakteristik spektral yang jelas.
*   **Pertanyaan Analisis yang Harus Dijawab**:
    1.  Kota mana yang dipilih?
    2.  Apa objek targetnya?
    3.  Mengapa objek tersebut penting?
    4.  Mengapa perubahan 2024–2025 di wilayah tersebut perlu dianalisis?
    5.  Siapa yang dapat menggunakan hasil analisis ini?
*   **Contoh Rumusan Masalah**:
    > "Bagaimana perubahan luas vegetasi di Kota Bekasi antara tahun 2024 dan 2025 berdasarkan hasil klasifikasi Random Forest?"
*   **Output Langkah 1**: Nama kota, negara, batas administrasi, objek target, pertanyaan analisis, dan alasan pemilihan. (Bukti: Deskripsi wilayah studi).

#### 2️⃣ LANGKAH 2: Ambil Sentinel-2 Tahun 2024 dan 2025
Dapatkan data citra satelit Sentinel-2 yang representatif dan adil untuk dibandingkan pada kedua tahun studi.

*   **Sumber Data**: Sentinel-2 Surface Reflectance Harmonized (Koleksi GEE: `COPERNICUS/S2_SR_HARMONIZED`).
*   **Ketentuan Periode**: Periode waktu komposit pada kedua tahun harus setara/adil untuk menghindari bias musiman.
    *   *Benar (Setara)*: Januari–Desember 2024 vs. Januari–Desember 2025 atau Juni–September 2024 vs. Juni–September 2025.
    *   *Salah (Tidak Adil)*: Januari–Maret 2024 vs. Juli–Desember 2025.
*   **Proses Preprocessing**:
    1.  Filter berdasarkan batas administrasi kota.
    2.  Filter rentang tanggal sesuai ketentuan.
    3.  Filter awan (maksimum persentase awan yang ditentukan).
    4.  Lakukan *cloud masking* (menghilangkan awan dan bayangannya menggunakan band QA/SCL atau Cloud Probability).
    5.  Lakukan komposit median (*median composite*) untuk menghasilkan citra bebas awan.
    6.  Potong (*clip*) citra komposit sesuai batas kota.
*   **Metadata yang Wajib Dicatat**: Nama koleksi data, rentang tanggal 2024 & 2025, metode *cloud masking*, batas maks awan (%), metode komposit, resolusi analisis, dan sumber batas kota.
*   **Output Langkah 2**: Satu komposit bebas awan tahun 2024 dan satu komposit tahun 2025 yang dipotong ke wilayah kota. (Bukti: Screenshot koleksi citra).

#### 3️⃣ LANGKAH 3: Pilih Band dan Indeks Spektral
Pilih kombinasi band spektral asli dan indeks spektral tambahan yang relevan sebagai fitur masukan (*feature stack*) untuk model Random Forest.

*   **Band Dasar Sentinel-2**: B2 (Blue), B3 (Green), B4 (Red), B8 (NIR), B11 (SWIR 1), B12 (SWIR 2). Band red-edge dapat ditambahkan jika relevan dengan objek target (misal: mangrove).
*   **Rekomendasi Indeks Spektral**:
    *   *Vegetasi*: NDVI, NDMI
    *   *Perairan*: NDWI, MNDWI
    *   *Area Terbangun*: NDBI, BSI, NDVI
    *   *Lahan Terbuka*: BSI, NDBI, NDVI
    *   *Mangrove*: NDVI, NDMI, MNDWI, indeks mangrove khusus.
*   **Ketentuan**: Struktur fitur (urutan, jenis band, dan indeks) pada tahun 2024 dan 2025 harus identik dan menggunakan nama yang konsisten.
*   **Output Langkah 3**: Satu `ee.Image` multiband (feature stack) untuk tahun 2024 dan satu untuk 2025 yang berisi band asli + indeks spektral pilihan. (Bukti: Daftar band & indeks yang digunakan).

#### 4️⃣ LANGKAH 4: Buat Ground Truth Dua Tahun (2024 & 2025)
Buat titik sampel atau data berlabel sebagai bahan pelatihan dan pengujian model.

*   **Ketentuan Minimum & Distribusi**:
    *   Minimal **300 titik observasi** secara keseluruhan.
    *   Distribusi kelas harus seimbang (dua kelas):
        *   **Kelas 1**: Objek Target (Positif)
        *   **Kelas 0**: Bukan Objek Target (Negatif)
    *   *Rekomendasi*: 400 titik observasi berkualitas tinggi untuk hasil lebih optimal.

| Tahun | Kelas 1 (Target) | Kelas 0 (Non-Target) | Total Titik |
| :--- | :---: | :---: | :---: |
| **2024** | 75 | 75 | 150 |
| **2025** | 75 | 75 | 150 |
| **TOTAL** | **150** | **150** | **300** |

*   **Aturan Pengambilan Titik**:
    *   Sebaran titik harus merata di seluruh wilayah kota (mewakili pusat kota, pinggiran, dan berbagai kondisi topografi/lahan).
    *   Titik tidak boleh bertumpuk (*overlapping*) or berdekatan terlalu rapat.
    *   Kelas non-target (0) harus bervariasi. Jika objek target adalah vegetasi, maka non-target harus terdiri dari gabungan perairan, area terbangun, dan lahan terbuka (jangan hanya satu jenis objek).
    *   Satu lokasi fisik yang sama bisa memiliki label berbeda antar tahun (misal: lahan terbuka di 2024 berubah menjadi area terbangun di 2025).
*   **Metadata Titik**: Setiap titik wajib memiliki atribut `class` (nilai 0 atau 1) dan `year` (nilai 2024 atau 2025). Simpan dalam satu `FeatureCollection`.
*   **🚫 Larangan Keras**:
    1.  Jangan gunakan hasil klasifikasi lain sebagai ground truth.
    2.  Jangan mengambil semua titik sampel hanya dari satu atau beberapa polygon saja.
    3.  Jangan hanya menandai contoh yang paling mudah/jelas terlihat saja.
    4.  Jangan menyalin langsung label 2024 ke 2025 tanpa memeriksa citra tahun 2025.
    5.  Jangan membuat titik yang terlalu rapat/berhimpitan.
*   **Output Langkah 4**: Satu kumpulan ground truth berlabel (atribut kelas dan tahun) yang siap digunakan. (Bukti: Peta sebaran titik & tabel atribut).

#### 5️⃣ LANGKAH 5: Split Data & Latih Random Forest
Bagi ground truth menjadi subset data training dan testing secara terprogram (bukan manual) untuk melatih model klasifikasi.

*   **Mekanisme Split (70/30)**:
    *   Bagi data menjadi **70% Training Data** (untuk melatih model) dan **30% Testing Data** (untuk evaluasi).
    *   Split harus dilakukan untuk setiap kombinasi kelas-tahun secara proporsional agar representasi seimbang (misal: split 70/30 dilakukan pada kelompok 2024-Kelas1, 2024-Kelas0, 2025-Kelas1, dan 2025-Kelas0 baru kemudian digabungkan).
    *   Gunakan pembagian otomatis menggunakan kolom nilai acak (*random value*) dengan seed angka yang tetap (*fixed seed*). Seed wajib dicatat agar klasifikasi dapat direproduksi.
*   **Detail Pembagian (dari minimal 300 titik)**:
    *   **Training Data (70%)**: 210 observasi.
    *   **Testing Data (30%)**: 90 observasi.
*   **Konfigurasi Model**:
    *   Algoritma: Random Forest (`ee.Classifier.smileRandomForest`).
    *   Jumlah Tree: **100 trees**.
    *   Gunakan satu model ini untuk mengklasifikasikan kedua tahun.
*   **Output Langkah 5**: Model Random Forest terlatih dan data split yang siap dievaluasi. (Bukti: Pencatatan jumlah data, seed, dan parameter model).

#### 6️⃣ LANGKAH 6: Evaluasi Model dengan APRF
Uji performa model menggunakan testing data (30%) untuk melihat seberapa baik model dapat mengklasifikasikan objek target.

*   **Confusion Matrix**: Buat confusion matrix berukuran 2x2 berdasarkan *Actual Label* vs *Predicted Label*.

| | Predicted: Non-Target (0) | Predicted: Target (1) |
| :--- | :---: | :---: |
| **Actual: Non-Target (0)** | **TN** (True Negative) | **FP** (False Positive) |
| **Actual: Target (1)** | **FN** (False Negative) | **TP** (True Positive) |

*   **Metrik Evaluasi (APRF) Kelas Target (1)**:
    *   **Accuracy**: Persentase tebakan benar secara keseluruhan.
        $$\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}$$
    *   **Precision**: Dari semua area yang diprediksi model sebagai target, seberapa banyak yang benar-benar merupakan target di lapangan.
        $$\text{Precision} = \frac{TP}{TP + FP}$$
    *   **Recall (Sensitivity)**: Dari seluruh objek target yang sebenarnya ada, seberapa banyak yang berhasil ditemukan oleh model.
        $$\text{Recall} = \frac{TP}{TP + FN}$$
    *   **F1-Score**: Keseimbangan harmonis antara Precision dan Recall.
        $$\text{F1-score} = 2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$$
*   **Analisis Kesalahan**:
    *   *False Positive (FP)*: Model memprediksi objek target padahal sebenarnya bukan (contoh: tanah kosong cerah terdeteksi sebagai bangunan baru).
    *   *False Negative (FN)*: Model melewatkan objek target yang asli (contoh: vegetasi tipis atau area tertutup bayangan awan terdeteksi sebagai non-target).
*   **Keterbatasan**: Catat faktor pembatas seperti resolusi spasial Sentinel-2 (10-20 meter), keberadaan awan tipis/bayangan awan, serta keterbatasan titik sampling.
*   **Output Langkah 6**: Metrik evaluasi APRF dan analisis keterbatasan model. (Bukti: Confusion matrix & tabel metrik).

#### 7️⃣ LANGKAH 7: Satu Model, Dua Tahun
Gunakan model Random Forest yang sama (dari Langkah 5) untuk melakukan prediksi klasifikasi pada *feature stack* tahun 2024 dan 2025.

*   **Output Langkah 7**:
    *   Raster klasifikasi tahun 2024 (bernilai 0 atau 1).
    *   Raster klasifikasi tahun 2025 (bernilai 0 atau 1).
    *   Luas objek target tahun 2024 dan 2025 (dalam hektare).
    *   Persentase luas objek target terhadap total luas kota untuk masing-masing tahun.

#### 8️⃣ LANGKAH 8: Di Mana Objek Bertambah dan Berkurang?
Lakukan analisis deteksi perubahan (*change detection*) secara spasial dengan membandingkan raster klasifikasi 2024 dan 2025.

*   **Matriks Perubahan Kelas**:

| Hasil Klasifikasi 2024 | Hasil Klasifikasi 2025 | Kategori Perubahan | Nilai Piksel Baru |
| :---: | :---: | :--- | :---: |
| 1 | 1 | **Tetap Target (Stable Target)** | 1 |
| 0 | 0 | **Tetap Non-Target (Stable Non-Target)** | 0 |
| 0 | 1 | **Bertambah (Gain)** | 2 |
| 1 | 0 | **Berkurang (Loss)** | 3 |

*   **Penyusunan Peta Perubahan (Change Map)**:
    *   Tampilkan kelas *Gain*, *Loss*, dan *Stable Target*.
    *   Kelas *Stable Non-Target* sebaiknya diset transparan agar visualisasi berfokus pada dinamika objek target.
*   **Vektorisasi (Vectorization) ke GeoJSON**:
    *   Konversi hasil raster perubahan menjadi polygon vektor.
    *   *Best Practice Sebelum Ekspor*:
        *   Hanya ekspor kelas perubahan yang diperlukan (*Gain* dan *Loss*).
        *   Lakukan *filtering* untuk menghilangkan patch/polygon yang sangat kecil (noise).
        *   Sederhanakan geometri (*simplify geometry*) untuk mengurangi ukuran file GeoJSON agar tidak memperlambat loading WebGIS.
*   **Perhitungan Luas & Persentase Perubahan**:
    *   Hitung luas total area bertambah (*Gain*) dan berkurang (*Loss*).
    *   Hitung perubahan bersih (*Net Change*):
        $$\text{Net Change} = \text{Luas 2025} - \text{Luas 2024}$$
    *   Hitung persentase perubahan bersih terhadap kondisi awal (2024):
        $$\text{Persentase Perubahan} = \frac{\text{Net Change}}{\text{Luas 2024}} \times 100\%$$
*   **Output Langkah 8**: GeoJSON polygon perubahan (*Gain* dan *Loss*) serta statistik luas perubahan. (Bukti: Peta perubahan dan angka luasan).

#### 9️⃣ LANGKAH 9: WebGIS Empat Tab: Jelaskan Hasil, Proses, dan Kepercayaannya
Bangun aplikasi WebGIS interaktif yang memiliki struktur navigasi 4 tab wajib untuk mempublikasikan proyek.

*   **Ketentuan Platform**: Bebas menggunakan Google Earth Engine (GEE) App, Leaflet, MapLibre GL JS, Streamlit, geemap, atau platform pemetaan web interaktif lainnya.
*   **Struktur WebGIS Wajib (4 Tab)**:
    1.  **Tab 1: Peta Hasil (Map)**
        *   Menampilkan peta interaktif berisi batas kota, sebaran objek target 2024, sebaran objek target 2025, serta peta perubahan (*Gain* & *Loss*).
        *   Wajib dilengkapi dengan Legend, Layer Control (untuk menyalakan/mematikan layer), Opacity Control, Ringkasan Statistik Luas (2024, 2025, Net Change, Persentase), dan Popup Informasi ketika polygon diklik.
    2.  **Tab 2: Data & Proses (Data & Process)**
        *   Menyajikan transparansi metodologi: Sumber citra Sentinel-2 (`S2_SR_HARMONIZED`), periode komposit, teknik *cloud masking*, detail ground truth (total titik, sebaran, rasio training-testing 70/30), diagram alur kerja, dan parameter model Random Forest (100 trees).
    3.  **Tab 3: Evaluasi Model (Model Evaluation)**
        *   Menampilkan tabel Confusion Matrix data testing 2x2.
        *   Menampilkan nilai Accuracy, Precision, Recall, dan F1-score untuk kelas target.
        *   Interpretasi kesalahan klasifikasi (apa yang tertukar, mengapa terjadi False Positive dan False Negative).
    4.  **Tab 4: Insight Hasil (Insights)**
        *   Ringkasan insight cepat: Di bagian kota mana perubahan terbesar terjadi? Apa pola spasial distribusinya?
        *   Analisis potensi penyebab perubahan (misal: konversi lahan vegetasi menjadi perumahan di timur kota).
        *   Potensi pemanfaatan hasil peta ini bagi pembuat kebijakan (tata ruang, lingkungan, dll.).
        *   Rekomendasi tindak lanjut untuk penelitian/analisis di masa depan.
*   **⚠️ Larangan Keras**:
    *   Dilarang hanya menempelkan screenshot/gambar peta mati pada halaman web. Peta harus interaktif (bisa di-pan, di-zoom, dan diklik).
*   **Output Langkah 9**: Tautan aplikasi WebGIS interaktif yang dapat diakses publik. (Bukti: Tautan & screenshot seluruh tab).

---

## 📂 Struktur Repository GitHub

Setiap kelompok wajib membuat satu repository GitHub publik dengan struktur folder minimum sebagai berikut:

```
├── gee/
│   ├── preprocessing.js        # Script GEE untuk komposit citra dan cloud masking
│   ├── ground_truth.js         # Script/data titik sampling
│   ├── random_forest.js        # Script pelatihan model, split 70/30, dan klasifikasi
│   └── change_analysis.js      # Script perhitungan luas, change detection, dan ekspor
├── webgis/
│   ├── index.html              # Struktur utama WebGIS (4 tab)
│   ├── style.css               # Styling layout dan kontrol peta
│   ├── script.js               # Logic peta interaktif, layer control, dan data binding
│   └── assets/                 # Logo, ikon, atau gambar pendukung
├── data/
│   ├── boundary_kota.geojson   # GeoJSON batas administrasi wilayah studi
│   ├── change_gain.geojson     # GeoJSON area pertambahan objek
│   └── change_loss.geojson     # GeoJSON area pengurangan objek
├── results/
│   ├── confusion_matrix.csv    # Data tabel confusion matrix
│   └── area_statistics.json    # Catatan luas area dan persentase perubahan
├── report/
│   └── Laporan_Akhir.pdf       # File laporan PDF resmi (5-8 halaman)
└── README.md                   # Informasi proyek, daftar anggota kelompok, kota studi,
                                # objek target, struktur folder, & link akses WebGIS
```

*   **Penting**: Status repository harus **Public** dan jangan mengunggah file credential, API key, password, atau access token ke dalam repository. Lakukan commit secara berkala sebagai bukti kolaborasi tim.

---

## 📝 Format Laporan & Presentasi

### 1. Laporan Akhir Ringkas
*   **Format**: PDF dengan panjang **5-8 halaman** (tidak termasuk lampiran).
*   **Fokus**: Tulis secara padat mengenai alur kerja, keputusan teknis yang diambil, hasil analisis perubahan lahan, alasan di balik pengambilan keputusan tersebut, dan pembagian kontribusi anggota kelompok.

### 2. Presentasi & Demo UAS
*   **Waktu Total**: 10 Menit per kelompok.
    *   **3 Menit**: Presentasi materi (Kota, Objek, Preprocessing, Random Forest, Metrik APRF).
    *   **3 Menit**: Demo WebGIS Interaktif (menunjukkan fungsi navigasi 4 tab).
    *   **4 Menit**: Tanya Jawab dengan dosen penguji.
*   **Ketentuan Anggota**: Semua anggota wajib hadir secara fisik/daring, memahami alur keseluruhan proyek (bukan hanya bagian kerjanya saja), dan mampu menjawab pertanyaan penguji secara individu.

### 3. Form Assessment Kelompok
*   Setiap mahasiswa wajib mengisi form penilaian kerja kelompok secara mandiri melalui tautan: `https://s.bakrie.ac.id/AssessmentUasMdKS`
*   Form ini digunakan dosen untuk mengevaluasi pembagian kontribusi nyata, kualitas kerja sama, keterlibatan aktif, dan kesesuaian laporan kontribusi anggota kelompok.

---

## 📊 Rubrik Penilaian Proyek (Total 100%)

Penilaian akhir proyek didasarkan pada komponen-komponen berikut:

| Komponen Penilaian | Bobot | Kriteria Evaluasi |
| :--- | :---: | :--- |
| **Masalah & Studi Kasus** | 5% | Kesesuaian rumusan masalah, keunikan kota, dan kejelasan definisi objek target. |
| **Citra & Preprocessing** | 15% | Kualitas komposit Sentinel-2, perlakuan awan (*cloud masking*) yang adil untuk kedua tahun. |
| **Kualitas Ground Truth** | 20% | Jumlah titik minimal 300, sebaran merata, keseimbangan kelas target/non-target, & kebenaran label. |
| **Random Forest & Reproducibility** | 15% | Penggunaan model yang sama untuk dua tahun, split 70/30 via kode, pencatatan seed dan parameter model. |
| **Confusion Matrix & APRF** | 15% | Kebenaran perhitungan confusion matrix, ketepatan metrik APRF kelas target, dan kedalaman analisis error. |
| **Analisis Perubahan & Polygon** | 10% | Kejelasan visualisasi change map, kerapihan pembersihan polygon GeoJSON (*filtering noise* & simplifikasi). |
| **WebGIS Interaktif** | 15% | Fungsionalitas peta interaktif, pemenuhan struktur 4 tab wajib, legenda, kontrol layer, & tautan aktif. |
| **Presentasi & Pemahaman** | 5% | Kinerja presentasi, kelancaran demo, serta pemahaman individu saat sesi tanya jawab. |

---

## ✅ Checklist Kelompok Sebelum Mengumpulkan

Sebelum melakukan submit pekerjaan UAS, centang checklist berikut untuk memastikan tidak ada komponen yang terlewat:

- [ ] **Kota Studi**: Dipastikan tidak sama dengan wilayah studi kelompok lain di kelas.
- [ ] **Objek Target**: Telah disetujui oleh dosen (khusus untuk objek non-standar).
- [ ] **Rentang Citra**: Periode bulan/tanggal komposit tahun 2024 dan 2025 sudah setara/konsisten.
- [ ] **Band & Indeks**: Band asli dan indeks spektral masukan yang digunakan pada tahun 2024 dan 2025 persis sama.
- [ ] **Ground Truth Minimum**: Jumlah total titik ground truth minimal 300 titik (150 per tahun).
- [ ] **Keseimbangan Kelas**: Titik ground truth terbagi seimbang (150 titik target, 150 titik non-target).
- [ ] **Training-Testing Split**: Data training (70%) dan testing (30%) dipisah secara otomatis menggunakan kode, bukan dipilih manual.
- [ ] **Fixed Seed & Model**: Menggunakan nilai seed random tetap yang dicatat, dan melatih 1 model Random Forest yang sama untuk memprediksi kedua tahun.
- [ ] **APRF Testing Data**: Metrik evaluasi Accuracy, Precision, Recall, dan F1-score dihitung khusus menggunakan testing data (30%), bukan training data.
- [ ] **Pembersihan Geometri**: Polygon hasil vektorisasi raster perubahan sudah dibersihkan dari noise kecil dan disederhanakan (*simplify*) sebelum diekspor.
- [ ] **Fungsionalitas WebGIS**: WebGIS dapat dibuka secara publik melalui tautan, tidak ada layer error, dan memiliki kontrol interaktif.
- [ ] **Struktur 4 Tab**: Aplikasi WebGIS memiliki tab Peta Hasil, Data & Proses, Evaluasi Model, dan Insight Hasil.
- [ ] **Status Repository**: Repository GitHub diatur dengan status **Public** dan memiliki struktur folder yang rapi sesuai panduan.
- [ ] **README.md**: Menjelaskan detail proyek, cara menjalankan kode, tautan WebGIS, dan identitas kelompok secara lengkap.
- [ ] **Laporan Akhir**: File PDF Laporan Akhir (5-8 halaman) sudah diunggah di repository dan portal pengumpulan.
- [ ] **Form Assessment**: Seluruh anggota kelompok telah mengisi kuesioner penilaian kontribusi individu secara mandiri.