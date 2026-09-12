import {
  Home,
  LayoutGrid,
  Tags,
  Wrench,
  ClipboardList,
  Sparkles,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="fixed bottom-0 left-0 top-[74px] hidden w-[243px] border-r border-white/10 bg-[#03152c]/80 lg:block">

      <div className="flex h-full flex-col px-5 py-8">

        {/* Menu */}
        <div className="space-y-2">

          <button className="flex w-full items-center gap-4 rounded-xl border border-blue-400/30 bg-blue-600/20 px-5 py-3.5 text-sm font-medium text-white shadow-lg shadow-blue-950/20">
            <Home size={19} className="text-blue-400" />
            Home
          </button>

          <button className="flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <LayoutGrid size={19} />
            Catalog
          </button>

          <button className="flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Tags size={19} />
            Brands
          </button>

          <button className="flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <Wrench size={19} />
            Parts
          </button>

          <button className="flex w-full items-center gap-4 rounded-xl px-5 py-3.5 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
            <ClipboardList size={19} />
            Orders
          </button>

        </div>

        {/* Bottom card */}
        <div className="mt-auto overflow-hidden rounded-xl border border-blue-400/30 bg-gradient-to-br from-blue-950/80 to-[#071b37] p-6">

          <Sparkles
            size={30}
            className="text-blue-400"
          />

          <h3 className="mt-5 text-sm font-medium">
            Quality Parts.
            <br />
            Better Repairs.
            <br />
            Happier Customers.
          </h3>

          <div className="mt-5 h-1 w-9 bg-blue-500" />

          <div className="mt-8 h-16 opacity-20">
            <div className="h-full rounded-[50%] border border-blue-400" />
          </div>

        </div>

      </div>
    </aside>
  );
}

export default Sidebar;