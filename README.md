# Donasi Berkat - Proyek UAS Pemrograman Web

Platform berbagi barang bekas untuk memenuhi kebutuhan sesama. Proyek ini dibuat sebagai Ujian Akhir Semester (UAS) mata kuliah Pemrograman Web, Program Studi Informatika, Semester 4.

## Deskripsi Proyek

**Donasi Berkat** adalah aplikasi web yang memfasilitasi proses donasi dan permintaan barang bekas. Pengguna dapat menawarkan barang yang sudah tidak terpakai namun masih layak guna kepada orang lain yang membutuhkan, serta mengajukan permintaan barang yang mereka perlukan. Tujuannya adalah untuk mendorong budaya berbagi, mengurangi limbah, dan membantu masyarakat secara berkelanjutan.

## Fitur Utama

*   **Autentikasi Pengguna:** Daftar dan masuk akun.
*   **Manajemen Donasi:** Membuat, melihat, mengedit, dan menghapus postingan donasi barang.
*   **Manajemen Wishlist (Permintaan Barang):** Membuat, melihat, mengedit, dan menghapus postingan permintaan barang.
*   **Penjelajahan:** Mencari dan memfilter donasi serta wishlist berdasarkan kategori, lokasi, dll.
*   **Dashboard Pengguna:** Ringkasan aktivitas pengguna, termasuk donasi yang dibuat, permintaan yang diajukan, dan permintaan yang diterima untuk donasinya.
*   **Profil Pengguna:** Menampilkan informasi pengguna, donasi, dan wishlist yang terkait.
*   **Notifikasi:** Pemberitahuan untuk aktivitas relevan (misalnya, permintaan baru, status donasi berubah).
*   **Diskusi/Chat:** Fitur komunikasi antara donatur dan pemohon (berdasarkan adanya `ChatContext` dan `ChatWidget`).
*   **Panel Admin:** (Untuk pengelola) Manajemen pengguna, donasi, badge, dll.
*   **Halaman Statis:** FAQ, Kebijakan Privasi, Syarat & Ketentuan, Tinjauan Teknis.

## Teknologi yang Digunakan

*   **Frontend:**
    *   React.js (v18+)
    *   Vite (Build tool)
    *   React Router (Routing)
    *   Tailwind CSS (Styling)
    *   Heroicons (Ikon)
    *   `react-hot-toast` (Notifikasi)
    *   `headlessui/react` (Komponen UI)
    *   `date-fns` (Format tanggal/waktu)
    *   `framer-motion` (Animasi - terdeteksi di HomePage)
*   **Backend & Database:**
    *   Supabase (Backend as a Service - Autentikasi, Database PostgreSQL, Realtime Subscriptions)
*   **Lainnya:**
    *   ESLint (Linting)

## Struktur Proyek (`/src`)

```
/src
├── assets/         # Gambar, ikon, dan aset statis lainnya
├── components/     # Komponen UI yang dapat digunakan kembali (Button, Card, Layout, dll.)
│   ├── admin/      # Komponen khusus untuk panel admin
│   ├── features/   # Komponen terkait fitur spesifik (misal: Chat)
│   └── ui/         # Komponen UI dasar
├── contexts/       # React Contexts (Auth, Chat, Notification)
├── hooks/          # Custom React Hooks
├── lib/            # Klien atau konfigurasi library eksternal (supabaseClient)
├── pages/          # Komponen halaman utama untuk setiap route
│   └── admin/      # Halaman khusus untuk panel admin
├── utils/          # Fungsi utilitas helper
├── App.jsx         # (Kemungkinan tidak digunakan lagi, routing di main.jsx)
├── App.css         # Styling global minimal (jika ada)
├── index.css       # Styling global utama (termasuk setup Tailwind)
└── main.jsx        # Entry point aplikasi, konfigurasi router, provider
```

## Instalasi dan Menjalankan Proyek

1.  **Clone repository:**
    ```bash
    git clone [URL_REPOSITORY_ANDA]
    cd donasi-berkat
    ```
2.  **Install dependencies:**
    Pastikan Anda memiliki Node.js dan npm (atau yarn/pnpm) terinstal.
    ```bash
    npm install
    # atau
    # yarn install
    # atau
    # pnpm install
    ```
3.  **Setup environment variables:**
    Buat file `.env` di root proyek dan tambahkan kredensial Supabase Anda:
    ```env
    VITE_SUPABASE_URL=URL_SUPABASE_ANDA
    VITE_SUPABASE_ANON_KEY=ANON_KEY_SUPABASE_ANDA
    ```
    Ganti `URL_SUPABASE_ANDA` dan `ANON_KEY_SUPABASE_ANDA` dengan nilai dari proyek Supabase Anda.

4.  **Run the development server:**
    ```bash
    npm run dev
    # atau
    # yarn dev
    # atau
    # pnpm dev
    ```
    Aplikasi akan berjalan di `http://localhost:5173` (atau port lain jika 5173 sudah digunakan).

## Kontribusi

Informasi mengenai cara berkontribusi pada proyek ini (jika relevan untuk tugas kuliah).

---

*Dokumentasi ini dibuat untuk memenuhi tugas UAS Pemrograman Web Semester 4.*
