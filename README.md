# HideIT — Tactical Cryptography & Steganography Platform

HideIT adalah aplikasi web *single-page*, *client-side*, dan *self-contained* untuk eksperimen kriptografi klasik/modern serta steganografi LSB pada gambar. Seluruh proses (enkripsi, embedding, ekstraksi) berjalan **100% di browser** — tidak ada data yang dikirim ke server mana pun.

Didesain dengan tema **"Tactical Technicalism"**: dark UI bergaya terminal/command-center, aksen *Terminal Green* & *Cipher Blue*, dan tipografi `JetBrains Mono`.

---

## Daftar Isi

- [Fitur Utama](#fitur-utama)
- [Modul Aplikasi](#modul-aplikasi)
  - [1. Cipher Lab (Cryptography)](#1-cipher-lab-cryptography)
  - [2. Signal Hide (Steganography)](#2-signal-hide-steganography)
  - [3. Dual-Lock Pipeline](#3-dual-lock-pipeline)
- [Struktur File](#struktur-file)
- [Cara Pakai Singkat](#cara-pakai-singkat)
- [Detail Teknis](#detail-teknis)
- [Batasan & Catatan Keamanan](#batasan--catatan-keamanan)
- [Teknologi yang Digunakan](#teknologi-yang-digunakan)
- [Lisensi](#lisensi)

---

## Fitur Utama

- 🔐 **4 algoritma enkripsi**: AES-256 (CBC), Caesar Cipher, Vigenère Cipher, Affine Cipher
- 🖼️ **LSB Steganography** dengan mode *Sequential* dan *Random (key-seeded)*, plus opsi *XOR masking* tambahan
- 🧬 **Dual-Lock Pipeline**: kombinasi AES-256 + LSB Random dalam satu alur (enkripsi dulu, baru disembunyikan ke gambar)
- 📊 **Analisis kualitas gambar**: kalkulasi otomatis **MSE**, **PSNR**, dan **SSIM** antara gambar asli vs gambar stego
- 📈 **Histogram Comparison**: visualisasi distribusi warna (Canvas 2D) antara gambar original vs hasil steganografi
- 🖱️ **Drag-and-drop** upload gambar, dengan preview & tombol hapus gambar instan
- 🧾 **Terminal log** real-time di setiap modul untuk menampilkan jejak proses (mirip console output)
- 🔁 **NEW SESSION**: reset penuh seluruh state, input, dan preview di semua modul dengan satu klik
- 👁️ **Toggle visibility** password/key di semua input sensitif
- 💾 **Export hasil**: download gambar stego (`stego_result.png`) atau vault Dual-Lock (`hideit_vault.png`)
- ⚡ Tanpa instalasi, tanpa backend, tanpa dependency eksternal kecuali Google Fonts (opsional)

---

## Modul Aplikasi

### 1. Cipher Lab (Cryptography)

Modul untuk enkripsi/dekripsi teks murni.

| Algoritma | Mode | Parameter Kunci |
|---|---|---|
| **AES-256 (CBC)** | Encrypt / Decrypt | Passphrase (key didapat lewat **PBKDF2**, 100.000 iterasi, SHA-256; salt & IV acak disisipkan otomatis ke output base64) |
| **Caesar Cipher** | Encrypt / Decrypt | Shift key (1–25) |
| **Vigenère Cipher** | Encrypt / Decrypt | Keyword (huruf) |
| **Affine Cipher** | Encrypt / Decrypt | Multiplier `a` (harus koprima dengan 26) dan shift `b` (0–25) |

Output ditampilkan di kotak hasil dengan tombol **COPY**, lengkap dengan log waktu eksekusi (ms) di terminal panel.

### 2. Signal Hide (Steganography)

Modul LSB (*Least Significant Bit*) steganography pada gambar — menyisipkan/mengekstrak pesan teks ke/dari piksel gambar.

- **Mode EMBED**: masukkan gambar cover (PNG/JPG, maks 12MB) + pesan rahasia (maks 4096 byte), lalu sisipkan.
- **Mode EXTRACT**: upload gambar yang sudah mengandung pesan tersembunyi, lalu ekstrak kembali isinya.
- **Metode embedding**:
  - `LSB SEQUENTIAL` — bit disisipkan berurutan dari piksel pertama.
  - `LSB RANDOM (KEY-SEEDED)` — urutan piksel diacak menggunakan PRNG yang di-seed dari key/passphrase (linear congruential generator + Fisher–Yates shuffle), sehingga ekstraksi hanya bisa dilakukan dengan key yang sama.
- **XOR Masking** (opsional): pesan di-XOR dengan key sebelum disisipkan, menambah satu lapis obfuskasi sederhana.
- Delimiter EOF biner (`1111111111111110`) digunakan untuk menandai akhir pesan saat ekstraksi.
- Setelah proses embed, ditampilkan:
  - Perbandingan visual gambar asli vs gambar stego.
  - Metrik kualitas: **MSE**, **PSNR (dB)**, **SSIM**.
  - Histogram perbandingan channel warna.
- Tombol **DOWNLOAD** untuk mengunduh hasil sebagai `stego_result.png`.

### 3. Dual-Lock Pipeline

Pipeline dua lapis yang menggabungkan **Cipher Lab** dan **Signal Hide** secara otomatis dan berurutan:

```
PLAINTEXT → [LAYER 01: AES-256 Encryption] → [LAYER 02: LSB Random Embed] → STEGO ARTIFACT (Vault PNG)
```

- **ENCODE PIPELINE**: pesan rahasia dienkripsi dengan AES-256 (key diturunkan dari *Master Security Key* via PBKDF2), lalu ciphertext hasilnya disisipkan ke gambar cover menggunakan LSB Random seeded dengan key yang sama. Hasil akhir adalah satu file PNG ("Vault Image") yang membungkus dua lapis pengamanan.
- **DECODE PIPELINE**: upload Vault PNG hasil Dual-Lock Encode + masukkan Master Key yang sama → sistem mengekstrak ciphertext via LSB, lalu mendekripsinya dengan AES-256 untuk mengembalikan plaintext asli.
- Dilengkapi indikator **Key Strength** (progress bar entropi berdasarkan panjang & variasi karakter password), progress bar animasi tiap tahap pipeline, metrik MSE/PSNR/SSIM, serta histogram comparison.
- Tombol **DOWNLOAD VAULT** mengunduh hasil sebagai `hideit_vault.png`.

---

## Struktur File

```
HideIT Final/
├── index.html      # Markup UI seluruh modul (sidebar, topbar, 3 modul, statusbar)
├── style.css       # Design system "Tactical Technicalism" (dark theme, JetBrains Mono)
├── app.js          # Seluruh logika: cipher, AES (Web Crypto API), LSB embed/extract,
│                   #   metrik kualitas gambar, histogram, drag-drop, session management
└── README.md       # Dokumen ini
```

Aplikasi ini **single-file-friendly** — hanya 3 file inti (HTML/CSS/JS) tanpa build step, tanpa `node_modules`, dan tanpa server backend.

---

## Cara Pakai Singkat

**Enkripsi teks (Cipher Lab):**
1. Pilih algoritma di panel `SELECT_ALGORITHM`.
2. Pilih mode `ENCRYPT` / `DECRYPT`.
3. Isi key/passphrase sesuai algoritma.
4. Tulis teks di `BUFFER_INPUT`, klik **EXECUTE_TRANSFORM**.
5. Hasil muncul di `TRANSFORM_RESULT`, salin dengan tombol **COPY**.

**Menyembunyikan pesan ke gambar (Signal Hide):**
1. Pilih mode `EMBED`.
2. Upload cover image (drag & drop atau klik area upload).
3. Pilih metode LSB (Sequential/Random) dan, jika perlu, aktifkan XOR Masking + isi stego key.
4. Tulis pesan rahasia, klik **EXECUTE EMBEDDING**.
5. Unduh hasil via **DOWNLOAD**.

Untuk mengekstrak: pilih mode `EXTRACT`, upload gambar yang mengandung pesan, isi key yang sama (jika dipakai saat embed), klik **EXECUTE EXTRACTION**.

**Dual-Lock (AES + LSB sekaligus):**
1. Pilih `ENCODE PIPELINE`, isi pesan rahasia + Master Security Key, upload cover image.
2. Klik **EXECUTE DUAL-LOCK ENCODE** → unduh **Vault PNG**.
3. Untuk membuka kembali: pilih `DECODE PIPELINE`, upload Vault PNG, isi Master Key yang sama, klik **EXECUTE DUAL-LOCK DECODE**.

**Reset semua data:** klik **NEW SESSION** di sidebar untuk mengosongkan seluruh input, gambar, dan hasil di ketiga modul sekaligus.

---

## Detail Teknis

- **AES-256**: `AES-CBC` via Web Crypto API. Key diturunkan dari passphrase menggunakan **PBKDF2** (100.000 iterasi, SHA-256). Salt (16 byte) dan IV (16 byte) digenerate acak per operasi, lalu digabung dengan ciphertext dan di-encode Base64 sebagai output tunggal — sehingga hasil enkripsi *self-contained* untuk proses dekripsi.
- **LSB Steganography**: bit pesan (termasuk delimiter EOF `1111111111111110`) disisipkan ke bit terakhir (LSB) tiap byte channel warna piksel (`R,G,B,A`) memakai operasi bitwise (`& 0xFE | bit`).
  - Mode *Random*: urutan indeks byte di-shuffle dengan PRNG (LCG sederhana) yang di-seed dari penjumlahan char-code key, dikombinasikan algoritma **Fisher–Yates shuffle**.
- **Metrik kualitas gambar** (dihitung antara gambar original vs gambar hasil steganografi):
  - **MSE** (Mean Squared Error)
  - **PSNR** (Peak Signal-to-Noise Ratio, dalam dB)
  - **SSIM** (Structural Similarity Index)
- **Histogram Comparison**: digambar dengan Canvas 2D API, menampilkan distribusi intensitas piksel original vs stego secara berdampingan.
- **Reset state**: file input dibersihkan lewat teknik `cloneNode` (mengganti elemen input lama dengan clone-nya) untuk memastikan reset bekerja konsisten di seluruh browser.

---

## Batasan & Catatan Keamanan

- ⚠️ Ini adalah proyek **edukasi/eksplorasi kriptografi & steganografi**, bukan produk keamanan tingkat produksi. Gunakan dengan bijak dan jangan dipakai untuk menyimpan data sensitif yang krusial.
- Kapasitas penyimpanan LSB terbatas oleh resolusi gambar (maks **4096 byte** pesan per panel Signal Hide).
- Cipher klasik (Caesar, Vigenère, Affine) **mudah dipecahkan** secara kriptanalisis — disertakan untuk tujuan pembelajaran, bukan untuk keamanan nyata.
- Operasi LSB pada gambar **JPEG** berisiko merusak data tersembunyi akibat kompresi lossy; gunakan **PNG** untuk hasil yang andal.
- Semua proses berjalan di memori browser (client-side) — menutup tab tanpa mengunduh hasil akan menghilangkan data yang belum disimpan.

---

## Teknologi yang Digunakan

- **HTML5 / CSS3** — struktur & desain UI (custom design system, tanpa framework CSS)
- **Vanilla JavaScript (ES6+)** — seluruh logika aplikasi tanpa library eksternal
- **Web Crypto API** (`crypto.subtle`) — AES-256-CBC & PBKDF2
- **Canvas 2D API** — manipulasi piksel gambar (LSB) dan rendering histogram
- **Google Fonts** — `JetBrains Mono` & `Geist` (opsional, via CDN)

---

## Lisensi

Proyek pribadi/akademik. Sesuaikan lisensi (misalnya MIT) jika ingin dipublikasikan sebagai open source.

---

<p align="center"><sub>HIDEIT TACTICAL © 2026 — SYSTEM_STATUS: OPERATIONAL</sub></p>
