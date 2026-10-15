/**
 * DEUZ ATELIER - Product Perspectives & Image Pairing Helper
 * Ensures every product on the homepage and product page has a paired
 * secondary view (e.g., front silhouette and reverse/drape angle)
 * with cinematic animation.
 */

export interface ProductImageSet {
  primary: string;
  secondary: string;
  allImages: string[];
}

const KNOWN_PAIRINGS: Record<string, { primary: string; secondary: string; extras?: string[] }> = {
  // Sovereign
  sovereign: {
    primary: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
    secondary: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
    extras: ["https://ik.imagekit.io/dto1zguat/Evolve_2.jpg", "https://ik.imagekit.io/dto1zguat/Evolve_3.jpg"]
  },
  // Dustbound
  dustbound: {
    primary: "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541",
    secondary: "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg"
  },
  // Eternal Horizon
  eternal: {
    primary: "https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400",
    secondary: "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419",
    extras: ["https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg"]
  },
  // Evolve Tee
  evolve: {
    primary: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
    secondary: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
    extras: ["https://ik.imagekit.io/dto1zguat/Evolve_2.jpg"]
  }
};

/**
 * Derives the primary and secondary display images for any product object.
 */
export function getProductImageSet(product?: {
  image?: string;
  imgUrl?: string;
  gallery?: string[];
  title?: string;
  houseCode?: string;
}): ProductImageSet {
  const primaryImg = product?.image || product?.imgUrl || "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg";
  const gallery = Array.isArray(product?.gallery) ? product.gallery.filter(Boolean) : [];
  
  // 1. If product explicitly has items in gallery that are distinct from primary image:
  const distinctGallery = gallery.filter(g => g !== primaryImg);
  if (distinctGallery.length > 0) {
    const secondary = distinctGallery[0];
    const all = [primaryImg, ...distinctGallery];
    return {
      primary: primaryImg,
      secondary,
      allImages: Array.from(new Set(all))
    };
  }

  // 2. Identify by image URL patterns
  const urlLower = primaryImg.toLowerCase();
  if (urlLower.includes("dustbound_1")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg",
      allImages: [primaryImg, "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg"]
    };
  }
  if (urlLower.includes("dustbound_2")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541",
      allImages: [primaryImg, "https://ik.imagekit.io/dto1zguat/Dustbound_1.jpg?updatedAt=1775277953541"]
    };
  }
  if (urlLower.includes("eternalhorizon_1")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419",
      allImages: [
        primaryImg,
        "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419",
        "https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg"
      ]
    };
  }
  if (urlLower.includes("eternalhorizon_2")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg",
      allImages: [
        primaryImg,
        "https://ik.imagekit.io/dto1zguat/EternalHorizon_3.jpg",
        "https://ik.imagekit.io/dto1zguat/EternalHorizon_1.jpg?updatedAt=1775278022400"
      ]
    };
  }
  if (urlLower.includes("evolve_1")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
      allImages: [
        primaryImg,
        "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
        "https://ik.imagekit.io/dto1zguat/Evolve_2.jpg"
      ]
    };
  }
  if (urlLower.includes("evolve_4")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
      allImages: [
        primaryImg,
        "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg",
        "https://ik.imagekit.io/dto1zguat/Evolve_2.jpg"
      ]
    };
  }

  // 3. Fallback by title or houseCode
  const text = `${product?.title || ''} ${product?.houseCode || ''}`.toLowerCase();
  if (text.includes("dust")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg",
      allImages: [primaryImg, "https://ik.imagekit.io/dto1zguat/Dustbound_2.jpg"]
    };
  }
  if (text.includes("horizon") || text.includes("monolith") || text.includes("eth")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419",
      allImages: [primaryImg, "https://ik.imagekit.io/dto1zguat/EternalHorizon_2.jpg?updatedAt=1775278048419"]
    };
  }
  if (text.includes("evolve") || text.includes("sov")) {
    return {
      primary: primaryImg,
      secondary: "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983",
      allImages: [primaryImg, "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983"]
    };
  }

  // 4. Default paired alternate view
  const defaultSecondary = "https://ik.imagekit.io/dto1zguat/Evolve_4.jpg?updatedAt=1775278133983";
  return {
    primary: primaryImg,
    secondary: primaryImg === defaultSecondary ? "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg" : defaultSecondary,
    allImages: [primaryImg, primaryImg === defaultSecondary ? "https://ik.imagekit.io/dto1zguat/Evolve_1.jpg" : defaultSecondary]
  };
}
