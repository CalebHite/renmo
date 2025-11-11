import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold text-[#3D95CE]">
          GLIDE
        </Link>
        <div className="flex items-center space-x-4">
          <Link href="/activity" className="text-gray-600 hover:text-gray-900">
            Activity
          </Link>
        </div>
      </div>
    </header>
  );
}

