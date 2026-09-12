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
    <div className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_20%_20%,#18345f_0%,#0b1d38_40%,#07152d_65%,#123f8a_100%)]">

      <Navbar />

      <Sidebar />

      <main className="min-h-screen pt-[74px] lg:ml-[243px]">

        <div className="mx-auto w-full max-w-[1600px]">

          {/* HERO */}
          <Hero />


          {/* CATALOG */}
          <section
            id="catalog"
            className="px-4 py-8 sm:px-6 lg:px-7"
          >

            <SectionHeader
              eyebrow="BROWSE CATALOG"
              title="Find Parts by Category"
              action="View All Categories"
            />

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                md:grid-cols-3
                lg:grid-cols-4
                xl:grid-cols-4
                2xl:grid-cols-8
              "
            >
              {categories.map((category) => (
                <CategoryCard
                  key={category.name}
                  category={category}
                />
              ))}
            </div>

          </section>


          {/* BRANDS */}
          <section
            id="brands"
            className="px-4 pb-8 sm:px-6 lg:px-7"
          >

            <SectionHeader
              eyebrow="TRUSTED BRANDS"
              title="Popular Brands"
              action="View All Brands"
            />

            <div
              className="
                grid
                grid-cols-2
                gap-4
                sm:grid-cols-3
                md:grid-cols-4
                lg:grid-cols-4
                xl:grid-cols-4
                2xl:grid-cols-8
              "
            >
              {brands.map((brand) => (
                <BrandCard
                  key={brand}
                  brand={brand}
                />
              ))}
            </div>

          </section>


          {/* PRODUCTS */}
          <section
            id="parts"
            className="px-4 pb-12 sm:px-6 lg:px-7"
          >

            <SectionHeader
              eyebrow="FEATURED PARTS"
              title="Top Selling Parts"
              action="View All Parts"
            />

            <div
              className="
                grid
                grid-cols-1
                gap-4
                sm:grid-cols-2
                lg:grid-cols-2
                xl:grid-cols-2
                2xl:grid-cols-4
              "
            >
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