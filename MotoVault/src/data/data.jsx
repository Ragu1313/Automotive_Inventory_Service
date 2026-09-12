import {
  Cog,
  Disc3,
  Gauge,
  Battery,
  Filter,
  Settings,
  Car,
  Wrench,
} from "lucide-react";

export const categories = [
  {
    name: "Engine Parts",
    items: "245+ items",
    image: "/images/engine.jpg",
    icon: Cog,
  },
  {
    name: "Brake System",
    items: "189+ items",
    image: "/images/brake.jpg",
    icon: Disc3,
  },
  {
    name: "Suspension",
    items: "142+ items",
    image: "/images/suspension.jpg",
    icon: Gauge,
  },
  {
    name: "Electrical",
    items: "98+ items",
    image: "/images/electrical.jpg",
    icon: Battery,
  },
  {
    name: "Filters",
    items: "76+ items",
    image: "/images/filter.jpg",
    icon: Filter,
  },
  {
    name: "Steering",
    items: "63+ items",
    image: "/images/steering.jpg",
    icon: Settings,
  },
  {
    name: "Body Parts",
    items: "120+ items",
    image: "/images/body.jpg",
    icon: Car,
  },
  {
    name: "Accessories",
    items: "54+ items",
    image: "/images/accessories.jpg",
    icon: Wrench,
  },
];

export const brands = [
  "BOSCH",
  "DENSO",
  "VALEO",
  "SKF",
  "GATES",
  "MAHLE",
  "NGK",
  "Continental",
];

export const products = [
  {
    name: "Brake Disc",
    brand: "BOSCH",
    partNumber: "BD-2847",
    price: "₹2,850",
    image: "/images/brake-disc.jpg",
  },
  {
    name: "Oil Filter",
    brand: "MAHLE",
    partNumber: "OC-1234",
    price: "₹780",
    image: "/images/oil-filter.jpg",
  },
  {
    name: "Timing Belt Kit",
    brand: "GATES",
    partNumber: "TBK-9081",
    price: "₹4,250",
    image: "/images/timing-belt.jpg",
  },
  {
    name: "Alternator",
    brand: "DENSO",
    partNumber: "ALT-4412",
    price: "₹8,900",
    image: "/images/alternator.jpg",
  },
];