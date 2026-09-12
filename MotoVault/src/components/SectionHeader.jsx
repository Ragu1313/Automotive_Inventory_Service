import { ArrowRight } from "lucide-react";

function SectionHeader({
  eyebrow,
  title,
  action = "View All",
}) {
  return (
    <div className="mb-5 flex items-end justify-between">

      <div>

        <p className="mb-1 text-[10px] font-semibold tracking-[0.25em] text-blue-400">
          {eyebrow}
        </p>

        <h2 className="text-2xl font-bold">
          {title}
        </h2>

      </div>

      <button className="flex items-center gap-1 text-xs font-medium text-blue-400 transition hover:text-blue-300">
        {action}
        <ArrowRight size={14} />
      </button>

    </div>
  );
}

export default SectionHeader;