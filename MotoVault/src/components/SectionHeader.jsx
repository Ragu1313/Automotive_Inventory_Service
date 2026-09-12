import { ArrowRight } from "lucide-react";

function SectionHeader({
  eyebrow,
  title,
  action = "View All",
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">

      <div className="min-w-0">

        <p className="mb-1 text-[9px] font-semibold tracking-[0.22em] text-blue-400 sm:text-[10px]">
          {eyebrow}
        </p>

        <h2 className="truncate text-xl font-bold sm:text-2xl">
          {title}
        </h2>

      </div>


      <button className="flex shrink-0 items-center gap-1 text-[10px] font-medium text-blue-400 transition hover:text-blue-300 sm:text-xs">

        <span className="hidden sm:inline">
          {action}
        </span>

        <span className="sm:hidden">
          View
        </span>

        <ArrowRight size={14} />

      </button>

    </div>
  );
}

export default SectionHeader;