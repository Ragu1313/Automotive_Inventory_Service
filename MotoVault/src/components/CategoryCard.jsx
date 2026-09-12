import { ChevronRight } from "lucide-react";

function CategoryCard({ category }) {
  const Icon = category.icon;

  return (
    <button className="group relative min-w-0 overflow-hidden rounded-xl border border-blue-400/20 bg-[#0a2345]/70 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-[#0d2d56]">

      {/* Image */}
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover opacity-35 transition duration-500 group-hover:scale-110 group-hover:opacity-45"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#04172f] via-[#061d39]/80 to-[#061d39]/20" />

      {/* Content */}
      <div className="relative flex min-h-[140px] flex-col justify-between p-4">

        <div className="flex items-start justify-between gap-2">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
            <Icon
              size={20}
              className="text-blue-400"
            />
          </div>

          <ChevronRight
            size={16}
            className="mt-1 shrink-0 text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400"
          />

        </div>


        <div className="min-w-0">

          <h3 className="truncate text-xs font-bold sm:text-sm">
            {category.name}
          </h3>

          <p className="mt-1 text-[9px] text-slate-400 sm:text-[10px]">
            {category.items}
          </p>

        </div>

      </div>

    </button>
  );
}

export default CategoryCard;