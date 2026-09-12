import {
  Home,
  LayoutGrid,
  Tags,
  Wrench,
  ClipboardList,
  Bell,
  ChevronDown,
} from "lucide-react";

const navItems = [
  {
    label: "Home",
    icon: Home,
  },
  {
    label: "Catalog",
    icon: LayoutGrid,
  },
  {
    label: "Brands",
    icon: Tags,
  },
  {
    label: "Parts",
    icon: Wrench,
  },
  {
    label: "Orders",
    icon: ClipboardList,
  },
];

function Navbar() {
  return (
    <header className="fixed left-0 right-0 top-0 z-50 h-[74px] border-b border-white/10 bg-[#06152b]/90 backdrop-blur-xl">
      <div className="flex h-full items-center">

        {/* Logo */}
        <div className="flex w-[243px] shrink-0 items-center px-6">
          <div>
            <div className="text-[28px] font-extrabold tracking-tight">
              Moto<span className="text-blue-500">Vault</span>
            </div>

            <div className="-mt-1 text-[7px] font-semibold tracking-[0.28em] text-slate-400">
              DRIVE BETTER TOMORROWS
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden h-full items-center gap-1 xl:flex">
          {navItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <button
                key={item.label}
                className={`relative flex h-full items-center gap-2 px-5 text-sm font-medium transition ${
                  index === 0
                    ? "text-white"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Icon size={19} />

                {item.label}

                {index === 0 && (
                  <span className="absolute bottom-0 left-5 right-5 h-[3px] rounded-t-full bg-blue-500" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-6 px-6">

          <button className="relative text-slate-300 hover:text-white">
            <Bell size={20} />

            <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <button className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-semibold">
              A
            </div>

            <div className="hidden text-left lg:block">
              <p className="text-sm font-medium">
                Admin
              </p>

              <p className="text-[11px] text-slate-500">
                Workshop
              </p>
            </div>

            <ChevronDown
              size={15}
              className="text-slate-400"
            />
          </button>

        </div>
      </div>
    </header>
  );
}

export default Navbar;