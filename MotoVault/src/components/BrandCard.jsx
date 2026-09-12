function BrandCard({ brand }) {
  return (
    <button className="flex min-w-0 h-[68px] items-center justify-center overflow-hidden rounded-xl border border-blue-400/20 bg-[#0a2345]/60 px-3 transition duration-300 hover:-translate-y-1 hover:border-blue-400/50 hover:bg-[#0d2d56] sm:px-5">

      <span
        className={`truncate text-base font-extrabold tracking-tight sm:text-lg ${
          brand === "BOSCH"
            ? "text-red-500"
            : brand === "DENSO"
            ? "italic text-red-500"
            : brand === "VALEO"
            ? "italic text-green-400"
            : brand === "SKF"
            ? "bg-white px-1 text-blue-700"
            : brand === "GATES"
            ? "italic text-white"
            : brand === "MAHLE"
            ? "text-white"
            : brand === "NGK"
            ? "text-red-500"
            : "text-orange-400"
        }`}
      >
        {brand}
      </span>

    </button>
  );
}

export default BrandCard;