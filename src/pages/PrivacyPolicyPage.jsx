import React, { useState, useEffect } from 'react';
import {
  InformationCircleIcon, ArrowUpIcon, DocumentTextIcon, CogIcon, ShieldCheckIcon,
  UserGroupIcon, ScaleIcon, QuestionMarkCircleIcon, ChatBubbleLeftRightIcon, ArrowDownTrayIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

function PrivacyPolicyPage() {
  const sections = [
    { id: 'informasi-dikumpulkan', title: '1. Informasi yang Kami Kumpulkan', icon: DocumentTextIcon },
    { id: 'penggunaan-informasi', title: '2. Penggunaan Informasi Anda', icon: CogIcon },
    { id: 'pengungkapan-informasi', title: '3. Pengungkapan Informasi Anda', icon: UserGroupIcon },
    { id: 'keamanan-informasi', title: '4. Keamanan Informasi Anda', icon: ShieldCheckIcon },
    { id: 'hak-anda', title: '5. Hak Anda Terkait Informasi Pribadi', icon: ScaleIcon },
    { id: 'kebijakan-anak', title: '6. Kebijakan untuk Anak-Anak', icon: QuestionMarkCircleIcon },
    { id: 'perubahan-kebijakan', title: '7. Perubahan pada Kebijakan Privasi Ini', icon: ArrowPathIcon },
    { id: 'hubungi-kami', title: '8. Hubungi Kami', icon: ChatBubbleLeftRightIcon },
  ];

  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-emerald-600 mb-4">
        Kebijakan Privasi
      </h1>

      <p className="text-sm text-center text-gray-500 mb-6">
        Terakhir diperbarui: 25 April 2025
      </p>

      <div className="text-center mb-10">
        <a
          href="/placeholder-privacy-policy.pdf"
          download
          className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Unduh Kebijakan (PDF)
        </a>
      </div>

      <div className="lg:flex lg:gap-12">

        <aside className="lg:w-1/3 mb-12 lg:mb-0 lg:sticky lg:top-24 self-start">
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daftar Isi</h2>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex items-center gap-2 text-emerald-600 hover:text-emerald-800 hover:underline transition-colors text-sm">
                    {React.createElement(section.icon, { className: "h-4 w-4 flex-shrink-0" })}
                    {section.title.substring(3)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="lg:w-2/3">
          <div className="space-y-8 text-gray-700 leading-relaxed">
            <section>
              <p className="mb-4">
                Selamat datang di Kebijakan Privasi DonasiBerkat. Kami menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, mengungkapkan, dan menjaga informasi Anda saat Anda mengunjungi situs web kami <strong className="font-semibold text-gray-800">donasiberkat.id</strong>, termasuk layanan lain yang terkait atau terhubung dengannya (secara kolektif disebut "Platform"). Harap baca kebijakan privasi ini dengan cermat. Jika Anda tidak setuju dengan ketentuan kebijakan privasi ini, mohon jangan mengakses Platform.
              </p>
              <blockquote className="mt-4 mb-4 pl-4 py-2 border-l-4 border-emerald-300 bg-emerald-50 text-emerald-900 italic">
                "Platform" mengacu pada situs web kami <strong className="font-semibold">donasiberkat.id</strong>, serta layanan lain yang terkait atau terhubung dengannya.
              </blockquote>
              <p>
                Harap baca kebijakan privasi ini dengan cermat. Jika Anda tidak setuju dengan ketentuan kebijakan privasi ini, mohon jangan mengakses Platform.
              </p>
            </section>

            <section id={sections[0].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[0].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[0].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Bagian ini menjelaskan jenis data yang kami kumpulkan, termasuk data yang Anda berikan langsung dan data yang terkumpul otomatis saat Anda menggunakan platform.</span>
              </div>
              <p className="mb-4">
                Kami dapat mengumpulkan informasi tentang Anda dalam berbagai cara. Informasi yang dapat kami kumpulkan di Platform meliputi:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-3">
                <li>
                  <strong className="font-semibold text-gray-800">Data Pribadi:</strong> Informasi pengenal pribadi, seperti nama, alamat email, nomor telepon, dan informasi kontak lainnya yang Anda berikan secara sukarela kepada kami saat mendaftar di Platform atau saat memilih untuk berpartisipasi dalam berbagai aktivitas yang terkait dengan Platform, seperti obrolan online dan papan pesan.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Data Turunan:</strong> Informasi yang dikumpulkan server kami secara otomatis saat Anda mengakses Platform, seperti alamat IP Anda, jenis browser Anda, sistem operasi Anda, waktu akses Anda, dan halaman yang telah Anda lihat secara langsung sebelum dan sesudah mengakses Platform.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Data Seluler:</strong> Informasi perangkat, seperti ID perangkat seluler, model, dan pabrikan Anda, serta informasi tentang lokasi perangkat Anda, jika Anda mengakses Platform dari perangkat seluler.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Data Pihak Ketiga:</strong> Informasi dari pihak ketiga, seperti informasi pribadi atau teman jaringan, jika Anda menghubungkan akun Anda ke pihak ketiga dan memberikan izin kepada Platform untuk mengakses informasi ini.
                </li>
              </ul>
            </section>

            <section id={sections[1].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[1].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[1].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Di sini kami menjelaskan bagaimana kami menggunakan informasi yang dikumpulkan untuk mengoperasikan platform, berkomunikasi dengan Anda, dan meningkatkan layanan.</span>
              </div>
              <p className="mb-4">
                Memiliki informasi yang akurat tentang Anda memungkinkan kami untuk memberikan Anda pengalaman yang lancar, efisien, dan disesuaikan. Secara khusus, kami dapat menggunakan informasi yang dikumpulkan tentang Anda melalui Platform untuk:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-3">
                <li>Membuat dan mengelola akun Anda.</li>
                <li>Memproses donasi dan permintaan Anda.</li>
                <li>Memfasilitasi komunikasi antar pengguna.</li>
                <li>Mengirimkan email kepada Anda mengenai akun atau pesanan Anda.</li>
                <li>Meningkatkan efisiensi dan pengoperasian Platform.</li>
                <li>Memantau dan menganalisis penggunaan dan tren untuk meningkatkan pengalaman Anda dengan Platform.</li>
                <li>Memberi tahu Anda tentang pembaruan pada Platform.</li>
                <li>Menawarkan produk, layanan, dan/atau rekomendasi baru kepada Anda.</li>
                <li>Melakukan aktivitas bisnis lainnya sesuai kebutuhan.</li>
                <li>Mencegah transaksi penipuan, memantau pencurian, dan melindungi dari aktivitas kriminal.</li>
                <li>Meminta umpan balik dan menghubungi Anda tentang penggunaan Platform oleh Anda.</li>
                <li>Menyelesaikan sengketa dan memecahkan masalah.</li>
                <li>Menanggapi permintaan produk dan layanan pelanggan.</li>
                <li>Mengirimkan buletin kepada Anda.</li>
                <li>Meminta dukungan untuk Platform.</li>
              </ul>
            </section>

            <section id={sections[2].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[2].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[2].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Bagian ini menguraikan kapan dan kepada siapa kami mungkin membagikan informasi Anda, seperti untuk mematuhi hukum atau dengan penyedia layanan pihak ketiga.</span>
              </div>
              <p className="mb-4">
                Kami dapat membagikan informasi yang telah kami kumpulkan tentang Anda dalam situasi tertentu. Informasi Anda dapat diungkapkan sebagai berikut:
              </p>
              <ul className="list-disc list-outside ml-6 space-y-3">
                <li>
                  <strong className="font-semibold text-gray-800">Oleh Hukum atau untuk Melindungi Hak:</strong> Jika kami yakin pelepasan informasi tentang Anda diperlukan untuk menanggapi proses hukum, untuk menyelidiki atau memperbaiki potensi pelanggaran kebijakan kami, atau untuk melindungi hak, properti, dan keselamatan orang lain, kami dapat membagikan informasi Anda sebagaimana diizinkan atau diharuskan oleh hukum, aturan, atau peraturan yang berlaku.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Penyedia Layanan Pihak Ketiga:</strong> Kami dapat membagikan informasi Anda dengan pihak ketiga yang melakukan layanan untuk kami atau atas nama kami, termasuk pemrosesan pembayaran, analisis data, pengiriman email, layanan hosting, layanan pelanggan, dan bantuan pemasaran.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Komunikasi Pemasaran:</strong> Dengan persetujuan Anda, atau dengan kesempatan bagi Anda untuk menarik persetujuan, kami dapat membagikan informasi Anda dengan pihak ketiga untuk tujuan pemasaran, sebagaimana diizinkan oleh hukum.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Interaksi Pengguna Lain:</strong> Jika Anda berinteraksi dengan pengguna lain dari Platform, pengguna tersebut dapat melihat nama Anda, foto profil, dan deskripsi aktivitas Anda, termasuk mengirim undangan ke pengguna lain, mengobrol dengan pengguna lain, menyukai postingan, mengikuti blog.
                </li>
                <li>
                  <strong className="font-semibold text-gray-800">Transfer Bisnis:</strong> Kami dapat membagikan atau mentransfer informasi Anda sehubungan dengan, atau selama negosiasi, merger, penjualan aset perusahaan, pembiayaan, atau akuisisi semua atau sebagian dari bisnis kami ke perusahaan lain.
                </li>
              </ul>
            </section>

            <section id={sections[3].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[3].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[3].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Kami menjelaskan langkah-langkah keamanan yang kami ambil untuk melindungi data Anda, meskipun tidak ada sistem yang sepenuhnya aman.</span>
              </div>
              <p>
                Kami menggunakan langkah-langkah keamanan administratif, teknis, dan fisik untuk membantu melindungi informasi pribadi Anda. Meskipun kami telah mengambil langkah-langkah yang wajar untuk mengamankan informasi pribadi yang Anda berikan kepada kami, perlu diketahui bahwa terlepas dari upaya kami, tidak ada langkah keamanan yang sempurna atau tidak dapat ditembus, dan tidak ada metode transmisi data yang dapat dijamin terhadap intersepsi atau jenis penyalahgunaan lainnya. Informasi apa pun yang diungkapkan secara online rentan terhadap intersepsi dan penyalahgunaan oleh pihak yang tidak berwenang. Oleh karena itu, kami tidak dapat menjamin keamanan penuh jika Anda memberikan informasi pribadi.
              </p>
            </section>

            <section id={sections[4].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[4].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[4].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Anda memiliki hak terkait data pribadi Anda, seperti hak akses atau penghapusan. Hubungi kami untuk menggunakan hak ini.</span>
              </div>
              <p className="mb-4">
                Anda memiliki hak tertentu terkait informasi pribadi Anda, termasuk hak untuk mengakses, memperbaiki, atau menghapus data pribadi Anda yang kami miliki. Anda juga mungkin memiliki hak untuk membatasi atau menolak pemrosesan tertentu.
              </p>
              <p>
                Untuk menggunakan hak-hak ini, silakan hubungi kami menggunakan detail kontak yang disediakan di bawah ini. Kami akan menanggapi permintaan Anda sesuai dengan hukum yang berlaku.
              </p>
            </section>

            <section id={sections[5].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[5].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[5].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Platform kami tidak ditujukan untuk anak di bawah 13 tahun.</span>
              </div>
              <p>
                Kami tidak secara sadar meminta informasi dari atau memasarkan kepada anak-anak di bawah usia 13 tahun. Jika Anda mengetahui adanya data yang kami kumpulkan dari anak-anak di bawah usia 13 tahun, silakan hubungi kami menggunakan informasi kontak yang disediakan di bawah ini.
              </p>
            </section>

            <section id={sections[6].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[6].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[6].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Kami mungkin memperbarui kebijakan ini. Periksa tanggal "Terakhir diperbarui" untuk versi terbaru.</span>
              </div>
              <p>
                Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Versi yang diperbarui akan ditandai dengan tanggal "Terakhir diperbarui" yang diperbarui dan versi yang diperbarui akan berlaku segera setelah dapat diakses. Jika kami membuat perubahan material pada Kebijakan Privasi ini, kami dapat memberi tahu Anda baik dengan memposting pemberitahuan tentang perubahan tersebut secara mencolok atau dengan langsung mengirimi Anda pemberitahuan. Kami mendorong Anda untuk meninjau Kebijakan Privasi ini secara berkala untuk tetap mendapat informasi tentang bagaimana kami melindungi informasi Anda.
              </p>
            </section>

            <section id={sections[7].id} className="scroll-mt-24">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[7].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[7].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Cara menghubungi kami jika Anda memiliki pertanyaan tentang kebijakan privasi ini.</span>
              </div>
              <p className="mb-4">
                Jika Anda memiliki pertanyaan atau komentar tentang Kebijakan Privasi ini, silakan hubungi kami di:
              </p>
              <div className="mt-4 p-6 bg-emerald-50 border border-emerald-200 rounded-lg text-gray-800 shadow-sm">
                <p className="font-semibold">DonasiBerkat</p>
                <p>Jl Siliwangi 24</p>
                <p>Email: <a href="mailto:donasiberkat@gmail.com" className="text-emerald-600 hover:text-emerald-700 hover:underline">donasiberkat@gmail.com</a></p>
              </div>
            </section>

          </div>
        </main>
      </div>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-200 hover:scale-110"
          aria-label="Kembali ke atas"
          title="Kembali ke atas"
        >
          <ArrowUpIcon className="h-6 w-6" />
        </button>
      )}

    </div>
  );
}

export default PrivacyPolicyPage; 