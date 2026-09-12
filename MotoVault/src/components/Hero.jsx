import {
  Search,
  ShieldCheck,
  Truck,
  BadgeCheck,
} from "lucide-react";

function Hero() {
  return (
    <section className="relative min-h-[360px] overflow-hidden border-x border-b border-white/10 sm:min-h-[390px]">

      {/* Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('/images/hero-car.jpg')",
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#03172f] via-[#061b36]/95 via-55% to-[#061b36]/30" />

      {/* Content */}
      <div className="relative z-10 flex min-h-[360px] items-center px-5 py-10 sm:min-h-[390px] sm:px-8 lg:px-11">

        <div className="w-full max-w-[560px]">

          {/* Eyebrow */}
          <p className="mb-3 text-[9px] font-semibold tracking-[0.25em] text-blue-400 sm:text-[10px]">
            WELCOME TO MOTOVAULT
          </p>

          {/* Heading */}
          <h1 className="text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-5xl">

            Genuine Parts for

            <span className="block text-blue-500">
              Every Journey
            </span>

          </h1>

          {/* Description */}
          <p className="mt-4 max-w-[430px] text-xs leading-5 text-slate-300 sm:text-sm sm:leading-6">
            Find the right parts, from trusted brands,
            for every vehicle. Fast. Reliable. Always.
          </p>


          {/* Search */}
          <div className="mt-6 flex w-full max-w-[540px] overflow-hidden rounded-xl border border-blue-400/30 bg-[#09244a]/90 p-1 backdrop-blur-xl">

            <div className="flex min-w-0 flex-1 items-center">

              <Search
                size={18}
                className="ml-3 shrink-0 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search parts, brands, OEM numbers..."
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-xs text-white outline-none placeholder:text-slate-500 sm:text-sm"
              />

            </div>

            <button className="shrink-0 rounded-lg bg-[#ed6a27] px-5 text-xs font-semibold transition hover:bg-[#ff7830] sm:px-7 sm:text-sm">
              Search
            </button>

          </div>


          {/* Benefits */}
          <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">

            <div className="flex items-center gap-2">
              <ShieldCheck
                size={17}
                className="shrink-0 text-blue-400"
              />

              <span className="text-[10px] text-slate-300 sm:text-[11px]">
                100% Genuine Parts
              </span>
            </div>


            <div className="flex items-center gap-2">
              <Truck
                size={17}
                className="shrink-0 text-blue-400"
              />

              <span className="text-[10px] text-slate-300 sm:text-[11px]">
                Fast Delivery
              </span>
            </div>


            <div className="flex items-center gap-2">
              <BadgeCheck
                size={17}
                className="shrink-0 text-blue-400"
              />

              <span className="text-[10px] text-slate-300 sm:text-[11px]">
                Trusted Brands
              </span>
            </div>

          </div>

        </div>


        {/* Right slogan */}
        <div className="absolute right-8 top-10 hidden xl:block 2xl:right-14">

          <h2 className="max-w-[130px] text-2xl font-bold leading-tight">
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