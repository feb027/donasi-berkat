import React from 'react';
import { ServerIcon, CircleStackIcon, CodeBracketSquareIcon, SwatchIcon, CubeTransparentIcon, MapIcon, UsersIcon, ChatBubbleLeftRightIcon, BellIcon, ShieldCheckIcon, ListBulletIcon, CloudIcon, WindowIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

function TechItem({ icon, name, description }) {
  const Icon = icon;
  return (
    <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
      <Icon className="h-8 w-8 text-emerald-500 flex-shrink-0 mt-1" />
      <div>
        <h4 className="font-semibold text-gray-800">{name}</h4>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
    </div>
  );
}

function FeatureItem({ icon, name, description }) {
    const Icon = icon;
    return (
        <li className="flex items-start gap-3">
            <Icon className="h-6 w-6 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div>
                <strong className="font-medium text-gray-800">{name}:</strong>
                <span className="ml-1 text-gray-600">{description}</span>
            </div>
        </li>
    );
}

function TechnicalOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-emerald-600 mb-12">
        Tinjauan Teknis DonasiBerkat
      </h1>

      <div className="space-y-10 text-gray-700 leading-relaxed">

        {/* Introduction */}
        <section>
          <p className="text-lg text-center text-gray-600 mb-10">
            Halaman ini memberikan gambaran teknis mendalam mengenai arsitektur, teknologi, dan fitur utama yang membangun platform DonasiBerkat.
          </p>
        </section>

        {/* Tech Stack Overview */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-6 pb-2 border-b border-emerald-200 flex items-center gap-2">
            <CubeTransparentIcon className="h-6 w-6 text-emerald-500"/> Tumpukan Teknologi (Tech Stack)
          </h2>
          <p className="mb-6">
            DonasiBerkat dibangun menggunakan tumpukan teknologi modern yang berfokus pada pengalaman pengembang yang baik, performa, dan skalabilitas. Aplikasi ini utamanya ditulis menggunakan JavaScript (dengan JSX untuk React) dan memanfaatkan ekosistem Node.js untuk pengembangan dan build tools.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TechItem icon={CodeBracketSquareIcon} name="Frontend: React & Vite" description="Antarmuka pengguna dibangun menggunakan React (v19) sebagai library/framework UI deklaratif, dengan Vite sebagai build tool super cepat." />
            <TechItem icon={SwatchIcon} name="Styling: Tailwind CSS & Headless UI" description="Styling menggunakan Tailwind CSS (v4) untuk utility-first styling cepat, didukung Headless UI untuk komponen UI yang aksesibel." />
            <TechItem icon={ServerIcon} name="Backend/BaaS: Supabase" description="Supabase bertindak sebagai Backend-as-a-Service (BaaS), menyediakan layanan database, autentikasi, penyimpanan file, dan fitur realtime siap pakai." />
            <TechItem icon={CircleStackIcon} name="Database & DBMS: PostgreSQL" description="Data disimpan dalam database relasional PostgreSQL yang kuat dan terpercaya, yang dikelola dan diakses melalui layanan Supabase." />
          </div>
        </section>

        {/* Frontend Details */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-6 pb-2 border-b border-emerald-200 flex items-center gap-2">
             <WindowIcon className="h-6 w-6 text-emerald-500"/> Detail Frontend
          </h2>
          <ul className="space-y-4 list-disc list-outside ml-5">
            <li><strong>Bahasa & Framework:</strong> JavaScript (ES6+) dengan JSX, menggunakan React 19 sebagai library UI utama. Memanfaatkan fitur modern React seperti Hooks (useState, useEffect, useContext, useCallback, dll.) untuk logika komponen dan state.</li>
            <li><strong>Build Tool:</strong> Vite untuk development server cepat (HMR) dan build produksi yang dioptimalkan (tree-shaking, code-splitting).</li>
            <li><strong>Routing:</strong> `react-router-dom` (v7) menangani navigasi sisi klien, memungkinkan URL yang bersih dan pengalaman Single Page Application (SPA).</li>
            <li><strong>State Management:</strong> 
                <ul className="list-circle list-outside ml-5 mt-2 space-y-1">
                    <li><strong>Global State:</strong> React Context API (`AuthContext`, `ChatContext`, `NotificationContext`) digunakan untuk state yang perlu dibagikan ke banyak komponen (misal, data user, status chat).</li>
                    <li><strong>Local State:</strong> `useState` untuk state sederhana di dalam komponen.</li>
                     <li><strong>Server Cache State:</strong> Meskipun tidak eksplisit disebutkan library seperti React Query atau SWR, data dari Supabase diambil menggunakan `useEffect` dan `useState`. Untuk aplikasi yang lebih kompleks, library caching state server bisa dipertimbangkan untuk optimasi pengambilan data, caching, dan sinkronisasi background.</li>
                 </ul>
            </li>
            <li><strong>Komponen UI & Styling:</strong> Tailwind CSS (v4) untuk styling utility-first. Komponen UI kustom dibuat dan beberapa komponen kompleks (dropdown, modal) memanfaatkan `Headless UI` untuk aksesibilitas dan fleksibilitas. Ikon disediakan oleh `@heroicons/react` dan `react-icons`.</li>
            <li><strong>Animasi:</strong> `framer-motion` digunakan untuk menambahkan transisi dan animasi halus pada elemen UI.</li>
            <li><strong>Notifikasi:</strong> `react-hot-toast` menampilkan notifikasi toast non-intrusif.</li>
            <li><strong>Form Handling:</strong> Form dikelola menggunakan state React standar, dengan validasi sisi klien dasar sebelum submit.</li>
            <li><strong>Lainnya:</strong> `date-fns` untuk manipulasi dan format tanggal/waktu, `nprogress` untuk indikator loading global.</li>
          </ul>
        </section>

        {/* Backend/BaaS Details */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-6 pb-2 border-b border-emerald-200 flex items-center gap-2">
             <CloudIcon className="h-6 w-6 text-emerald-500"/> Backend / Backend-as-a-Service (BaaS)
          </h2>
          <p className="mb-4">
            Pengembangan backend sangat disederhanakan dengan menggunakan Supabase sebagai Backend-as-a-Service. Ini berarti banyak fungsi backend umum disediakan sebagai layanan siap pakai:
          </p>
          <ul className="space-y-4 list-disc list-outside ml-5">
            <li><strong>Database (DBMS: PostgreSQL):</strong> Skema database dirancang secara relasional (lihat file `daatabase.schema`), diakses melalui Supabase client library (`@supabase/supabase-js`). Index ditambahkan pada kolom yang sering di-query untuk performa.</li>
            <li><strong>Autentikasi:</strong> Supabase Auth digunakan untuk signup/login email & password. Mekanisme JWT digunakan untuk manajemen sesi.</li>
            <li><strong>Otorisasi (Authorization):</strong> Diterapkan terutama melalui **Row Level Security (RLS)** pada level database PostgreSQL. Policy RLS memastikan pengguna hanya dapat mengakses atau memodifikasi data yang mereka miliki atau diizinkan (misal, admin bisa melihat semua, pengguna biasa hanya data miliknya). Ini adalah kunci keamanan data di Supabase.</li>
            <li><strong>Penyimpanan (Storage):</strong> Supabase Storage digunakan untuk gambar avatar dan donasi, dengan policy akses yang membatasi unggahan/pengambilan berdasarkan autentikasi dan otorisasi.</li>
            <li><strong>Realtime:</strong> Fitur Supabase Realtime (berbasis PostgreSQL LISTEN/NOTIFY) digunakan untuk langganan (subscription) pada perubahan tabel `notifications` dan `messages` (atau tabel chat terkait), memungkinkan pembaruan UI instan tanpa polling.</li>
            <li><strong>Fungsi Serverless (Edge Functions / RPC):</strong> Terdapat indikasi penggunaan fungsi RPC (Remote Procedure Call) PostgreSQL melalui Supabase (`get_user_auth_data`, `get_user_activity_summary`). Fungsi ini memungkinkan logika kustom dieksekusi di sisi server dengan aman, seringkali dengan hak akses yang lebih tinggi (misal, `SECURITY DEFINER`) untuk tugas administratif atau query kompleks yang melibatkan data dari beberapa user.</li>
          </ul>
        </section>

        {/* Key Features */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-800 mt-10 mb-6 pb-2 border-b border-emerald-200 flex items-center gap-2">
            <ListBulletIcon className="h-6 w-6 text-emerald-500"/> Fitur Utama
          </h2>
          <p className="mb-6">
            Berdasarkan struktur halaman dan komponen, berikut adalah beberapa fitur utama yang diimplementasikan di DonasiBerkat:
          </p>
          <ul className="space-y-5">
            <FeatureItem icon={UsersIcon} name="Manajemen Pengguna & Autentikasi" description="Pendaftaran, Login, Logout, Manajemen Profil (Edit Nama, Avatar), Tampilan Profil Pengguna Lain." />
            <FeatureItem icon={CubeTransparentIcon} name="Manajemen Donasi (CRUD)" description="Membuat postingan donasi baru (dengan detail, kategori, gambar), Melihat daftar donasi (Browse), Melihat detail donasi, Mengedit donasi yang sudah dibuat, Menandai donasi sebagai 'diambil'." />
            <FeatureItem icon={CheckCircleIcon} name="Sistem Permintaan Donasi" description="Pengguna dapat mengajukan permintaan untuk mengambil barang donasi. Pendonor dapat menyetujui atau menolak permintaan." />
            <FeatureItem icon={ChatBubbleLeftRightIcon} name="Chat Realtime" description="Fitur chat antar pengguna (kemungkinan antara pendonor dan peminta) untuk koordinasi serah terima barang." />
            <FeatureItem icon={BellIcon} name="Sistem Notifikasi Realtime" description="Pemberitahuan instan untuk aktivitas penting seperti pesan chat baru, permintaan donasi baru, persetujuan/penolakan permintaan." />
            <FeatureItem icon={ShieldCheckIcon} name="Panel Admin" description="Antarmuka khusus untuk admin mengelola pengguna (melihat detail, mungkin menonaktifkan), mengelola donasi (melihat semua, mungkin menghapus), dan mengelola lencana." />
          </ul>
        </section>

      </div>
    </div>
  );
}

export default TechnicalOverviewPage; 