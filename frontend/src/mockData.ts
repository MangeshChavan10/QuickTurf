export interface Review {
  id: string;
  author: string;
  date: string;
  rating: number;
  comment: string;
}

export interface Turf {
  id: string;
  name: string;
  location: string;
  subLocation: string;
  price: number;
  rating: number;
  reviewCount: number;
  image: string;
  gallery: string[];
  distance?: string;
  description: string;
  host: {
    name: string;
    avatar: string;
    years: number;
  };
  amenities: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
}

export const TURFS: Turf[] = [
  {
    id: "1",
    name: "Match Point Turf",
    location: "Solapur",
    subLocation: "Besides Middle East Cafe, 14/1B, Hotagi Rd, opp. to Lokmat Press, Industrial Estate, Basaveshwar Nagar",
    price: 10,
    rating: 4.98,
    reviewCount: 342,
    distance: "1.2 km away",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
    gallery: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1589487391730-58f20eb2c308?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&q=80&w=1200"
    ],
    description: "Experience the ultimate matchday at Match Point Turf. Featuring high-grade artificial grass, professional floodlights for night sessions, and a dedicated trophy facility for your tournaments. The preferred destination for serious athletes in Solapur.",
    host: {
      name: "Match Point Team",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuD9OLYFJoFVIRdzeuJxH5vnWGU49nraZMiWq5TkrxpBEg-s7br2RFJrGdKS8fhVTmGmNLgigfKEPMuvxXTUmQRsAodE7TIrNpGxZq5vmjkcXQk2rKOjL3LrshAOcqQyA7mVJi62eT864uDA7qo7kdBORgq4NDc3UGQHod7wbbH9YBDBEu7ni1tPzvSkPQbjsv_12OSo14JlqYtv3c3xB1Nt8eUp8NiJAXTKK-0xHtIA0YWlVZtPo4V6FFf7FQxOTx45uVk7-P-kCpA",
      years: 5
    },
    amenities: ["Night LED Floodlights", "Tournament Trophy Support", "Changing Rooms", "Free Parking", "Drinking Water"],
    coordinates: { lat: 17.6599, lng: 75.9064 }
  }
];

export const REVIEWS: Review[] = [
  {
    id: "r1",
    author: "Rahul Deshpande",
    date: "April 2026",
    rating: 5,
    comment: "Absolutely the best turf in Solapur! The artificial grass quality at Match Point is exceptional, and the LED floodlights make our late-night cricket matches perfect. The ground is extremely well-maintained and the shock absorption on the turf really saves the knees during an intense football match."
  },
  {
    id: "r2",
    author: "Akhil Jadhav",
    date: "March 2026",
    rating: 5,
    comment: "We've been playing here every weekend for the past two months. The dimensions are perfect for a 6v6 football game. The management is very professional, always ensuring the pitch is clean and the floodlights are ready before our slot begins. Highly recommend checking this out!"
  },
  {
    id: "r3",
    author: "Ankit Desai",
    date: "February 2026",
    rating: 4,
    comment: "Great turf overall. The booking process was smooth and the staff was friendly. The only minor issue was that the parking space can get a bit crowded during peak hours, but the playing experience itself is top-notch."
  },
];
