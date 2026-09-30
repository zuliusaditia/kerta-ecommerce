import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-black text-white mt-24">
      {/* TOP: Brand Statement */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-end">
            <div>
              <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
                KERTA® — Est. 2026
              </p>
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]">
                KARYA<br />YANG<br />BICARA.
              </h2>
            </div>

            <div className="md:text-right">
              <p className="text-sm md:text-base opacity-70 leading-relaxed mb-6 max-w-md md:ml-auto">
                Setiap jahitan punya cerita. Setiap karya punya jiwa.
                Dibuat teliti di Indonesia, dipakai oleh mereka yang berani tampil beda.
              </p>
              <Link
                to="/about"
                className="inline-block border border-white px-6 py-3 text-xs font-bold tracking-widest uppercase hover:bg-white hover:text-black transition"
              >
                Our Story →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE: Navigation Columns */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Shop */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-5">
                Shop
              </h3>
              <nav className="space-y-3 text-sm">
                <Link to="/shop" className="block hover:opacity-60 transition">All Products</Link>
                <Link to="/shop" className="block hover:opacity-60 transition">T-Shirt</Link>
                <Link to="/shop" className="block hover:opacity-60 transition">Hoodie & Jacket</Link>
                <Link to="/shop" className="block hover:opacity-60 transition">Footwear</Link>
                <Link to="/shop" className="block hover:opacity-60 transition">Accessories</Link>
              </nav>
            </div>

            {/* About */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-5">
                About
              </h3>
              <nav className="space-y-3 text-sm">
                <Link to="/about" className="block hover:opacity-60 transition">Our Story</Link>
                <Link to="/about" className="block hover:opacity-60 transition">Philosophy</Link>
                <Link to="/about" className="block hover:opacity-60 transition">Sustainability</Link>
                <Link to="/contact" className="block hover:opacity-60 transition">Careers</Link>
                <Link to="/contact" className="block hover:opacity-60 transition">Press</Link>
              </nav>
            </div>

            {/* Help */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-5">
                Help
              </h3>
              <nav className="space-y-3 text-sm">
                <Link to="/contact" className="block hover:opacity-60 transition">Contact Us</Link>
                <Link to="/account" className="block hover:opacity-60 transition">Track Order</Link>
                <Link to="/contact" className="block hover:opacity-60 transition">Shipping</Link>
                <Link to="/contact" className="block hover:opacity-60 transition">Returns</Link>
                <Link to="/contact" className="block hover:opacity-60 transition">Size Guide</Link>
              </nav>
            </div>

            {/* Social */}
            <div>
              <h3 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-5">
                Follow
              </h3>
              <nav className="space-y-3 text-sm">
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="block hover:opacity-60 transition">
                  Instagram ↗
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="block hover:opacity-60 transition">
                  TikTok ↗
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="block hover:opacity-60 transition">
                  Twitter / X ↗
                </a>
                <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="block hover:opacity-60 transition">
                  YouTube ↗
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* NEWSLETTER */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
          <div className="max-w-2xl">
            <h3 className="text-xs font-bold tracking-widest uppercase opacity-50 mb-4">
              Newsletter
            </h3>
            <p className="text-2xl md:text-4xl font-black tracking-tight mb-6 leading-tight">
              JOIN THE MOVEMENT.
            </p>
            <p className="text-sm opacity-60 mb-6">
              Dapatkan update drop terbaru, promo eksklusif, dan cerita di balik layar.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                alert('✓ Terima kasih sudah subscribe!')
                e.target.reset()
              }}
              className="flex max-w-md border border-white/30"
            >
              <input
                type="email"
                required
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 bg-transparent text-sm placeholder-white/40 focus:outline-none focus:border-white/60"
              />
              <button
                type="submit"
                className="bg-white text-black px-6 text-xs font-bold tracking-widest uppercase hover:bg-gray-200 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* BOTTOM: Copyright */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p className="opacity-50">
            © {new Date().getFullYear()} KERTA®. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-6 opacity-50">
            <Link to="/" className="hover:opacity-100 transition">Privacy Policy</Link>
            <Link to="/" className="hover:opacity-100 transition">Terms of Service</Link>
            <Link to="/" className="hover:opacity-100 transition">Refund Policy</Link>
          </div>

          <p className="opacity-50">Made in Indonesia 🇮🇩</p>
        </div>
      </div>
    </footer>
  )
}