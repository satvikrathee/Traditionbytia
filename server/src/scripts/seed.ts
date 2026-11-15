import mongoose from 'mongoose';
import { ENV } from '../config/env.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs';

const sampleProducts = [
  // Category 1: Festive Ensembles
  {
    name: 'Varanasi Royal Crimson Brocade Anarkali Set',
    slug: 'varanasi-royal-crimson-brocade-anarkali-set',
    description: 'Masterfully hand-tailored with generational Varanasi brocade techniques, this crimson red pure Katan silk Anarkali set features intricate gold and antique zari floral kadwa jaal motifs with a majestic dupatta and ornate pants.',
    category: 'Festive Ensembles',
    price: 18500,
    discountPrice: 15999,
    stock: 12,
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_ens_1' },
      { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_ens_1_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.9,
    numReviews: 24,
  },
  {
    name: 'Kanchipuram Gold Tissue Festive Kurta & Churidar Set',
    slug: 'kanchipuram-gold-tissue-festive-kurta-churidar-set',
    description: 'An ethereal celebration ensemble crafted from authentic mulberry silk intertwined with pure silver and gold zari threads. Features traditional temple gopuram motifs and a rich woven finish.',
    category: 'Festive Ensembles',
    price: 24000,
    discountPrice: 21500,
    stock: 8,
    images: [
      { url: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_ens_2' },
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_ens_2_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: true,
    rating: 5.0,
    numReviews: 19,
  },
  {
    name: 'Emerald Peacock Handwoven Tussar Silk Angrakha Set',
    slug: 'emerald-peacock-handwoven-tussar-silk-angrakha-set',
    description: 'Natural organic wild Tussar silk dyed in deep emerald green, adorned with traditional hand-painted Madhubani peacock motifs and a tailored royal neckline.',
    category: 'Festive Ensembles',
    price: 11200,
    discountPrice: 9499,
    stock: 15,
    images: [
      { url: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_ens_3' },
    ],
    isActive: true,
    featured: false,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.8,
    numReviews: 14,
  },

  // Category 2: Handcrafted Heritage Lehengas & Kurtas
  {
    name: 'Maroon Zardozi Velvet Bridal Lehenga Set',
    slug: 'maroon-zardozi-velvet-bridal-lehenga-set',
    description: 'Fit for royalty, this deep maroon micro-velvet lehenga is hand-embroidered with authentic dabka, zardozi, and micro-pearls. Paired with a tailored sweetheart neckline blouse and two contrasting handcrafted dupattas.',
    category: 'Lehengas & Kurtas',
    price: 42000,
    discountPrice: 38500,
    stock: 5,
    images: [
      { url: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_lehenga_1' },
      { url: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_lehenga_1_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.95,
    numReviews: 31,
  },
  {
    name: 'Lucknowi Chikankari Ivory Georgette Anarkali Set',
    slug: 'lucknowi-chikankari-ivory-georgette-anarkali-set',
    description: 'Delicate hand-embroidered Lucknowi shadow-work Chikankari crafted on feather-light pure viscose georgette with subtle mukaish embellishments and antique gold gota patti detailing.',
    category: 'Lehengas & Kurtas',
    price: 14500,
    discountPrice: 12999,
    stock: 14,
    images: [
      { url: 'https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_lehenga_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.75,
    numReviews: 17,
  },
  {
    name: 'Raw Silk Men\'s Angrakha Kurta & Churidar',
    slug: 'raw-silk-mens-angrakha-kurta-churidar',
    description: 'An elegant antique ivory raw silk Angrakha kurta styled with brass button embellishments and tonal thread embroidery. Perfect for wedding festivities and festive ceremonies.',
    category: 'Lehengas & Kurtas',
    price: 9800,
    discountPrice: 8499,
    stock: 10,
    images: [
      { url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_kurta_1' },
    ],
    isActive: true,
    featured: false,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.85,
    numReviews: 22,
  },

  // Category 3: Royal Temple & Kundan Jewellery
  {
    name: 'Antique Gold 22K Plated Temple Choker Necklace Set',
    slug: 'antique-gold-temple-choker-necklace-set',
    description: 'Handcrafted by master artisans in South India, this regal temple choker showcases carvings of Goddess Lakshmi surrounded by dancing peacocks, finished with dangling natural freshwater pearl clusters.',
    category: 'Heritage Jewellery',
    price: 8900,
    discountPrice: 7499,
    stock: 16,
    images: [
      { url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_jewel_1' },
      { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_jewel_1_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.9,
    numReviews: 42,
  },
  {
    name: 'Jadau Polki & Emerald Heritage Chandbalis',
    slug: 'jadau-polki-emerald-heritage-chandbalis',
    description: 'Exquisite crescent moon-shaped Chandbalis featuring uncut polki stones set in meenakari backplates with suspended Zambian emerald drops and tiny seed pearls.',
    category: 'Heritage Jewellery',
    price: 6500,
    discountPrice: 5200,
    stock: 20,
    images: [
      { url: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_jewel_2' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.88,
    numReviews: 28,
  },
  {
    name: 'Kundan & Ruby Bridal Matha Patti',
    slug: 'kundan-ruby-bridal-matha-patti',
    description: 'A statement royal headpiece crafted with precision-cut kundan crystals, pigeon-blood red simulated rubies, and delicate hanging pearl chains designed to frame the face with timeless regal charm.',
    category: 'Heritage Jewellery',
    price: 5200,
    discountPrice: 4399,
    stock: 11,
    images: [
      { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_jewel_3' },
    ],
    isActive: true,
    featured: false,
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.92,
    numReviews: 19,
  },

  // Category 4: Artisanal Handloom Dupattas & Stoles
  {
    name: 'Kashmiri Hand-Embroidered Pashmina Sozni Shawl',
    slug: 'kashmiri-hand-embroidered-pashmina-sozni-shawl',
    description: 'Certified 100% pure Ladakhi Pashmina wool hand-spun and adorned with fine needlepoint Sozni embroidery portraying Persian paisley boteh motifs. Takes over 4 months of dedicated artisan labor.',
    category: 'Handloom Dupattas',
    price: 16500,
    discountPrice: 14200,
    stock: 7,
    images: [
      { url: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_shawl_1' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: true,
    rating: 4.96,
    numReviews: 35,
  },
  {
    name: 'Chanderi Silk Gold Zari Meenakari Dupatta',
    slug: 'chanderi-silk-gold-zari-meenakari-dupatta',
    description: 'Woven with featherweight Chanderi cotton-silk yarn, this luminous dupatta features gold zari booti all over and an opulent border inspired by royal Malwa architecture.',
    category: 'Handloom Dupattas',
    price: 4800,
    discountPrice: 3999,
    stock: 25,
    images: [
      { url: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_shawl_2' },
    ],
    isActive: true,
    featured: false,
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.7,
    numReviews: 12,
  },
  {
    name: 'Gujarati Patola Double Ikkat Heritage Stole',
    slug: 'gujarati-patola-double-ikkat-heritage-stole',
    description: 'Authentic Patan Patola double ikkat weave with natural vegetable dyes showcasing geometric elephant and parrot motifs. A collector\'s masterpiece celebrated worldwide.',
    category: 'Handloom Dupattas',
    price: 13500,
    discountPrice: 11999,
    stock: 6,
    images: [
      { url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', publicId: 'seed_shawl_3' },
    ],
    isActive: true,
    featured: true,
    isBestSeller: true,
    isNewArrival: false,
    rating: 5.0,
    numReviews: 21,
  },
];

const seed = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected. Clearing existing products...');

    await Product.deleteMany({});
    console.log('[Seed] Inserting 12 handcrafted ethnic products...');

    await Product.insertMany(sampleProducts);
    console.log(`[Seed] Successfully seeded ${sampleProducts.length} products across 4 categories!`);

    // Ensure default admin user exists
    const adminEmail = 'traditionbytia@gmail.com';
    let admin = await User.findOne({ email: adminEmail });
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Asha@0606', salt);
    if (!admin) {
      admin = await User.create({
        name: 'Misha Sandhu',
        email: adminEmail,
        passwordHash,
        phone: '+91 8708305992',
        role: 'admin',
        addresses: [
          {
            name: 'Traditions By Tiya HQ',
            phone: '+91 8708305992',
            street: 'Heritage Atelier',
            city: 'Karnal',
            state: 'Haryana',
            pincode: '132001',
            isDefault: true,
          },
        ],
      });
      console.log(`[Seed] Created default admin user: ${adminEmail} (password: Asha@0606)`);
    } else {
      admin.name = 'Misha Sandhu';
      admin.passwordHash = passwordHash;
      admin.phone = '+91 8708305992';
      admin.role = 'admin';
      await admin.save();
      console.log(`[Seed] Admin user verified and updated to Misha Sandhu: ${adminEmail}`);
    }

    // Ensure sample customer user exists
    const customerEmail = 'customer@traditionsbytiya.com';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('Customer@2026!', salt);
      customer = await User.create({
        name: 'Aanya Verma',
        email: customerEmail,
        passwordHash,
        phone: '+91 91234 56789',
        role: 'customer',
        addresses: [
          {
            name: 'Aanya Verma',
            phone: '+91 91234 56789',
            street: '14 Royal Palms Residency, Indiranagar',
            city: 'Bengaluru',
            state: 'Karnataka',
            pincode: '560038',
            isDefault: true,
          },
        ],
      });
      console.log(`[Seed] Created sample customer user: ${customerEmail} (password: Customer@2026!)`);
    }

    console.log('\n=============================================');
    console.log(' SEED COMPLETED SUCCESSFULLY! ');
    console.log('=============================================\n');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error);
    process.exit(1);
  }
};

seed();

