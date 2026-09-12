import { ShoppingCart } from "lucide-react";

function ProductCard({ product }) {
  return (
    <div className="group flex min-w-0 overflow-hidden rounded-xl border border-blue-400/20 bg-[#081e3b]/70 transition duration-300 hover:-translate-y-1 hover:border-blue-400/40">

      {/* Image */}
      <div className="flex h-[145px] w-[115px] shrink-0 items-center justify-center bg-[#0b294c] sm:h-[155px] sm:w-[135px]">

        <img
          src={product.image}
          alt={product.name}
          className="h-[90px] w-[90px] object-contain transition duration-300 group-hover:scale-110 sm:h-[105px] sm:w-[105px]"
        />

      </div>


      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">

        <div className="min-w-0">

          <h3 className="truncate text-xs font-bold sm:text-sm">
            {product.name}
          </h3>

          <p className="mt-1 text-[10px] text-blue-400 sm:text-[11px]">
            {product.brand}
          </p>

          <p className="mt-1 truncate text-[9px] text-slate-400 sm:text-[10px]">
            Part No: {product.partNumber}
          </p>

        </div>


        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">

          <span className="text-sm font-bold sm:text-base">
            {product.price}
          </span>

          <button className="flex shrink-0 items-center gap-1 rounded-lg bg-[#ed6a27] px-3 py-2 text-[9px] font-semibold transition hover:bg-[#ff7830] sm:px-4">
            <ShoppingCart size={12} />
            Add to Cart
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;