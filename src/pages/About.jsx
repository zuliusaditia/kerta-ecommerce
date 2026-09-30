import { Link } from 'react-router-dom'

export default function About() {
  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="border-b border-black/10 py-24 md:py-32">
        <div className="max-w-4xl mx-auto px-4 md:px-8 text-center">
          <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-6">
            Our Story
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-8">
            KERTA.
          </h1>
          <p className="text-lg md:text-xl leading-relaxed opacity-70 max-w-2xl mx-auto">
            Sebuah nama yang diambil dari bahasa Sanskerta yang berarti "karya". 
            Kami percaya setiap individu berhak mengekspresikan diri lewat apa yang mereka kenakan.
          </p>
        </div>
      </section>

      {/* IMAGE */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16 md:py-24">
        <div className="aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1600&q=80"
            alt="Workshop"
            className="w-full h-full object-cover"
          />
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="bg-black text-white py-24 md:py-32">
        <div className="max-w-5xl mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                num: '01',
                title: 'Local Pride',
                desc: 'Diproduksi 100% di Indonesia. Kami bangga dengan pengrajin lokal dan kualitas yang mereka hasilkan.',
              },
              {
                num: '02',
                title: 'Timeless Design',
                desc: 'Kami tidak mengikuti tren sesaat. Setiap desain dibuat untuk bertahan dari musim ke musim.',
              },
              {
                num: '03',
                title: 'Premium Quality',
                desc: 'Material pilihan, jahitan rapi, dan detail yang diperhatikan. Karena kualitas adalah cerita.',
              },
            ].map((item) => (
              <div key={item.num}>
                <p className="text-5xl md:text-6xl font-black mb-6 opacity-30">{item.num}</p>
                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                <p className="text-sm opacity-70 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="aspect-[4/5] overflow-hidden bg-gray-100">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80"
              alt="Founder"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest uppercase opacity-50 mb-6">
              Founder
            </p>
            <blockquote className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-8">
              "Saya membuat KERTA karena saya ingin setiap orang punya kanvas untuk menuliskan ceritanya."
            </blockquote>
            <p className="text-sm font-bold tracking-widest uppercase mb-2">
              Zulius Aditia
            </p>
            <p className="text-xs opacity-60">
              Founder & Creative Director
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-black/10 py-24 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl md:text-5xl font-black tracking-tight mb-8">
            READY TO WRITE YOUR STORY?
          </h2>
          <Link
            to="/shop"
            className="inline-block bg-black text-white px-10 py-5 text-xs font-bold tracking-widest uppercase hover:bg-gray-800 transition"
          >
            Shop Collection
          </Link>
        </div>
      </section>
    </div>
  )
}