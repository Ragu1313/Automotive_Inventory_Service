import {
  Search,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from "lucide-react";

function Hero() {
  return (
    <section className="relative h-[327px] overflow-hidden rounded-t-xl border border-white/10">

      {/* Car background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero-car.jpg')",
        }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#03172f] via-[#061b36]/95 via-50% to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full items-center">

        <div className="ml-11 max-w-[520px]">

          <p className="mb-3 text-[11px] font-semibold tracking-[0.28em] text-blue-400">
            WELCOME TO MOTOVAULT
          </p>

          <h1 className="text-4xl font-extrabold leading-[1.05]">
            Genuine Parts for
            <span className="block text-blue-500">
              Every Journey
            </span>
          </h1>

          <p className="mt-4 max-w-[390px] text-sm leading-6 text-slate-300">
            Find the right parts, from trusted brands,
            for every vehicle. Fast. Reliable. Always.
          </p>

          {/* Search */}
          <div className="mt-5 flex h-11 w-[500px] max-w-full overflow-hidden rounded-xl border border-blue-400/30 bg-[#09244a]/80 backdrop-blur-xl">

            <div className="flex flex-1 items-center">

              <Search
                size={18}
                className="ml-4 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search parts, brands, OEM numbers..."
                className="w-full bg-transparent px-3 text-xs text-white outline-none placeholder:text-slate-500"
              />

            </div>

            <button className="m-1 rounded-lg bg-[#ed6a27] px-7 text-xs font-semibold transition hover:bg-[#ff7830]">
              Search
            </button>

          </div>

          {/* Benefits */}
          <div className="mt-5 flex gap-8">

            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-400" />
              <span className="text-[11px] text-slate-300">
                100% Genuine Parts
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Truck size={18} className="text-blue-400" />
              <span className="text-[11px] text-slate-300">
                Fast Delivery
              </span>
            </div>

            <div className="flex items-center gap-2">
              <BadgeCheck size={18} className="text-blue-400" />
              <span className="text-[11px] text-slate-300">
                Trusted Brands
              </span>
            </div>

          </div>

        </div>

        {/* Right slogan */}
        <div className="absolute right-12 top-12 hidden xl:block">

          <h2 className="max-w-[120px] text-2xl font-bold leading-tight">
            DRIVE
            <br />
            BETTER
            <br />
            TOMORROWS
          </h2>

          <div className="mt-4 h-1 w-10 bg-blue-500" />

        </div>

      </div>

    </section>
  );
}

export default Hero;