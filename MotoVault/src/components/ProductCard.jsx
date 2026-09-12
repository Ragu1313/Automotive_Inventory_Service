import { ShoppingCart } from "lucide-react";

function ProductCard({ product }) {
  return (
    <div className="group flex h-[130px] overflow-hidden rounded-xl border border-blue-400/20 bg-[#081e3b]/70 transition duration-300 hover:-translate-y-1 hover:border-blue-400/40">

      {/* Image */}
      <div className="flex w-[120px] shrink-0 items-center justify-center bg-[#0b294c]">

        <img
          src={product.image}
          alt={product.name}
          className="h-24 w-24 object-contain transition duration-300 group-hover:scale-110"
        />

      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between p-4">

        <div>

          <h3 className="text-xs font-bold">
            {product.name}
          </h3>

          <p className="mt-1 text-[11px] text-blue-400">
            {product.brand}
          </p>

          <p className="mt-1 text-[9px] text-slate-400">
            Part No: {product.partNumber}
          </p>

        </div>

        <div className="flex items-center justify-between">

          <span className="text-sm font-bold">
            {product.price}
          </span>

          <button className="flex items-center gap-1 rounded-lg bg-[#ed6a27] px-3 py-2 text-[9px] font-semibold transition hover:bg-[#ff7830]">
            <ShoppingCart size={12} />
            Add to Cart
          </button>

        </div>

      </div>

    </div>
  );
}

export default ProductCard;