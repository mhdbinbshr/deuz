import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import fs from 'fs';

const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp(config);
const db = getFirestore(app, config.firestoreDatabaseId);

const INITIAL_PRODUCTS = [
  {
    title: "DEUZ FORM 01 — SOVEREIGN",
    price: 12000,
    category: "Apparel",
    productType: "APPAREL",
    fit: "regular",
    image: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983"
    ],
    houseCode: "DEUZ-F01-SOV",
    countInStock: 25,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 5, "M": 8, "L": 6, "XL": 4, "XXL": 2 },
    details: {
      "Silhouette": "Sculpted Architectural",
      "Fabric": "480 GSM Heavy French Terry",
      "Craft": "Hand-finished in Studio",
      "Cut": "Singular House Pattern"
    },
    description: "Anchored in singularity. Precision-cut silhouette crafted from structured heavyweight cotton with architectural shoulder drape.",
    imageTag: "SIGNATURE PIECE"
  },
  {
    title: "DEUZ FORM 01 — DUSTBOUND",
    price: 14500,
    category: "Apparel",
    productType: "APPAREL",
    fit: "oversized",
    image: "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541",
    gallery: [],
    houseCode: "DEUZ-F01-DST",
    countInStock: 18,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 3, "M": 6, "L": 5, "XL": 3, "XXL": 1 },
    details: {
      "Silhouette": "Oversized Drape",
      "Fabric": "Custom Mineral Washed Fleece",
      "Origin": "Limited Capsule",
      "Finish": "Raw Distressed Hem"
    },
    description: "A study in earth and erosion. Mineral washed for a unique tonal gradient with raw-edge detailing.",
    imageTag: "LIMITED CAPSULE"
  },
  {
    title: "DEUZ FORM 01 — ETERNAL HORIZON",
    price: 16000,
    category: "Apparel",
    productType: "APPAREL",
    fit: "regular",
    image: "https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419"
    ],
    houseCode: "DEUZ-F01-ETH",
    countInStock: 12,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 2, "M": 4, "L": 3, "XL": 2, "XXL": 1 },
    details: {
      "Silhouette": "Tailored Box Fit",
      "Fabric": "Double-faced Bonded Wool Blend",
      "Hardware": "Matte Obsidian Snaps",
      "Lining": "Cupro Bemberg"
    },
    description: "The definitive outerwear expression of the house. Monolithic geometry with covert magnetic closures.",
    imageTag: "OUTERWEAR"
  },
  {
    title: "DEUZ FORM 01 — EVOLVE TEE",
    price: 9500,
    category: "Apparel",
    productType: "APPAREL",
    fit: "oversized",
    image: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
    gallery: [
      "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg"
    ],
    houseCode: "DEUZ-F01-EVL",
    countInStock: 30,
    isArchived: false,
    sizes: ["S", "M", "L", "XL", "XXL"],
    sizeStock: { "S": 6, "M": 10, "L": 8, "XL": 4, "XXL": 2 },
    details: {
      "Silhouette": "Relaxed Dropped Shoulder",
      "Fabric": "320 GSM Combed Mercerized Cotton",
      "Edition": "House Release"
    },
    description: "Minimalist precision. Elevated essential featuring subtle tonal house typography and seamless collar reinforcement.",
    imageTag: "CORE RELEASE"
  },
  {
    title: "DEUZ CARD COLLECTION — FORM 01",
    price: 3500,
    category: "Cards",
    productType: "CARD",
    image: "https://images.unsplash.com/photo-1634926878768-2a5b3c426d49?q=80&w=1000&auto=format&fit=crop",
    gallery: [
      "https://images.unsplash.com/photo-1614728853913-1e2221eb8364?q=80&w=1000&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000&auto=format&fit=crop"
    ],
    houseCode: "DEUZ-CRD-01",
    countInStock: 50,
    isArchived: false,
    sizes: ["Standard"],
    sizeStock: { "Standard": 50 },
    details: {
      "Stock": "350 GSM Black Core Linen",
      "Finish": "Gold Foil Hot Stamping",
      "Deck": "54 Bespoke Illustrated Cards",
      "Box": "Magnetic Clasp Obsidian Case"
    },
    description: "A visual symphony in your hand. Handcrafted luxury playing cards designed for collectors.",
    imageTag: "COLLECTORS EDITION"
  }
];

const SETTINGS_DATA = {
  key: "global_config",
  conciergeConfig: {
    instagramHandle: "deuzandco",
    whatsappNumber: "918848918633",
    emailAddress: "deuzandco@gmail.com",
    businessHours: "9 AM - 9 PM IST",
    dmTemplate: "Greetings from DEUZ & CO."
  },
  siteContent: {
    heroTitle: "NOT FOR EVERYONE",
    heroSubtitle: "Not for everyone.",
    ctaText: "Initiate Request",
    checkoutDisclaimer: "Submit your allocation request. No payment is required until our curators verify your dossier.",
    footerText: "Designed in Cinematic Vision",
    storeImage: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
    scrollImages: [
      "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541",
      "https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400",
      "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
      "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419"
    ],
    aboutTitle: "THE HOUSE STANDARD",
    aboutSubtitle: "DEUZ IS THE DESIGN.",
    aboutDescription: "DEUZ & CO is anchored in singularity. One design defines the house — structured with discipline, refined with precision, and elevated through measured evolution. We do not multiply form. We perfect it. Each release strengthens the standard.",
    aboutImage: "https://ik.imagekit.io/dto1zguat/1775236374031.png?updatedAt=1788674480127",
    sovereignCategory: "Apparel",
    sovereignPrice: "₹12,000",
    sovereignStatus: "Active"
  }
};

async function seedAll() {
  console.log("=== INITIATING FULL DATABASE SEEDING ===");

  // 1. Seed Products
  console.log("1. Seeding Products collection...");
  const prodSnap = await getDocs(collection(db, "products"));
  if (prodSnap.empty) {
    for (const item of INITIAL_PRODUCTS) {
      const docRef = await addDoc(collection(db, "products"), {
        ...item,
        createdAt: serverTimestamp()
      });
      console.log(`   Added Product: ${item.title} (ID: ${docRef.id})`);
    }
  } else {
    console.log(`   Products already populated (${prodSnap.size} found).`);
  }

  // 2. Seed Settings
  console.log("2. Seeding Settings collection...");
  await setDoc(doc(db, "settings", "global_config"), SETTINGS_DATA);
  console.log("   Added settings document: global_config");

  // 3. Seed System Sequence Counter
  console.log("3. Seeding System sequence collection...");
  await setDoc(doc(db, "system", "order_counter"), {
    nextSequence: 1001,
    initializedAt: serverTimestamp(),
    service: "DEUZ Sequence Generator"
  });
  console.log("   Added system document: order_counter (starts at 1001)");

  // 4. Seed Initial Sample Reservation Order
  console.log("4. Seeding Sample Orders collection...");
  const orderSnap = await getDocs(collection(db, "orders"));
  if (orderSnap.empty) {
    const sampleOrder = {
      conciergeCode: "DEUZ-INIT-001",
      items: [
        {
          id: "DEUZ-F01-SOV",
          title: "DEUZ FORM 01 — SOVEREIGN",
          price: 12000,
          quantity: 1,
          selectedSize: "L",
          category: "Apparel",
          image: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg"
        }
      ],
      shippingAddress: {
        firstName: "Curator",
        lastName: "Archive",
        email: "unk410066@gmail.com",
        mobile: "918848918633",
        address: "DEUZ House Headquarters, Suite 101",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        country: "India"
      },
      totalAmount: 12000,
      contactMethod: "whatsapp",
      paymentStatus: "Payment Authorized",
      orderStatus: "ORDER_SECURED",
      createdAt: serverTimestamp(),
      statusHistory: [
        {
          status: "ORDER_SECURED",
          timestamp: new Date().toISOString(),
          note: "Allocation verified by House Concierge"
        }
      ],
      internalNotes: "Inaugural house reservation record."
    };
    await setDoc(doc(db, "orders", "DEUZ-INIT-001"), sampleOrder);
    console.log("   Added sample order: DEUZ-INIT-001");
  } else {
    console.log(`   Orders already present (${orderSnap.size} found).`);
  }

  // 5. Seed Audit Logs
  console.log("5. Seeding Audit Logs collection...");
  const initialLogs = [
    {
      action: "FIREBASE_PROJECT_PROVISIONED",
      targetResource: "infrastructure",
      targetId: "gen-lang-client-0255030909",
      details: {
        databaseId: config.firestoreDatabaseId,
        platform: "web",
        authDomain: config.authDomain
      },
      performedBy: {
        fullName: "DEUZ System Core",
        email: "system@deuz.co",
        uid: "system_core"
      },
      timestamp: new Date(Date.now() - 120000).toISOString()
    },
    {
      action: "SECURITY_RULES_DEPLOYED",
      targetResource: "firestore.rules",
      targetId: "rules_v2",
      details: {
        mode: "enforced",
        entitiesProtected: ["users", "products", "orders", "carts", "settings", "audit_logs"]
      },
      performedBy: {
        fullName: "DEUZ Security Policy",
        email: "security@deuz.co",
        uid: "system_sec"
      },
      timestamp: new Date(Date.now() - 90000).toISOString()
    },
    {
      action: "CATALOG_SEEDED",
      targetResource: "products",
      targetId: "catalog",
      details: {
        productsCount: INITIAL_PRODUCTS.length,
        signatureItem: "DEUZ FORM 01 — SOVEREIGN",
        categories: ["Apparel", "Cards"]
      },
      performedBy: {
        fullName: "Inventory Curator",
        email: "inventory@deuz.co",
        uid: "curator_01"
      },
      timestamp: new Date(Date.now() - 60000).toISOString()
    },
    {
      action: "SETTINGS_CONFIGURED",
      targetResource: "settings",
      targetId: "global_config",
      details: {
        brandTagline: "NOT FOR EVERYONE",
        activeChannels: ["whatsapp", "instagram", "email"]
      },
      performedBy: {
        fullName: "Executive Curator",
        email: "curator@deuz.co",
        uid: "exec_01"
      },
      timestamp: new Date(Date.now() - 30000).toISOString()
    },
    {
      action: "DATABASE_INITIALIZATION_COMPLETE",
      targetResource: "database",
      targetId: config.firestoreDatabaseId,
      details: {
        status: "ONLINE",
        collectionsVerified: ["products", "settings", "system", "orders", "audit_logs"]
      },
      performedBy: {
        fullName: "System Admin",
        email: "unk410066@gmail.com",
        uid: "admin_root"
      },
      timestamp: new Date().toISOString()
    }
  ];

  for (const log of initialLogs) {
    await addDoc(collection(db, "audit_logs"), {
      ...log,
      createdAt: serverTimestamp()
    });
    console.log(`   Logged audit event: ${log.action}`);
  }

  console.log("=== FULL DATABASE SEEDING COMPLETED SUCCESSFULLY ===");
}

seedAll().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
