import { useState, useMemo } from 'react';
import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon, QuestionMarkCircleIcon, GiftIcon, UserCircleIcon, CogIcon, EnvelopeIcon, MagnifyingGlassIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const faqData = [
  {
    category: 'Tentang DonasiBerkat',
    icon: QuestionMarkCircleIcon,
    questions: [
      {
        id: 'tentang-1',
        question: 'Apa itu DonasiBerkat?',
        answer: 'DonasiBerkat adalah platform online yang menghubungkan orang-orang yang ingin mendonasikan barang bekas layak pakai dengan mereka yang membutuhkan. Tujuan kami adalah memfasilitasi proses donasi barang agar lebih mudah, transparan, dan berdampak.',
      },
      {
        id: 'tentang-2',
        question: 'Apakah layanan ini gratis?',
        answer: 'Ya, penggunaan platform DonasiBerkat sepenuhnya gratis baik untuk pendonor maupun penerima donasi.',
      },
      {
        id: 'tentang-3',
        question: 'Bagaimana DonasiBerkat memastikan barang sampai ke tangan yang tepat?',
        answer: 'Kami menyediakan fitur chat dan sistem permintaan untuk memfasilitasi komunikasi langsung antara pendonor dan calon penerima. Pendonor memiliki kebebasan untuk memilih kepada siapa mereka ingin memberikan donasinya. Kami juga mendorong transparansi dan komunikasi yang baik antar pengguna.',
      },
    ],
  },
  {
    category: 'Untuk Pendonor',
    icon: GiftIcon,
    questions: [
      {
        id: 'pendonor-1',
        question: 'Bagaimana cara mendonasikan barang?',
        answer: `Untuk mendonasikan barang, ikuti langkah berikut:\n1.  **Daftar/Masuk:** Pastikan Anda sudah terdaftar dan masuk ke akun Anda.\n2.  **Buat Donasi:** Klik tombol "Buat Donasi" atau "Mulai Donasi Sekarang".\n3.  **Isi Detail:** Lengkapi informasi barang (judul, deskripsi, kategori, kondisi, lokasi).\n4.  **Unggah Foto:** Tambahkan foto barang yang jelas dari berbagai sudut.\n5.  **Terbitkan:** Publikasikan donasi Anda. Anda akan diberitahu jika ada permintaan.`,
      },
      {
        id: 'pendonor-2',
        question: 'Barang apa saja yang bisa didonasikan?',
        answer: 'Anda dapat mendonasikan berbagai macam barang bekas yang masih layak pakai, seperti pakaian, perabotan rumah tangga, buku, mainan anak, alat elektronik (yang masih berfungsi), dan lainnya. Pastikan barang dalam kondisi bersih dan fungsional.',
      },
      {
        id: 'pendonor-3',
        question: 'Apakah saya harus mengantar barangnya?',
        answer: 'Metode serah terima barang (diantar, diambil, atau bertemu di lokasi tertentu) disepakati langsung antara pendonor dan penerima melalui fitur chat. Anda bisa menentukan preferensi Anda di deskripsi donasi.',
      },
      {
        id: 'pendonor-4',
        question: 'Bagaimana cara memilih penerima donasi?',
        answer: 'Ketika seseorang mengajukan permintaan untuk donasi Anda, Anda akan menerima notifikasi. Anda dapat melihat profil pengguna yang meminta dan berkomunikasi melalui chat untuk menentukan apakah mereka adalah penerima yang tepat. Keputusan akhir ada di tangan Anda.',
      },
    ],
  },
  {
    category: 'Untuk Penerima',
    icon: UserCircleIcon,
    questions: [
      {
        id: 'penerima-1',
        question: 'Bagaimana cara mencari barang yang saya butuhkan?',
        answer: 'Gunakan fitur "Browse" atau "Cari Barang". Anda bisa memfilter berdasarkan kategori, lokasi, atau kata kunci untuk menemukan barang yang sesuai dengan kebutuhan Anda.',
      },
      {
        id: 'penerima-2',
        question: 'Bagaimana cara meminta barang donasi?',
        answer: `Untuk meminta barang donasi, ikuti langkah ini:\n1.  **Cari Barang:** Temukan barang yang Anda inginkan di halaman Browse.\n2.  **Lihat Detail:** Klik pada postingan donasi untuk membaca informasi lengkap.\n3.  **Ajukan Permintaan:** Jika tertarik, klik tombol "Ajukan Permintaan".\n4.  **(Opsional) Pesan:** Anda bisa menambahkan pesan singkat untuk pendonor.\n5.  **Tunggu Konfirmasi:** Pendonor akan meninjau permintaan Anda. Anda akan menerima notifikasi mengenai status permintaan (disetujui/ditolak).`,
      },
      {
        id: 'penerima-3',
        question: 'Apakah saya bisa meminta lebih dari satu barang?',
        answer: 'Ya, Anda bisa mengajukan permintaan untuk beberapa barang donasi yang berbeda dari pendonor yang berbeda pula. Namun, mohon ajukan permintaan secara bijak dan hanya untuk barang yang benar-benar Anda butuhkan.',
      },
    ],
  },
  {
    category: 'Akun & Teknis',
    icon: CogIcon,
    questions: [
      {
        id: 'akun-1',
        question: 'Bagaimana cara mengubah profil saya?',
        answer: 'Masuk ke akun Anda, klik ikon profil Anda di pojok kanan atas, lalu pilih "Edit Profile". Anda dapat memperbarui nama, foto profil, dan informasi kontak Anda di sana.',
      },
      {
        id: 'akun-2',
        question: 'Saya lupa kata sandi, bagaimana cara mengatasinya?',
        answer: 'Pada halaman login, klik tautan "Lupa Kata Sandi?". Masukkan alamat email yang terdaftar, dan kami akan mengirimkan instruksi untuk mereset kata sandi Anda.',
      },
      {
        id: 'akun-3',
        question: 'Bagaimana cara melaporkan pengguna atau donasi yang mencurigakan?',
        answer: 'Jika Anda menemukan aktivitas yang mencurigakan atau melanggar syarat dan ketentuan kami, silakan hubungi tim support kami melalui email di support@donasiberkat.id dengan menyertakan detail laporan Anda. Kami akan segera menindaklanjutinya.',
      },
    ],
  },
];

// Helper component to highlight search term
function HighlightedText({ text, highlight }) {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, 'gi');
  const parts = text.split(regex);

  // Handle potential empty strings from split
  const filteredParts = parts.filter(part => part !== '');

  return (
    <span>
      {filteredParts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 text-yellow-900 px-0.5 rounded-sm font-semibold">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}

function FAQPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredFaqData = useMemo(() => {
    if (!searchTerm.trim()) {
      return faqData;
    }

    const lowerCaseSearchTerm = searchTerm.trim().toLowerCase();

    return faqData
      .map(category => ({
        ...category,
        questions: category.questions.filter(
          item =>
            item.question.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.answer.toLowerCase().includes(lowerCaseSearchTerm)
        ),
      }))
      .filter(category => category.questions.length > 0);
  }, [searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  return (
    <div className="max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
      <h1 className="text-4xl md:text-5xl font-bold text-center text-emerald-600 mb-10">
        Pertanyaan Umum (FAQ)
      </h1>

      <div className="mb-12 relative">
        <input
          type="text"
          placeholder="Cari pertanyaan atau jawaban..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full px-4 py-3 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm transition-shadow focus:shadow-md"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      </div>

      <div className="space-y-12">
        {filteredFaqData.length > 0 ? (
          filteredFaqData.map((category) => (
            <div key={category.category}>
               <div className="flex items-center gap-3 mb-5 pb-3 border-b border-gray-200 group cursor-default">
                  {category.icon && <category.icon className="h-7 w-7 text-emerald-500 flex-shrink-0 transition-transform duration-200 group-hover:scale-110" />}
                  <h2 className="text-2xl font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">{category.category}</h2>
               </div>
               <div className="w-full space-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100/80 shadow-inner">
                  {category.questions.map((item) => (
                    <Disclosure key={item.id} as="div" className="bg-white rounded-lg shadow-sm border border-gray-200/80 overflow-hidden transition-shadow hover:shadow-md">
                      {({ open }) => (
                        <>
                          <Disclosure.Button className={`flex justify-between w-full px-5 py-4 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-emerald-500 focus-visible:ring-opacity-75 transition-colors duration-150 ${
                              open ? 'bg-emerald-100 text-emerald-900' : 'text-emerald-800 hover:bg-emerald-50'
                            }`}>
                            <span className="flex-1 pr-4 font-semibold">
                              <HighlightedText text={item.question} highlight={searchTerm} />
                            </span>
                            <ChevronUpIcon
                              className={`${
                                open ? 'transform rotate-180' : ''
                              } w-5 h-5 text-emerald-600 transition-transform duration-200 flex-shrink-0`}
                            />
                          </Disclosure.Button>
                          <Transition
                            enter="transition duration-150 ease-out"
                            enterFrom="transform scale-95 opacity-0"
                            enterTo="transform scale-100 opacity-100"
                            leave="transition duration-100 ease-out"
                            leaveFrom="transform scale-100 opacity-100"
                            leaveTo="transform scale-95 opacity-0"
                          >
                             <Disclosure.Panel className="px-5 pt-3 pb-5 text-sm text-gray-700 bg-white border-l-4 border-emerald-100 whitespace-pre-line">
                               <HighlightedText text={item.answer} highlight={searchTerm} />
                             </Disclosure.Panel>
                           </Transition>
                        </>
                      )}
                    </Disclosure>
                  ))}
                </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-16 px-6 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <ExclamationTriangleIcon className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <p className="text-lg font-semibold text-yellow-800">Tidak ada hasil yang cocok untuk "{searchTerm}"</p>
            <p className="text-sm mt-2 text-yellow-700">Silakan periksa ejaan Anda atau coba gunakan kata kunci yang lebih umum.</p>
          </div>
        )}
      </div>

       <div className="mt-20 text-center bg-gradient-to-br from-emerald-50 to-green-50 p-10 rounded-lg border border-emerald-200 shadow-sm">
         <h3 className="text-2xl font-semibold text-emerald-800 mb-4">Masih Punya Pertanyaan?</h3>
         <p className="text-gray-600 mb-6 max-w-md mx-auto">
           Tim support kami siap membantu Anda. Jangan ragu untuk menghubungi kami jika Anda tidak menemukan jawaban yang Anda cari.
         </p>
         <a
           href="mailto:support@donasiberkat.id"
           className="inline-flex items-center justify-center gap-2 px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-150 hover:shadow-md"
         >
           <EnvelopeIcon className="h-5 w-5"/>
           Hubungi Kami
         </a>
       </div>
    </div>
  );
}

export default FAQPage; 