import { ChevronRight } from "lucide-react";

function CategoryCard({ category }) {
  const Icon = category.icon;

  return (
    <button className="group relative h-[138px] overflow-hidden rounded-xl border border-blue-400/20 bg-[#0a2345]/70 text-left transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-[#0d2d56]">

      {/* Image */}
      <img
        src={category.image}
        alt={category.name}
        className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-110 group-hover:opacity-50"
      />

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#04172f] via-[#061d39]/70 to-transparent" />

      <div className="relative flex h-full flex-col justify-between p-4">

        <div className="flex justify-between">

          <Icon
            size={22}
            className="text-blue-400"
          />

          <ChevronRight
            size={16}
            className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-blue-400"
          />

        </div>

        <div>

          <h3 className="text-xs font-bold">
            {category.name}
          </h3>

          <p className="mt-1 text-[9px] text-slate-400">
            {category.items}
          </p>

        </div>

      </div>

    </button>
  );
}

export default CategoryCard;