import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { TagIcon, CubeTransparentIcon, MapPinIcon, CalendarDaysIcon, CheckBadgeIcon } from '@heroicons/react/24/outline'; // Contoh ikon

function DonationCard({ id, imageUrl, title, category, description, postedAt, location, condition, className = '' }) {

  const ImagePlaceholder = () => (
    <div className="aspect-video w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
        <CubeTransparentIcon className="h-12 w-12" />
        {/* <span className="text-gray-500 text-sm">No Image</span> */}
    </div>
  );

  // Fungsi format tanggal sederhana
  const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
    } catch (e) {
      console.error("Failed to format date:", e);
      return null; // Atau kembalikan string default
    }
  };

  const formattedDate = formatDate(postedAt);

  return (
    // Bungkus dengan Link di luar komponen ini (di HomePage/BrowsePage)
    <div className={`bg-surface rounded-lg overflow-hidden shadow-md border border-gray-100 flex flex-col h-full transition-all duration-300 ease-in-out hover:shadow-xl hover:-translate-y-1 ${className}`}>
      {/* Gambar dengan aspect ratio dan object-fit */}
      <div className="aspect-video overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={`Gambar untuk ${title}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" // Efek zoom halus saat hover (perlu group-hover pada Link parent)
              loading="lazy"
            />
          ) : (
            <ImagePlaceholder />
          )}
      </div>

      {/* Konten Kartu */}
      <div className="p-5 flex flex-col flex-grow">
        {/* Info Atas: Kategori, Lokasi, Tanggal */}
        <div className="mb-3 text-xs text-gray-500 space-y-1.5">
            {/* Kategori */}
            <div className="flex items-center gap-1.5">
                <TagIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <span className="font-medium text-emerald-600 capitalize">{category || 'Lainnya'}</span>
            </div>
            {/* Lokasi (jika ada) */} 
            {location && (
                <div className="flex items-center gap-1.5">
                    <MapPinIcon className="h-5 w-5 flex-shrink-0" />
                    <span>{location}</span>
                </div>
            )}
             {/* Tanggal Posting (jika ada) */}
             {formattedDate && (
                <div className="flex items-center gap-1.5">
                     <CalendarDaysIcon className="h-5 w-5 flex-shrink-0" />
                     <span>{formattedDate}</span>
                 </div>
             )}
        </div>

        {/* Judul */}
        <h3 className="text-lg font-semibold text-text-primary mb-2 leading-snug line-clamp-2" title={title || 'Judul Tidak Tersedia'}>
            {title || 'Judul Donasi Tidak Tersedia'}
        </h3>

        {/* Deskripsi (lebih panjang?) */}
        <p className="text-sm text-text-secondary mb-3 flex-grow line-clamp-3">
          {description || 'Deskripsi tidak tersedia.'}
        </p>

        {/* Kondisi Barang (jika ada) */}
        {condition && (
            <div className="mt-auto pt-3 border-t border-gray-100/80">
                 <div className="flex items-center gap-1.5 text-sm text-gray-600">
                     <CheckBadgeIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                     <span className="font-medium">Kondisi:</span>
                     <span>{condition}</span>
                 </div>
            </div>
        )}

        {/* Tombol Aksi (align ke bawah) */}
        {id && (
            <div className="mt-auto pt-4 border-t border-gray-100">
                <Link to={`/donations/${id}`} className="block text-center">
                    <button className="w-full py-2 px-4 rounded-md font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition duration-150 ease-in-out bg-transparent border border-primary text-primary hover:bg-emerald-50 focus:ring-primary text-sm cursor-pointer">
                        Lihat Detail
                    </button>
                 </Link>
            </div>
        )}
      </div>
    </div>
  );
}

DonationCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ID untuk link detail
  imageUrl: PropTypes.string,
  title: PropTypes.string.isRequired,
  category: PropTypes.string,
  description: PropTypes.string,
  postedAt: PropTypes.string, // <-- Tambah propType postedAt (string ISO)
  location: PropTypes.string, // <-- Tambah propType location
  condition: PropTypes.string, // <-- Tambah propType condition
  className: PropTypes.string, // <-- Tambah propType className
};

export default DonationCard; 