import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Hero from "../components/Hero";
import SectionHeader from "../components/SectionHeader";
import CategoryCard from "../components/CategoryCard";
import BrandCard from "../components/BrandCard";
import ProductCard from "../components/ProductCard";

import {
  categories,
  brands,
  products,
} from "../data/data";

function Home() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_20%,#18345f_0%,#0b1d38_40%,#07152d_65%,#123f8a_100%)]">

      <Navbar />

      <Sidebar />

      {/* Main content */}
      <main className="ml-0 pt-[74px] lg:ml-[243px]">

        <div className="mx-auto max-w-[1500px]">

          {/* HERO */}
          <Hero />


          {/* CATALOG */}
          <section className="px-7 py-6">

            <SectionHeader
              eyebrow="BROWSE CATALOG"
              title="Find Parts by Category"
              action="View All Categories"
            />

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">

              {categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  category={category}
                />
              ))}

            </div>

          </section>


          {/* BRANDS */}
          <section className="px-7 pb-6">

            <SectionHeader
              eyebrow="TRUSTED BRANDS"
              title="Popular Brands"
              action="View All Brands"
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">

              {brands.map((brand) => (
                <BrandCard
                  key={brand}
                  brand={brand}
                />
              ))}

            </div>

          </section>


          {/* PRODUCTS */}
          <section className="px-7 pb-10">

            <SectionHeader
              eyebrow="FEATURED PARTS"
              title="Top Selling Parts"
              action="View All Parts"
            />

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">

              {products.map((product) => (
                <ProductCard
                  key={product.partNumber}
                  product={product}
                />
              ))}

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Home;