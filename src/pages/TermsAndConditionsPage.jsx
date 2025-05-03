import React, { useState, useEffect, useRef } from 'react';
import {
  InformationCircleIcon, DocumentCheckIcon, UserCircleIcon, ShieldExclamationIcon,
  CodeBracketIcon, ScaleIcon, NoSymbolIcon, ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon, ArrowPathIcon, ArrowUpIcon, ArrowDownTrayIcon,
  StopCircleIcon, XCircleIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

function TermsAndConditionsPage() {
  const sections = [
    { id: 'persetujuan', title: '1. Persetujuan terhadap Ketentuan', icon: DocumentCheckIcon },
    { id: 'akun-pengguna', title: '2. Akun Pengguna', icon: UserCircleIcon },
    { id: 'aktivitas-dilarang', title: '3. Aktivitas yang Dilarang', icon: NoSymbolIcon },
    { id: 'konten-pengguna', title: '4. Konten Buatan Pengguna', icon: CodeBracketIcon },
    { id: 'kekayaan-intelektual', title: '5. Kekayaan Intelektual', icon: ShieldExclamationIcon },
    { id: 'penafian', title: '6. Penafian (Disclaimer)', icon: ExclamationTriangleIcon },
    { id: 'batasan-tanggungjawab', title: '7. Batasan Tanggung Jawab', icon: ScaleIcon },
    { id: 'penghentian', title: '8. Penghentian', icon: StopCircleIcon },
    { id: 'hukum-penyelesaian', title: '9. Hukum yang Mengatur & Penyelesaian Sengketa', icon: ScaleIcon },
    { id: 'perubahan-ketentuan', title: '10. Perubahan Ketentuan', icon: ArrowPathIcon },
    { id: 'kontak', title: '11. Kontak Kami', icon: ChatBubbleLeftRightIcon },
  ];

  const [showBackToTop, setShowBackToTop] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(sections[0].id);

  const sectionRefs = useRef({});
  sections.forEach((section) => {
    sectionRefs.current[section.id] = React.createRef();
  });

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-25% 0px -75% 0px',
      threshold: 0
    };

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      Object.values(sectionRefs.current).forEach(ref => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const KeyTerm = ({ children }) => (
    <strong className="font-semibold text-emerald-700">{children}</strong>
  );

  const UserActionParagraph = ({ children }) => (
    <div className="flex items-start gap-2 mt-3">
      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <p className="flex-1">{children}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-emerald-600 mb-4">
        Syarat & Ketentuan
      </h1>

      <p className="text-sm text-center text-gray-500 mb-2">
        Tanggal Efektif: 25 April 2025
      </p>
      <p className="text-xs text-center text-gray-500 mb-6 italic">
        Harap tinjau Ketentuan ini secara berkala. Penggunaan Anda atas Platform setelah Tanggal Efektif menunjukkan penerimaan Anda terhadap ketentuan yang diperbarui.
      </p>

      <div className="text-center mb-10">
        <a
          href="/placeholder-terms-and-conditions.pdf"
          download
          className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-300 text-sm font-medium rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
          Unduh Ketentuan (PDF)
        </a>
      </div>

      <div className="lg:flex lg:gap-12">

        <aside className="lg:w-1/3 mb-12 lg:mb-0 lg:sticky lg:top-24 self-start">
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Daftar Isi</h2>
            <ul className="space-y-1.5">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className={`flex items-center gap-2 p-1 rounded transition-colors duration-150 text-sm ${
                      activeSectionId === section.id
                        ? 'font-semibold text-emerald-700 bg-emerald-100'
                        : 'text-gray-600 hover:text-emerald-700 hover:bg-emerald-50'
                    }`}
                  >
                    {React.createElement(section.icon, { className: `h-4 w-4 flex-shrink-0 ${activeSectionId === section.id ? 'text-emerald-600' : 'text-gray-400'}` })}
                    {section.title.substring(section.title.indexOf(' ') + 1)}
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
                Selamat datang di DonasiBerkat! <KeyTerm>Syarat dan Ketentuan</KeyTerm> ("Ketentuan") ini mengatur akses Anda ke dan penggunaan platform kami, termasuk situs web <strong className="font-semibold text-gray-800">donasiberkat.id</strong> dan layanan terkait ("<KeyTerm>Platform</KeyTerm>").
              </p>
              <blockquote className="mt-4 mb-4 pl-4 py-2 border-l-4 border-emerald-300 bg-emerald-50 text-emerald-900 italic">
                 Dengan mengakses atau menggunakan <KeyTerm>Platform</KeyTerm>, Anda setuju untuk terikat oleh <KeyTerm>Ketentuan</KeyTerm> ini.
              </blockquote>
              <p>
                 Jika Anda tidak menyetujui <KeyTerm>Ketentuan</KeyTerm> ini, Anda tidak boleh mengakses atau menggunakan <KeyTerm>Platform</KeyTerm>.
              </p>
            </section>

            <section id={sections[0].id} ref={sectionRefs.current[sections[0].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[0].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[0].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Dengan menggunakan platform kami, Anda menyetujui syarat dan ketentuan ini.</span>
              </div>
              <p>
                Ketentuan ini merupakan perjanjian yang mengikat secara hukum antara Anda, baik secara pribadi maupun atas nama entitas ("Anda") dan DonasiBerkat ("Kami", "Kita", atau "Milik Kami"), mengenai akses Anda ke dan penggunaan Platform. Anda mengakui bahwa Anda telah membaca, memahami, dan setuju untuk terikat oleh semua Ketentuan ini.
              </p>
            </section>

            <section id={sections[1].id} ref={sectionRefs.current[sections[1].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[1].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[1].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Anda bertanggung jawab untuk menjaga keamanan akun Anda dan memberikan informasi yang akurat.</span>
              </div>
              <UserActionParagraph>
                Anda mungkin diharuskan mendaftar untuk menggunakan bagian tertentu dari Platform. Anda setuju untuk menjaga kerahasiaan kata sandi Anda dan akan bertanggung jawab atas semua penggunaan akun dan kata sandi Anda.
              </UserActionParagraph>
              <p>
                Kami berhak untuk menghapus, mengambil kembali, atau mengubah nama pengguna yang Anda pilih jika kami menentukan, atas kebijakan kami sendiri, bahwa nama pengguna tersebut tidak pantas, cabul, atau tidak menyenangkan.
              </p>
              <UserActionParagraph>
                Anda setuju untuk memberikan informasi pendaftaran yang terkini, lengkap, dan akurat tentang diri Anda. Anda selanjutnya setuju untuk menjaga keakuratan informasi tersebut dan segera memperbarui informasi pendaftaran tersebut jika diperlukan.
              </UserActionParagraph>
            </section>

            <section id={sections[2].id} ref={sectionRefs.current[sections[2].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[2].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[2].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Gunakan platform secara bertanggung jawab dan jangan melakukan aktivitas ilegal, menipu, atau berbahaya.</span>
              </div>
              <p className="mb-4">
                Anda tidak boleh mengakses atau menggunakan Platform untuk tujuan apa pun selain yang kami sediakan Platformnya. Platform tidak boleh digunakan sehubungan dengan upaya komersial apa pun kecuali yang secara khusus didukung atau disetujui oleh kami.
              </p>
              <p>Sebagai pengguna Platform, Anda setuju untuk tidak:</p>
              <ul className="mt-4 space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                {[
                  "Melakukan scraping, pengumpulan data, atau ekstraksi data secara otomatis dari Platform tanpa izin tertulis.",
                  "Menyamar sebagai pengguna lain atau memberikan informasi palsu mengenai identitas Anda atau kondisi barang yang didonasikan.",
                  "Menggunakan fitur komunikasi Platform untuk mengirim spam, pesan yang tidak diminta, atau melecehkan pengguna lain.",
                  "Mengganggu, merusak, atau membuat beban yang tidak semestinya pada Platform atau infrastrukturnya.",
                  "Mengunggah atau mengirimkan virus, malware, atau kode berbahaya lainnya.",
                  "Mempromosikan aktivitas ilegal, skema piramida, atau perjudian.",
                  "Memposting konten yang bersifat cabul, memfitnah, mengancam, melanggar hak privasi/publisitas, atau mengandung ujaran kebencian.",
                  "Menggunakan Platform untuk tujuan komersial murni (misalnya, menjual barang alih-alih mendonasikan) tanpa persetujuan kami.",
                  "Mencoba melewati tindakan keamanan apa pun dari Platform.",
                  "Memberikan informasi yang secara sadar salah atau menyesatkan tentang barang yang Anda donasikan atau minta."
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-900">
                    <XCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section id={sections[3].id} ref={sectionRefs.current[sections[3].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[3].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[3].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Anda bertanggung jawab atas konten yang Anda posting dan memberikan kami lisensi untuk menggunakannya sehubungan dengan platform.</span>
              </div>
              <p className="mb-4">
                Platform dapat mengundang Anda untuk mengobrol, berkontribusi, atau berpartisipasi dalam blog, papan pesan, forum online, dan fungsionalitas lainnya, dan dapat memberi Anda kesempatan untuk membuat, mengirimkan, memposting, menampilkan, mengirimkan, melakukan, menerbitkan, mendistribusikan, atau menyiarkan konten dan materi kepada kami atau di Platform, termasuk namun tidak terbatas pada teks, tulisan, video, audio, foto, grafik, komentar, saran, atau informasi pribadi atau materi lainnya (secara kolektif, "Konten").
              </p>
              <UserActionParagraph>
                Saat Anda membuat atau menyediakan <KeyTerm>Konten</KeyTerm> apa pun, Anda dengan ini menyatakan dan menjamin bahwa: (a) Anda adalah pencipta dan pemilik atau memiliki lisensi, hak, persetujuan, rilis, dan izin yang diperlukan untuk menggunakan dan memberi wewenang kepada kami, <KeyTerm>Platform</KeyTerm>, dan pengguna lain dari <KeyTerm>Platform</KeyTerm> untuk menggunakan <KeyTerm>Konten</KeyTerm> Anda dengan cara apa pun yang dimaksud oleh <KeyTerm>Platform</KeyTerm> dan <KeyTerm>Ketentuan</KeyTerm> ini; (b) <KeyTerm>Konten</KeyTerm> Anda tidak dan tidak akan melanggar hak milik pihak ketiga mana pun; (c) <KeyTerm>Konten</KeyTerm> Anda akurat, tidak menipu atau menyesatkan; dan (d) <KeyTerm>Konten</KeyTerm> Anda tidak melanggar hukum yang berlaku atau <KeyTerm>Ketentuan</KeyTerm> ini.
              </UserActionParagraph>
              <p className="mt-3">
                Dengan memposting <KeyTerm>Konten</KeyTerm> Anda ke bagian mana pun dari <KeyTerm>Platform</KeyTerm>, Anda secara otomatis memberikan kepada kami lisensi non-eksklusif, dapat dialihkan, sublisensikan, bebas royalti, dibayar penuh, berlaku selamanya, dan berlaku di seluruh dunia untuk menggunakan, menyalin, mereproduksi, memproses, mengadaptasi, memodifikasi, menerbitkan, mengirimkan, menampilkan, dan mendistribusikan <KeyTerm>Konten</KeyTerm> tersebut dalam media atau metode distribusi apa pun yang sekarang dikenal atau kemudian dikembangkan semata-mata untuk tujuan mengoperasikan, mengembangkan, menyediakan, mempromosikan (misalnya, menampilkan donasi unggulan), dan meningkatkan <KeyTerm>Platform</KeyTerm> serta meneliti dan mengembangkan produk dan layanan baru. Kami tidak mengklaim kepemilikan atas <KeyTerm>Konten</KeyTerm> Anda.
              </p>
            </section>

            <section id={sections[4].id} ref={sectionRefs.current[sections[4].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[4].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[4].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Platform dan kontennya (kecuali konten pengguna) adalah milik kami dan dilindungi oleh hukum kekayaan intelektual.</span>
              </div>
              <p>
                Kecuali dinyatakan lain, Platform adalah properti milik kami dan semua kode sumber, basis data, fungsionalitas, perangkat lunak, desain situs web, audio, video, teks, foto, dan grafik di Platform (secara kolektif, "Konten Kami") serta merek dagang, merek layanan, dan logo yang terkandung di dalamnya ("Merek") dimiliki atau dikendalikan oleh kami atau dilisensikan kepada kami, dan dilindungi oleh undang-undang hak cipta dan merek dagang serta berbagai hak kekayaan intelektual lainnya dan undang-undang persaingan tidak sehat di Indonesia dan konvensi internasional. <strong className="font-semibold text-gray-800">[Sebutkan merek dagang terdaftar spesifik jika ada.]</strong> Kecuali secara tegas ditentukan dalam <KeyTerm>Ketentuan</KeyTerm> ini, tidak ada bagian dari Platform dan tidak ada <KeyTerm>Konten Kami</KeyTerm> atau Merek yang boleh disalin, direproduksi, diagregasi, diterbitkan ulang, diunggah, diposting, ditampilkan secara publik, dikodekan, diterjemahkan, ditransmisikan, didistribusikan, dijual, dilisensikan, atau dieksploitasi untuk tujuan komersial apa pun, tanpa izin tertulis kami sebelumnya.
              </p>
            </section>

            <section id={sections[5].id} ref={sectionRefs.current[sections[5].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[5].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[5].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Platform disediakan "sebagaimana adanya" tanpa jaminan. Kami tidak bertanggung jawab atas interaksi antar pengguna.</span>
              </div>
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900 font-medium text-sm space-y-3 leading-relaxed">
                 <p>PLATFORM DISEDIAKAN ATAS DASAR SEBAGAIMANA ADANYA DAN SEBAGAIMANA TERSEDIA. ANDA SETUJU BAHWA PENGGUNAAN <KeyTerm>PLATFORM</KeyTerm> OLEH ANDA ADALAH RISIKO ANDA SENDIRI. SEJAUH DIIZINKAN OLEH HUKUM, KAMI MENAFIKAN SEMUA JAMINAN, TERSURAT MAUPUN TERSIRAT, SEHUBUNGAN DENGAN <KeyTerm>PLATFORM</KeyTerm> DAN PENGGUNAANNYA OLEH ANDA, TERMASUK, TANPA BATASAN, JAMINAN TERSIRAT TENTANG KELAYAKAN UNTUK DIPERDAGANGKAN, KESESUAIAN UNTUK TUJUAN TERTENTU, DAN NON-PELANGGARAN.</p>
                 <p>KAMI TIDAK MEMBUAT JAMINAN ATAU PERNYATAAN TENTANG AKURASI ATAU KELENGKAPAN KONTEN <KeyTerm>PLATFORM</KeyTerm> ATAU KONTEN SITUS WEB APA PUN YANG TERKAIT DENGAN <KeyTerm>PLATFORM</KeyTerm> DAN KAMI TIDAK AKAN BERTANGGUNG JAWAB ATAU BERKEWAJIBAN ATAS (1) KESALAHAN, KETIDAKAKURATAN KONTEN DAN MATERI, (2) CEDERA PRIBADI ATAU KERUSAKAN PROPERTI, DALAM BENTUK APA PUN, AKIBAT AKSES ANDA KE DAN PENGGUNAAN <KeyTerm>PLATFORM</KeyTerm>, (3) AKSES TIDAK SAH KE ATAU PENGGUNAAN SERVER AMAN KAMI DAN/ATAU SETIAP DAN SEMUA INFORMASI PRIBADI DAN/ATAU INFORMASI KEUANGAN YANG DISIMPAN DI DALAMNYA, (4) SETIAP GANGGUAN ATAU PENGHENTIAN TRANSMISI KE ATAU DARI <KeyTerm>PLATFORM</KeyTerm>, (5) SETIAP BUG, VIRUS, TROJAN HORSE, ATAU SEJENISNYA YANG MUNGKIN DIKIRIMKAN KE ATAU MELALUI <KeyTerm>PLATFORM</KeyTerm> OLEH PIHAK KETIGA MANA PUN, DAN/ATAU (6) SETIAP KESALAHAN ATAU PENGHILANGAN DALAM KONTEN DAN MATERI APA PUN ATAU ATAS KEHILANGAN ATAU KERUSAKAN APA PUN YANG TIMBUL AKIBAT PENGGUNAAN KONTEN APA PUN YANG DIPOSTING, DIKIRIM, ATAU DISEDIAKAN MELALUI <KeyTerm>PLATFORM</KeyTerm>.</p>
                 <p>DONASIBERKAT BERTINDAK SEBAGAI FASILITATOR UNTUK MENGHUBUNGKAN PENDONOR DAN PENERIMA. KAMI TIDAK MEMERIKSA, MENJAMIN, ATAU MEMBERIKAN JAMINAN APA PUN MENGENAI KONDISI, KUALITAS, KEAMANAN, ATAU KEASLIAN BARANG YANG DIDONASIKAN. SEMUA TRANSAKSI DAN INTERAKSI ANTARA PENGGUNA DILAKUKAN ATAS RISIKO PENGGUNA SENDIRI. KAMI TIDAK BERTANGGUNG JAWAB ATAS SENGKETA, KERUSAKAN, ATAU KEHILANGAN YANG TIMBUL DARI INTERAKSI ANTAR PENGGUNA ATAU DARI KONDISI BARANG YANG DIDONASIKAN.</p>
              </div>
            </section>

            <section id={sections[6].id} ref={sectionRefs.current[sections[6].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[6].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[6].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Tanggung jawab kami kepada Anda terbatas sejauh diizinkan oleh hukum.</span>
              </div>
               <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-900 font-medium text-sm leading-relaxed">
                  <p>DALAM KEADAAN APA PUN KAMI ATAU DIREKTUR, KARYAWAN, ATAU AGEN KAMI TIDAK AKAN BERTANGGUNG JAWAB KEPADA ANDA ATAU PIHAK KETIGA MANA PUN ATAS KERUSAKAN LANGSUNG, TIDAK LANGSUNG, KONSEKUENSIAL, CONTOH, INSIDENTAL, KHUSUS, ATAU HUKUMAN, TERMASUK KEHILANGAN KEUNTUNGAN, KEHILANGAN PENDAPATAN, KEHILANGAN DATA, ATAU KERUSAKAN LAINNYA YANG TIMBUL DARI PENGGUNAAN <KeyTerm>PLATFORM</KeyTerm> OLEH ANDA, BAHKAN JIKA KAMI TELAH DIBERITAHU TENTANG KEMUNGKINAN KERUSAKAN TERSEBUT. WALAUPUN ADA HAL YANG BERTENTANGAN YANG TERCANTUM DI SINI, TANGGUNG JAWAB KAMI KEPADA ANDA ATAS PENYEBAB APA PUN DAN TANPA MEMPERHATIKAN BENTUK TINDAKANNYA, AKAN SETIAP SAAT TERBATAS PADA JUMLAH YANG DIBAYARKAN, JIKA ADA, OLEH ANDA KEPADA KAMI SELAMA PERIODE [Tentukan Periode Waktu, mis., ENAM (6)] BULAN SEBELUM PENYEBAB TINDAKAN APA PUN TIMBUL. HUKUM NEGARA TERTENTU TIDAK MENGIZINKAN PEMBATASAN PADA JAMINAN TERSIRAT ATAU PENGECUALIAN ATAU PEMBATASAN KERUSAKAN TERTENTU. JIKA HUKUM INI BERLAKU UNTUK ANDA, BEBERAPA ATAU SEMUA PENAFIAN ATAU PEMBATASAN DI ATAS MUNGKIN TIDAK BERLAKU UNTUK ANDA, DAN ANDA MUNGKIN MEMILIKI HAK TAMBAHAN.</p>
               </div>
            </section>

            <section id={sections[7].id} ref={sectionRefs.current[sections[7].id]} className="scroll-mt-24 pt-4 -mt-4">
               <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                 {React.createElement(sections[7].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                 {sections[7].title}
               </h2>
               <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                 <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                 <span className="italic font-medium">Ringkasan:</span>
                 <span className="ml-1">Kami dapat menangguhkan atau menghentikan hak Anda untuk menggunakan Platform kapan saja karena alasan apa pun atas kebijakan kami sendiri, tanpa pemberitahuan atau tanggung jawab kepada Anda, termasuk tanpa batasan atas pelanggaran apa pun terhadap pernyataan, jaminan, atau perjanjian apa pun yang terkandung dalam Ketentuan ini atau hukum atau peraturan yang berlaku. Jika kami menghentikan atau menangguhkan akun Anda karena alasan apa pun, Anda dilarang mendaftar dan membuat akun baru atas nama Anda, nama palsu atau pinjaman, atau nama pihak ketiga mana pun, meskipun Anda mungkin bertindak atas nama pihak ketiga tersebut. Selain menghentikan atau menangguhkan akun Anda, kami berhak mengambil tindakan hukum yang sesuai, termasuk tanpa batasan mengejar ganti rugi perdata, pidana, dan putusan sela.</span>
               </div>
               <p className="mb-4">
                 Kami dapat menangguhkan atau menghentikan hak Anda...
               </p>
               <hr className="my-4 border-gray-200" />
               <UserActionParagraph>
                 Anda dapat menghentikan akun Anda kapan saja...
               </UserActionParagraph>
            </section>

            <section id={sections[8].id} ref={sectionRefs.current[sections[8].id]} className="scroll-mt-24 pt-4 -mt-4">
               <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                 {React.createElement(sections[8].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                 {sections[8].title}
               </h2>
               <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                 <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                 <span className="italic font-medium">Ringkasan:</span>
                 <span className="ml-1">Ketentuan ini diatur oleh hukum Republik Indonesia, tanpa memperhatikan pertentangan prinsip hukumnya.</span>
               </div>
               <p className="mb-4">
                 <KeyTerm>Ketentuan</KeyTerm> ini dan penggunaan <KeyTerm>Platform</KeyTerm> oleh Anda diatur oleh...
               </p>
                <hr className="my-4 border-gray-200" />
               <p>
                 Untuk mempercepat penyelesaian dan mengendalikan biaya sengketa...
                 <strong className="block mt-2 font-semibold text-gray-800">[!! PERHATIAN: ...]</strong>
               </p>
            </section>

            <section id={sections[9].id} ref={sectionRefs.current[sections[9].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[9].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[9].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Kami berhak, atas kebijakan kami sendiri, untuk melakukan perubahan atau modifikasi pada Ketentuan ini kapan saja dan untuk alasan apa pun.</span>
              </div>
              <p>
                Kami akan memberi tahu Anda tentang perubahan material apa pun dengan memperbarui tanggal "Tanggal Efektif" dari Ketentuan ini, dan Anda melepaskan hak apa pun untuk menerima pemberitahuan spesifik tentang setiap perubahan tersebut kecuali diwajibkan oleh hukum. Merupakan tanggung jawab Anda untuk secara berkala meninjau Ketentuan ini untuk tetap mendapat informasi tentang pembaruan. Anda akan tunduk pada, dan akan dianggap telah mengetahui dan menerima, perubahan dalam Ketentuan yang direvisi oleh penggunaan berkelanjutan Anda atas Platform setelah tanggal Ketentuan yang direvisi tersebut diposting.
                Kami akan memberi tahu Anda tentang perubahan apa pun dengan memperbarui tanggal "Tanggal Efektif" dari Ketentuan ini... [Jelaskan bagaimana pengguna akan diberitahu atau dianggap telah diberitahu]. Anda akan tunduk pada, dan akan dianggap telah mengetahui dan menerima, perubahan dalam Ketentuan yang direvisi oleh penggunaan berkelanjutan Anda atas Platform setelah tanggal Ketentuan yang direvisi tersebut diposting.
              </p>
            </section>

            <section id={sections[10].id} ref={sectionRefs.current[sections[10].id]} className="scroll-mt-24 pt-4 -mt-4">
              <h2 className="flex items-center text-2xl font-semibold text-gray-800 mt-10 mb-4 pb-2 border-b border-emerald-200">
                {React.createElement(sections[10].icon, { className: "h-6 w-6 mr-2 text-emerald-500" })}
                {sections[10].title}
              </h2>
              <div className="mt-1 mb-5 p-3 bg-blue-50 border-l-4 border-blue-300 text-sm text-blue-800 rounded-r-md shadow-sm">
                <InformationCircleIcon className="h-5 w-5 inline mr-1.5 align-text-bottom text-blue-500" />
                <span className="italic font-medium">Ringkasan:</span>
                <span className="ml-1">Hubungi kami jika Anda memiliki pertanyaan tentang ketentuan ini.</span>
              </div>
              <p className="mb-4">
                Untuk menyelesaikan keluhan mengenai Platform atau untuk menerima informasi lebih lanjut mengenai penggunaan Platform, silakan hubungi kami di:
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

export default TermsAndConditionsPage; 