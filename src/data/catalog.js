/**
 * CATALOG DATA ARCHITECTURE
 *
 * Senior-level, scalable data structure for static website
 *
 * Design Principles:
 * - Single source of truth
 * - Hierarchical: Categories contain products
 * - Easy to add/remove without touching UI code
 * - Type-safe structure
 * - Maintainable and future-proof
 */
const PLACEHOLDER = "/images/logo.png";
// ============================================================================
// CATEGORY DEFINITIONS
// ============================================================================
// Add new categories here - UI will automatically update
export const categories = [
  {
    id: "home-decor",
    name: "Home Decor",
    slug: "home-decor",
    description: "Beautiful handcrafted items to enhance your living space",
    icon: "home",
    order: 1, // Display order
    featured: true, // Show in featured sections
    meta: {
      keywords: ["home", "decor", "furniture", "decoration", "interior"],
    },
  },
  {
    id: "personalized-gifts",
    name: "Personalized Gifts",
    slug: "personalized-gifts",
    description: "Customized gifts made special with personal touches",
    icon: "gift",
    order: 2,
    featured: true,
    meta: {
      keywords: ["personalized", "custom", "gift", "engraved", "monogram"],
    },
  },
  {
    id: "fashion-accessories",
    name: "Fashion & Accessories",
    slug: "fashion-accessories",
    description: "Elegant fashion items and accessories",
    icon: "fashion",
    order: 3,
    featured: true,
    meta: {
      keywords: ["fashion", "accessories", "clothing", "jewelry", "style"],
    },
  },
  {
    id: "jewelry-accessories",
    name: "Jewelry & Accessories",
    slug: "jewelry-accessories",
    description: "Handcrafted jewelry and traditional accessories",
    icon: "jewelry",
    order: 4,
    featured: true,
    meta: {
      keywords: [
        "jewelry",
        "accessories",
        "traditional",
        "handmade",
        "ornaments",
      ],
    },
  },
  {
    id: "kitchen-dining",
    name: "Kitchen & Dining",
    slug: "kitchen-dining",
    description: "Traditional kitchenware and dining essentials",
    icon: "kitchen",
    order: 5,
    featured: true,
    meta: {
      keywords: ["kitchen", "dining", "utensils", "cookware", "traditional"],
    },
  },
  {
    id: "art-collectibles",
    name: "Art & Collectibles",
    slug: "art-collectibles",
    description: "Traditional Indian art and collectible items",
    icon: "art",
    order: 6,
    featured: false,
    meta: {
      keywords: [
        "art",
        "collectibles",
        "traditional",
        "sculpture",
        "paintings",
      ],
    },
  },
  {
    id: "wedding-occasions",
    name: "Wedding & Special Occasions",
    slug: "wedding-occasions",
    description: "Special gifts for weddings and celebrations",
    icon: "wedding",
    order: 7,
    featured: true,
    meta: {
      keywords: ["wedding", "occasion", "celebration", "gift", "special"],
    },
  },
  {
    id: "kids-baby",
    name: "Kids & Baby Gifts",
    slug: "kids-baby",
    description: "Thoughtful gifts for children and babies",
    icon: "kids",
    order: 8,
    featured: false,
    meta: {
      keywords: ["kids", "baby", "children", "toys", "gifts"],
    },
  },
  {
    id: "office-stationery",
    name: "Office & Stationery",
    slug: "office-stationery",
    description: "Handcrafted office supplies and stationery",
    icon: "office",
    order: 9,
    featured: false,
    meta: {
      keywords: ["office", "stationery", "desk", "organizer", "supplies"],
    },
  },
];

// ============================================================================
// DUMMY IMAGE HELPER
// ============================================================================
// Enhanced dummy image helper with product-specific keywords
// Supports both old format (seed, index) and new format (productTitle, seed, index)
// const getDummyImage = (productTitleOrSeed, seedOrIndex = 0, index = 0) => {
//   // Determine if first param is a title (string) or seed (number)
//   let productTitle = ''
//   let seed = 0
//   let imgIndex = 0

//   if (typeof productTitleOrSeed === 'string') {
//     // New format: (productTitle, seed, index)
//     productTitle = productTitleOrSeed
//     seed = seedOrIndex
//     imgIndex = index
//   } else {
//     // Old format: (seed, index) - backward compatibility
//     seed = productTitleOrSeed
//     imgIndex = seedOrIndex
//     // Try to get title from context if available (will use generic keywords)
//   }

//   // Extract keywords from product title for better image matching
//   const titleLower = productTitle.toLowerCase()
//   // Default to Indian craft keywords for brand consistency
//   let keywords = 'indian-handicraft,handmade,traditional-artisan,india'

//   // Map product titles to relevant image keywords
//   if (titleLower.includes('jewelry') || titleLower.includes('jewellery') || titleLower.includes('jewelry box')) {
//     keywords = 'indian-jewelry,traditional,handmade,gold,silver'
//   } else if (titleLower.includes('photo') || titleLower.includes('frame')) {
//     keywords = 'photo-frame,wooden,decorative,handmade'
//   } else if (titleLower.includes('scarf') || titleLower.includes('stole')) {
//     keywords = 'silk-scarf,indian-fabric,handwoven,traditional'
//   } else if (titleLower.includes('ceramic') || titleLower.includes('dinner')) {
//     keywords = 'ceramic-dinnerware,indian-pottery,handmade,traditional'
//   } else if (titleLower.includes('watch')) {
//     keywords = 'watch,engraved,leather,premium'
//   } else if (titleLower.includes('cushion') || titleLower.includes('pillow')) {
//     keywords = 'cushion-covers,cotton,handwoven,indian-textile'
//   } else if (titleLower.includes('wallet') || titleLower.includes('leather')) {
//     keywords = 'leather-wallet,handmade,premium,craft'
//   } else if (titleLower.includes('candle') || titleLower.includes('diya')) {
//     keywords = 'brass-candle-holder,diya,traditional,indian-decor'
//   } else if (titleLower.includes('mug') || titleLower.includes('coffee')) {
//     keywords = 'coffee-mug,ceramic,personalized,handmade'
//   } else if (titleLower.includes('art') || titleLower.includes('painting') || titleLower.includes('print')) {
//     keywords = 'indian-art,traditional-painting,handmade,decorative'
//   } else if (titleLower.includes('pottery') || titleLower.includes('vase')) {
//     keywords = 'pottery-vase,handmade,terracotta,indian-craft'
//   } else if (titleLower.includes('brass')) {
//     keywords = 'brass-decor,traditional,handmade,indian-artisan'
//   } else if (titleLower.includes('copper')) {
//     keywords = 'copper-pot,traditional,handmade,indian-utensil'
//   } else if (titleLower.includes('wooden') || titleLower.includes('wood')) {
//     keywords = 'wooden-craft,handmade,indian-furniture,traditional'
//   } else if (titleLower.includes('bamboo')) {
//     keywords = 'bamboo-craft,handmade,eco-friendly,indian'
//   } else if (titleLower.includes('jute')) {
//     keywords = 'jute-wall-hanging,handwoven,natural,indian'
//   } else if (titleLower.includes('terracotta')) {
//     keywords = 'terracotta-pottery,handmade,indian-craft,traditional'
//   } else if (titleLower.includes('marble')) {
//     keywords = 'marble-sculpture,handmade,indian-art,traditional'
//   } else if (titleLower.includes('madhubani') || titleLower.includes('tanjore')) {
//     keywords = 'indian-painting,traditional-art,handmade,colorful'
//   } else if (titleLower.includes('anklet') || titleLower.includes('jhumka') || titleLower.includes('bangle') || titleLower.includes('maang')) {
//     keywords = 'indian-jewelry,silver,traditional,handmade'
//   } else if (titleLower.includes('spice') || titleLower.includes('kitchen')) {
//     keywords = 'indian-spice-box,brass,traditional,kitchen'
//   } else if (titleLower.includes('wedding') || titleLower.includes('anniversary')) {
//     keywords = 'indian-wedding-gift,traditional,decorative,handmade'
//   } else if (titleLower.includes('baby') || titleLower.includes('kids') || titleLower.includes('toy')) {
//     keywords = 'baby-gift,handmade,soft,indian-craft'
//   } else if (titleLower.includes('office') || titleLower.includes('stationery') || titleLower.includes('pen') || titleLower.includes('journal')) {
//     keywords = 'office-supplies,wooden,handmade,indian-craft'
//   } else if (titleLower.includes('nameplate') || titleLower.includes('name plate')) {
//     keywords = 'nameplate,wooden,engraved,handmade'
//   } else if (titleLower.includes('keychain')) {
//     keywords = 'keychain,metal,personalized,handmade'
//   } else if (titleLower.includes('calendar')) {
//     keywords = 'calendar,photo,personalized,handmade'
//   } else if (titleLower.includes('tote') || titleLower.includes('bag')) {
//     keywords = 'tote-bag,cotton,handwoven,indian-textile'
//   } else if (titleLower.includes('belt')) {
//     keywords = 'leather-belt,handmade,traditional,premium'
//   } else if (titleLower.includes('necklace')) {
//     keywords = 'indian-necklace,beaded,traditional,handmade'
//   } else if (titleLower.includes('earring')) {
//     keywords = 'indian-earrings,jhumka,traditional,handmade'
//   } else if (titleLower.includes('serving') || titleLower.includes('dining')) {
//     keywords = 'brass-serving-set,traditional,indian-dining,handmade'
//   } else if (titleLower.includes('clay') || titleLower.includes('cookware')) {
//     keywords = 'clay-cookware,traditional,indian-pottery,handmade'
//   } else if (titleLower.includes('water bottle')) {
//     keywords = 'copper-water-bottle,traditional,health,handmade'
//   } else if (titleLower.includes('spoon') || titleLower.includes('ladle')) {
//     keywords = 'wooden-spoons,handmade,kitchen,traditional'
//   } else if (titleLower.includes('carving')) {
//     keywords = 'wooden-carving,handmade,indian-art,traditional'
//   } else if (titleLower.includes('blanket')) {
//     keywords = 'baby-blanket,cotton,soft,handmade'
//   } else if (titleLower.includes('storybook') || titleLower.includes('book')) {
//     keywords = 'storybook,personalized,children,handmade'
//   } else if (titleLower.includes('paperweight')) {
//     keywords = 'brass-paperweight,traditional,office,handmade'
//   } else if (titleLower.includes('business card')) {
//     keywords = 'business-card-holder,wooden,engraved,handmade'
//   }

//   return `https://source.unsplash.com/800x800/?${keywords}&sig=${seed}${imgIndex}`
// }

// ============================================================================
// PRODUCT DEFINITIONS
// ============================================================================
// Products are organized by category ID
// To add a product: Add object to appropriate category array
// To add a category: Add category above + create new array below
export const productsByCategory = {
  "home-decor": [
    {
      id: 1,
      categoryId: "home-decor",
      title: "Handcrafted Wooden Jewelry Box",
      slug: "handcrafted-wooden-jewelry-box",
      description:
        "Beautiful handcrafted wooden jewelry box with intricate carvings. Perfect for storing your precious jewelry and keepsakes. Made from premium quality wood with a smooth finish. Features multiple compartments and a velvet-lined interior.",
      price: 2499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["wooden", "handcrafted", "jewelry", "storage"],
      meta: {
        keywords: ["jewelry box", "wooden box", "storage", "handcrafted"],
      },
    },
    {
      id: 4,
      categoryId: "home-decor",
      title: "Handmade Ceramic Dinner Set",
      slug: "handmade-ceramic-dinner-set",
      description:
        "Beautiful handcrafted ceramic dinner set featuring traditional Indian designs. Includes plates, bowls, and serving dishes. Each piece is unique and hand-painted. Perfect for special occasions or as a decorative piece.",
      price: 3499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["ceramic", "dinner set", "traditional", "handmade"],
      meta: {
        keywords: ["ceramic", "dinner set", "plates", "bowls", "traditional"],
      },
    },
    {
      id: 6,
      categoryId: "home-decor",
      title: "Handwoven Cotton Cushion Covers",
      slug: "handwoven-cotton-cushion-covers",
      description:
        "Set of 4 handwoven cotton cushion covers with traditional Indian motifs. Made from 100% organic cotton. Available in various color combinations and patterns. Adds a touch of elegance to your home decor.",
      price: 999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["cotton", "cushion", "handwoven", "organic"],
      meta: {
        keywords: ["cushion covers", "cotton", "handwoven", "decorative"],
      },
    },
    {
      id: 8,
      categoryId: "home-decor",
      title: "Handmade Brass Candle Holders",
      slug: "handmade-brass-candle-holders",
      description:
        "Set of 2 elegant brass candle holders with intricate traditional designs. Handcrafted by skilled artisans. Perfect for creating a warm and inviting atmosphere. Makes a beautiful decorative piece.",
      price: 1599,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["brass", "candle holders", "traditional", "decorative"],
      meta: {
        keywords: ["candle holders", "brass", "decorative", "traditional"],
      },
    },
    {
      id: 10,
      categoryId: "home-decor",
      title: "Traditional Indian Art Print",
      slug: "traditional-indian-art-print",
      description:
        "Beautiful framed art print featuring traditional Indian artwork. High-quality print on premium paper. Available in various sizes and designs. Perfect for adding cultural elegance to your home or office.",
      price: 2199,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["art", "print", "traditional", "framed"],
      meta: {
        keywords: ["art print", "traditional", "framed", "decorative"],
      },
    },
    {
      id: 12,
      categoryId: "home-decor",
      title: "Handmade Pottery Vase",
      slug: "handmade-pottery-vase",
      description:
        "Beautiful handcrafted pottery vase with unique designs. Made by skilled artisans using traditional techniques. Perfect for flowers or as a standalone decorative piece. Each vase is one-of-a-kind.",
      price: 2799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["pottery", "vase", "handmade", "unique"],
      meta: {
        keywords: ["pottery vase", "handmade", "decorative", "unique"],
      },
    },
    {
      id: 13,
      categoryId: "home-decor",
      title: "Traditional Brass Diya Set",
      slug: "traditional-brass-diya-set",
      description:
        "Set of 5 traditional brass diyas (oil lamps) with intricate designs. Perfect for festivals, prayers, and creating a warm ambiance. Handcrafted by skilled artisans using traditional methods. Each piece is polished to a beautiful shine.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["brass", "diya", "traditional", "festival"],
      meta: {
        keywords: ["brass diya", "oil lamp", "traditional", "festival"],
      },
    },
    {
      id: 14,
      categoryId: "home-decor",
      title: "Handwoven Jute Wall Hanging",
      slug: "handwoven-jute-wall-hanging",
      description:
        "Beautiful handwoven jute wall hanging with traditional Indian motifs. Made from natural jute fibers. Adds a rustic and elegant touch to any wall. Available in various sizes and designs.",
      price: 899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["jute", "wall hanging", "handwoven", "natural"],
      meta: {
        keywords: ["wall hanging", "jute", "handwoven", "decorative"],
      },
    },
    {
      id: 15,
      categoryId: "home-decor",
      title: "Copper Water Pot Set",
      slug: "copper-water-pot-set",
      description:
        "Set of 2 traditional copper water pots (lota) with hammered finish. Copper is known for its health benefits. Handcrafted by skilled coppersmiths. Perfect for traditional Indian homes or as decorative pieces.",
      price: 2199,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["copper", "water pot", "traditional", "health"],
      meta: {
        keywords: ["copper pot", "lota", "traditional", "health"],
      },
    },
    {
      id: 16,
      categoryId: "home-decor",
      title: "Handmade Terracotta Planters Set",
      slug: "handmade-terracotta-planters-set",
      description:
        "Set of 3 handcrafted terracotta planters in different sizes. Made from natural clay and fired using traditional methods. Perfect for indoor and outdoor plants. Each planter has unique texture and design.",
      price: 1499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["terracotta", "planters", "handmade", "natural"],
      meta: {
        keywords: ["terracotta planters", "handmade", "natural", "garden"],
      },
    },
    {
      id: 17,
      categoryId: "home-decor",
      title: "Traditional Wooden Wall Clock",
      slug: "traditional-wooden-wall-clock",
      description:
        "Beautiful handcrafted wooden wall clock with traditional Indian design elements. Made from premium quality wood with intricate carvings. Quartz movement ensures accurate timekeeping. Perfect for adding elegance to your home.",
      price: 3299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["wooden", "wall clock", "traditional", "handcrafted"],
      meta: {
        keywords: ["wall clock", "wooden", "traditional", "handcrafted"],
      },
    },
    {
      id: 18,
      categoryId: "home-decor",
      title: "Handwoven Bamboo Room Divider",
      slug: "handwoven-bamboo-room-divider",
      description:
        "Elegant handwoven bamboo room divider with traditional patterns. Made from sustainable bamboo. Perfect for creating privacy or dividing spaces. Lightweight yet sturdy construction.",
      price: 3999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["bamboo", "room divider", "handwoven", "sustainable"],
      meta: {
        keywords: ["room divider", "bamboo", "handwoven", "sustainable"],
      },
    },
  ],
  "personalized-gifts": [
    {
      id: 2,
      categoryId: "personalized-gifts",
      title: "Customized Photo Frame Set",
      slug: "customized-photo-frame-set",
      description:
        "Elegant photo frame set perfect for displaying your cherished memories. Available in various sizes and finishes. Can be customized with names, dates, or special messages. Makes a perfect gift for weddings, anniversaries, or birthdays.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["photo frame", "customized", "personalized", "memories"],
      meta: {
        keywords: ["photo frame", "customized", "personalized", "gift"],
      },
    },
    {
      id: 5,
      categoryId: "personalized-gifts",
      title: "Custom Engraved Watch",
      slug: "custom-engraved-watch",
      description:
        "Elegant wristwatch with custom engraving option. Choose from various designs and add personalized text or dates. Premium quality movement with leather or metal strap options. Perfect gift for special occasions.",
      price: 4499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["watch", "engraved", "custom", "premium"],
      meta: {
        keywords: ["watch", "engraved", "custom", "premium"],
      },
    },
    {
      id: 9,
      categoryId: "personalized-gifts",
      title: "Personalized Coffee Mug Set",
      slug: "personalized-coffee-mug-set",
      description:
        "Set of 2 ceramic coffee mugs with custom printing option. Add names, photos, or special messages. Dishwasher safe and microwave friendly. Perfect for couples or best friends.",
      price: 799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["coffee mug", "personalized", "ceramic", "custom"],
      meta: {
        keywords: ["coffee mug", "personalized", "custom", "ceramic"],
      },
    },
    {
      id: 11,
      categoryId: "personalized-gifts",
      title: "Customized Keychain Set",
      slug: "customized-keychain-set",
      description:
        "Set of 4 personalized keychains with custom text or initials. Made from durable materials. Available in various colors and finishes. Perfect as a small gift or party favor.",
      price: 499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["keychain", "customized", "personalized", "durable"],
      meta: {
        keywords: ["keychain", "customized", "personalized", "gift"],
      },
    },
    {
      id: 19,
      categoryId: "personalized-gifts",
      title: "Custom Engraved Nameplate",
      slug: "custom-engraved-nameplate",
      description:
        "Elegant wooden or brass nameplate with custom engraving. Perfect for office doors, home entrances, or as a gift. Available in various sizes and finishes. Add names, titles, or special messages.",
      price: 899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["nameplate", "engraved", "custom", "personalized"],
      meta: {
        keywords: ["nameplate", "engraved", "custom", "personalized"],
      },
    },
    {
      id: 20,
      categoryId: "personalized-gifts",
      title: "Personalized Birthstone Jewelry Box",
      slug: "personalized-birthstone-jewelry-box",
      description:
        "Beautiful jewelry box with personalized birthstone and name engraving. Made from premium materials with velvet-lined interior. Perfect gift for birthdays, anniversaries, or special occasions.",
      price: 2999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["jewelry box", "birthstone", "personalized", "premium"],
      meta: {
        keywords: ["jewelry box", "birthstone", "personalized", "gift"],
      },
    },
    {
      id: 21,
      categoryId: "personalized-gifts",
      title: "Custom Printed T-Shirt",
      slug: "custom-printed-t-shirt",
      description:
        "Premium quality cotton t-shirt with custom printing. Add names, photos, quotes, or designs. Available in various sizes and colors. Perfect for events, teams, or personal use.",
      price: 699,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["t-shirt", "custom", "printed", "personalized"],
      meta: {
        keywords: ["t-shirt", "custom", "printed", "personalized"],
      },
    },
    {
      id: 22,
      categoryId: "personalized-gifts",
      title: "Engraved Crystal Award",
      slug: "engraved-crystal-award",
      description:
        "Elegant crystal award with custom engraving. Perfect for recognition, achievements, or corporate gifts. Available in various shapes and sizes. Add names, dates, or special messages.",
      price: 2499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["crystal", "award", "engraved", "recognition"],
      meta: {
        keywords: ["crystal award", "engraved", "recognition", "gift"],
      },
    },
    {
      id: 23,
      categoryId: "personalized-gifts",
      title: "Custom Photo Calendar",
      slug: "custom-photo-calendar",
      description:
        "Beautiful wall calendar with your custom photos. Add 12 of your favorite photos, one for each month. Perfect gift for family, friends, or corporate use. High-quality printing on premium paper.",
      price: 1199,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["calendar", "photo", "custom", "personalized"],
      meta: {
        keywords: ["calendar", "photo", "custom", "personalized"],
      },
    },
  ],
  "fashion-accessories": [
    {
      id: 3,
      categoryId: "fashion-accessories",
      title: "Traditional Indian Silk Scarf",
      slug: "traditional-indian-silk-scarf",
      description:
        "Luxurious handwoven silk scarf featuring traditional Indian patterns and vibrant colors. Made from premium silk with intricate embroidery work. Perfect for adding elegance to any outfit. Available in multiple color combinations.",
      price: 1899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["silk", "scarf", "traditional", "handwoven"],
      meta: {
        keywords: ["silk scarf", "traditional", "handwoven", "fashion"],
      },
    },
    {
      id: 7,
      categoryId: "fashion-accessories",
      title: "Customized Leather Wallet",
      slug: "customized-leather-wallet",
      description:
        "Premium quality leather wallet with custom embossing option. Available in multiple colors and styles. Features multiple card slots and compartments. Can be personalized with initials or names.",
      price: 1799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["leather", "wallet", "customized", "premium"],
      meta: {
        keywords: ["leather wallet", "customized", "premium", "fashion"],
      },
    },
    {
      id: 24,
      categoryId: "fashion-accessories",
      title: "Handwoven Cotton Tote Bag",
      slug: "handwoven-cotton-tote-bag",
      description:
        "Eco-friendly handwoven cotton tote bag with traditional Indian patterns. Made from 100% organic cotton. Spacious and durable. Perfect for shopping, beach, or daily use. Available in various colors.",
      price: 799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["tote bag", "cotton", "handwoven", "eco-friendly"],
      meta: {
        keywords: ["tote bag", "cotton", "handwoven", "eco-friendly"],
      },
    },
    {
      id: 25,
      categoryId: "fashion-accessories",
      title: "Traditional Handloom Stole",
      slug: "traditional-handloom-stole",
      description:
        "Luxurious handloom stole with traditional Indian designs. Made from premium cotton or silk blend. Perfect for adding elegance to any outfit. Available in various colors and patterns.",
      price: 1499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["stole", "handloom", "traditional", "cotton"],
      meta: {
        keywords: ["stole", "handloom", "traditional", "fashion"],
      },
    },
    {
      id: 26,
      categoryId: "fashion-accessories",
      title: "Handmade Leather Belt",
      slug: "handmade-leather-belt",
      description:
        "Premium quality handmade leather belt with traditional buckle design. Made from genuine leather. Available in various sizes and colors. Can be customized with initials or patterns.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["belt", "leather", "handmade", "premium"],
      meta: {
        keywords: ["belt", "leather", "handmade", "fashion"],
      },
    },
  ],
  "jewelry-accessories": [
    {
      id: 27,
      categoryId: "jewelry-accessories",
      title: "Traditional Silver Anklets",
      slug: "traditional-silver-anklets",
      description:
        "Beautiful traditional silver anklets with intricate designs. Handcrafted by skilled artisans. Made from pure silver with traditional patterns. Perfect for festivals and special occasions.",
      price: 2499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["anklets", "silver", "traditional", "handcrafted"],
      meta: {
        keywords: ["anklets", "silver", "traditional", "jewelry"],
      },
    },
    {
      id: 28,
      categoryId: "jewelry-accessories",
      title: "Handmade Beaded Necklace Set",
      slug: "handmade-beaded-necklace-set",
      description:
        "Set of 3 handcrafted beaded necklaces with traditional Indian designs. Made from natural stones and beads. Each necklace is unique. Perfect for adding elegance to traditional and modern outfits.",
      price: 1899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["necklace", "beaded", "handmade", "traditional"],
      meta: {
        keywords: ["necklace", "beaded", "handmade", "jewelry"],
      },
    },
    {
      id: 29,
      categoryId: "jewelry-accessories",
      title: "Traditional Jhumka Earrings",
      slug: "traditional-jhumka-earrings",
      description:
        "Elegant traditional jhumka (dangler) earrings with intricate designs. Made from brass or silver with traditional patterns. Perfect for weddings, festivals, and special occasions. Available in various sizes.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["earrings", "jhumka", "traditional", "handcrafted"],
      meta: {
        keywords: ["earrings", "jhumka", "traditional", "jewelry"],
      },
    },
    {
      id: 30,
      categoryId: "jewelry-accessories",
      title: "Handcrafted Bangles Set",
      slug: "handcrafted-bangles-set",
      description:
        "Set of 6 handcrafted bangles with traditional designs. Made from brass, wood, or lacquer. Each bangle features unique patterns. Perfect for traditional Indian attire and festivals.",
      price: 999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["bangles", "handcrafted", "traditional", "set"],
      meta: {
        keywords: ["bangles", "handcrafted", "traditional", "jewelry"],
      },
    },
    {
      id: 31,
      categoryId: "jewelry-accessories",
      title: "Traditional Maang Tikka",
      slug: "traditional-maang-tikka",
      description:
        "Beautiful traditional maang tikka (forehead jewelry) with intricate designs. Made from brass or silver with traditional patterns. Perfect for weddings and special occasions. Available in various designs.",
      price: 1599,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["maang tikka", "forehead jewelry", "traditional", "wedding"],
      meta: {
        keywords: ["maang tikka", "forehead jewelry", "traditional", "jewelry"],
      },
    },
  ],
  "kitchen-dining": [
    {
      id: 32,
      categoryId: "kitchen-dining",
      title: "Traditional Brass Serving Set",
      slug: "traditional-brass-serving-set",
      description:
        "Complete brass serving set including plates, bowls, and serving spoons. Handcrafted by skilled artisans using traditional methods. Perfect for traditional Indian dining. Each piece is polished to perfection.",
      price: 4499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
    {
      id: 33,
      categoryId: "kitchen-dining",
      title: "Handmade Clay Cookware Set",
      slug: "handmade-clay-cookware-set",
      description:
        "Set of traditional clay cookware including pots and pans. Made from natural clay using traditional methods. Enhances food flavor and retains nutrients. Perfect for healthy cooking.",
      price: 1999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["clay", "cookware", "traditional", "healthy"],
      meta: {
        keywords: ["clay cookware", "traditional", "healthy", "kitchen"],
      },
    },
    {
      id: 34,
      categoryId: "kitchen-dining",
      title: "Copper Water Bottle",
      slug: "copper-water-bottle",
      description:
        "Traditional copper water bottle with modern design. Copper is known for its health benefits including antimicrobial properties. Handcrafted with hammered finish. Perfect for daily use.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["copper", "water bottle", "health", "traditional"],
      meta: {
        keywords: ["copper water bottle", "health", "traditional", "kitchen"],
      },
    },
    {
      id: 35,
      categoryId: "kitchen-dining",
      title: "Handwoven Bamboo Dinnerware Set",
      slug: "handwoven-bamboo-dinnerware-set",
      description:
        "Eco-friendly bamboo dinnerware set including plates, bowls, and serving trays. Made from sustainable bamboo. Lightweight, durable, and perfect for outdoor dining or daily use.",
      price: 1799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["bamboo", "dinnerware", "eco-friendly", "sustainable"],
      meta: {
        keywords: [
          "bamboo dinnerware",
          "eco-friendly",
          "sustainable",
          "kitchen",
        ],
      },
    },
    {
      id: 36,
      categoryId: "kitchen-dining",
      title: "Traditional Spice Box Set",
      slug: "traditional-spice-box-set",
      description:
        "Beautiful traditional spice box (masala dabba) with multiple compartments. Made from stainless steel or brass. Perfect for storing and organizing spices. Essential for Indian cooking.",
      price: 899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["spice box", "traditional", "kitchen", "organizer"],
      meta: {
        keywords: ["spice box", "masala dabba", "traditional", "kitchen"],
      },
    },
    {
      id: 37,
      categoryId: "kitchen-dining",
      title: "Handcrafted Wooden Spoons Set",
      slug: "handcrafted-wooden-spoons-set",
      description:
        "Set of 6 handcrafted wooden spoons and ladles. Made from premium quality wood. Perfect for cooking and serving. Each piece is smooth and polished. Safe for non-stick cookware.",
      price: 699,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["wooden spoons", "handcrafted", "kitchen", "cooking"],
      meta: {
        keywords: ["wooden spoons", "handcrafted", "kitchen", "cooking"],
      },
    },
  ],
  "art-collectibles": [
    {
      id: 38,
      categoryId: "art-collectibles",
      title: "Handmade Marble Sculpture",
      slug: "handmade-marble-sculpture",
      description:
        "Beautiful handcrafted marble sculpture featuring traditional Indian motifs. Made from premium quality marble by skilled artisans. Perfect for home decor or as a collectible piece. Each sculpture is unique.",
      price: 5999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: true,
      inStock: true,
      tags: ["marble", "sculpture", "handmade", "traditional"],
      meta: {
        keywords: ["marble sculpture", "handmade", "traditional", "art"],
      },
    },
    {
      id: 39,
      categoryId: "art-collectibles",
      title: "Traditional Madhubani Painting",
      slug: "traditional-madhubani-painting",
      description:
        "Authentic Madhubani (Mithila) painting on canvas or paper. Hand-painted by skilled artists using traditional techniques. Features vibrant colors and intricate patterns. Perfect for home decor.",
      price: 3499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["madhubani", "painting", "traditional", "art"],
      meta: {
        keywords: ["madhubani painting", "traditional", "art", "collectible"],
      },
    },
    {
      id: 40,
      categoryId: "art-collectibles",
      title: "Handcrafted Wooden Carving",
      slug: "handcrafted-wooden-carving",
      description:
        "Intricate wooden carving featuring traditional Indian designs. Made from premium quality wood by skilled craftsmen. Perfect for wall decoration or as a standalone art piece. Each carving is unique.",
      price: 2799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["wooden carving", "handcrafted", "traditional", "art"],
      meta: {
        keywords: ["wooden carving", "handcrafted", "traditional", "art"],
      },
    },
    {
      id: 41,
      categoryId: "art-collectibles",
      title: "Traditional Tanjore Painting",
      slug: "traditional-tanjore-painting",
      description:
        "Beautiful Tanjore painting with gold foil work and gemstones. Handcrafted by skilled artists using traditional techniques. Features religious or mythological themes. Perfect for home or temple.",
      price: 4999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["tanjore painting", "traditional", "gold foil", "art"],
      meta: {
        keywords: ["tanjore painting", "traditional", "gold foil", "art"],
      },
    },
  ],
  "wedding-occasions": [
    {
      id: 42,
      categoryId: "wedding-occasions",
      title: "Custom Wedding Favor Box Set",
      slug: "custom-wedding-favor-box-set",
      description:
        "Beautiful custom wedding favor boxes with couple names and wedding date. Made from premium materials. Perfect for gifting to wedding guests. Can be customized with colors, designs, and messages.",
      price: 1999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["wedding favor", "custom", "wedding", "personalized"],
      meta: {
        keywords: ["wedding favor", "custom", "wedding", "gift"],
      },
    },
    {
      id: 43,
      categoryId: "wedding-occasions",
      title: "Engraved Wedding Plaque",
      slug: "engraved-wedding-plaque",
      description:
        "Elegant wedding plaque with couple names, wedding date, and special message. Made from premium wood or metal. Perfect for wedding decoration or as a keepsake. Can be customized with designs.",
      price: 2499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["wedding plaque", "engraved", "wedding", "keepsake"],
      meta: {
        keywords: ["wedding plaque", "engraved", "wedding", "gift"],
      },
    },
    {
      id: 44,
      categoryId: "wedding-occasions",
      title: "Traditional Wedding Gift Set",
      slug: "traditional-wedding-gift-set",
      description:
        "Complete traditional wedding gift set including brass items, decorative pieces, and traditional accessories. Perfect for gifting to newlyweds. Packaged beautifully in traditional style.",
      price: 4999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["wedding gift", "traditional", "set", "brass"],
      meta: {
        keywords: ["wedding gift", "traditional", "set", "gift"],
      },
    },
    {
      id: 45,
      categoryId: "wedding-occasions",
      title: "Custom Anniversary Gift Box",
      slug: "custom-anniversary-gift-box",
      description:
        "Beautiful custom anniversary gift box with couple names and anniversary date. Includes curated traditional gifts. Perfect for celebrating milestones. Can be customized with items and messages.",
      price: 2999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["anniversary", "gift box", "custom", "traditional"],
      meta: {
        keywords: ["anniversary gift", "custom", "gift box", "gift"],
      },
    },
  ],
  "kids-baby": [
    {
      id: 46,
      categoryId: "kids-baby",
      title: "Handmade Wooden Toys Set",
      slug: "handmade-wooden-toys-set",
      description:
        "Set of traditional handmade wooden toys including puzzles, blocks, and figurines. Made from safe, non-toxic materials. Perfect for developing motor skills and creativity. Safe for children.",
      price: 1499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["wooden toys", "handmade", "kids", "safe"],
      meta: {
        keywords: ["wooden toys", "handmade", "kids", "toys"],
      },
    },
    {
      id: 47,
      categoryId: "kids-baby",
      title: "Personalized Baby Name Plate",
      slug: "personalized-baby-name-plate",
      description:
        "Beautiful personalized name plate for baby room. Made from premium wood with custom engraving. Includes baby name, birth date, and optional design. Perfect for nursery decoration.",
      price: 999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["baby name plate", "personalized", "nursery", "custom"],
      meta: {
        keywords: ["baby name plate", "personalized", "nursery", "gift"],
      },
    },
    {
      id: 48,
      categoryId: "kids-baby",
      title: "Handwoven Baby Blanket",
      slug: "handwoven-baby-blanket",
      description:
        "Soft handwoven baby blanket made from organic cotton. Features traditional Indian patterns and vibrant colors. Perfect for keeping baby warm and comfortable. Safe and gentle on sensitive skin.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["baby blanket", "handwoven", "organic", "cotton"],
      meta: {
        keywords: ["baby blanket", "handwoven", "organic", "baby"],
      },
    },
    {
      id: 49,
      categoryId: "kids-baby",
      title: "Custom Storybook with Child Name",
      slug: "custom-storybook-with-child-name",
      description:
        "Personalized storybook featuring your child as the main character. Includes child name throughout the story. Beautiful illustrations and engaging story. Perfect gift for birthdays or special occasions.",
      price: 899,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["storybook", "personalized", "kids", "custom"],
      meta: {
        keywords: ["storybook", "personalized", "kids", "gift"],
      },
    },
  ],
  "office-stationery": [
    {
      id: 50,
      categoryId: "office-stationery",
      title: "Handcrafted Wooden Pen Stand",
      slug: "handcrafted-wooden-pen-stand",
      description:
        "Elegant handcrafted wooden pen stand with multiple compartments. Made from premium quality wood with smooth finish. Perfect for organizing pens, pencils, and office supplies. Adds elegance to any desk.",
      price: 799,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["pen stand", "wooden", "handcrafted", "office"],
      meta: {
        keywords: ["pen stand", "wooden", "handcrafted", "office"],
      },
    },
    {
      id: 51,
      categoryId: "office-stationery",
      title: "Custom Engraved Business Card Holder",
      slug: "custom-engraved-business-card-holder",
      description:
        "Premium business card holder with custom engraving. Made from wood or metal. Perfect for professional use. Can be personalized with name, company, or logo. Elegant and professional design.",
      price: 1299,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["business card holder", "engraved", "custom", "office"],
      meta: {
        keywords: ["business card holder", "engraved", "custom", "office"],
      },
    },
    {
      id: 52,
      categoryId: "office-stationery",
      title: "Handmade Leather Journal",
      slug: "handmade-leather-journal",
      description:
        "Beautiful handmade leather journal with traditional binding. Made from premium quality leather. Features lined or blank pages. Perfect for writing, journaling, or as a gift. Can be personalized with initials.",
      price: 1499,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["journal", "leather", "handmade", "writing"],
      meta: {
        keywords: ["journal", "leather", "handmade", "stationery"],
      },
    },
    {
      id: 53,
      categoryId: "office-stationery",
      title: "Traditional Brass Paperweight Set",
      slug: "traditional-brass-paperweight-set",
      description:
        "Set of 2 traditional brass paperweights with intricate designs. Handcrafted by skilled artisans. Perfect for keeping papers organized. Adds elegance to any desk. Makes a great gift.",
      price: 999,
      images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["paperweight", "brass", "traditional", "office"],
      meta: {
        keywords: ["paperweight", "brass", "traditional", "office"],
      },
    },
  ],
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all products as a flat array
 * Useful for search and general product listing
 */
export const getAllProducts = () => {
  return Object.values(productsByCategory).flat();
};

/**
 * Get products by category ID or slug
 */
export const getProductsByCategory = (categoryIdOrSlug) => {
  if (!categoryIdOrSlug || categoryIdOrSlug === "all") {
    return getAllProducts();
  }

  // Find category by ID or slug
  const category = categories.find(
    (cat) => cat.id === categoryIdOrSlug || cat.slug === categoryIdOrSlug,
  );

  if (!category) {
    return [];
  }

  return productsByCategory[category.id] || [];
};

/**
 * Get product by ID
 */
export const getProductById = (id) => {
  const allProducts = getAllProducts();
  return allProducts.find((product) => product.id === parseInt(id));
};

/**
 * Get product by slug
 */
export const getProductBySlug = (slug) => {
  const allProducts = getAllProducts();
  return allProducts.find((product) => product.slug === slug);
};

/**
 * Get category by ID or slug
 */
export const getCategoryByIdOrSlug = (idOrSlug) => {
  return categories.find((cat) => cat.id === idOrSlug || cat.slug === idOrSlug);
};

/**
 * Get featured products
 */
export const getFeaturedProducts = () => {
  return getAllProducts().filter((product) => product.featured);
};

/**
 * Get popular products
 */
export const getPopularProducts = () => {
  return getAllProducts().filter((product) => product.popular);
};

/**
 * Get featured categories
 */
export const getFeaturedCategories = () => {
  return categories
    .filter((cat) => cat.featured)
    .sort((a, b) => a.order - b.order);
};

/**
 * Get all categories sorted by order
 */
export const getSortedCategories = () => {
  return [...categories].sort((a, b) => a.order - b.order);
};

/**
 * Get category product count
 */
export const getCategoryProductCount = (categoryId) => {
  const categoryProducts = productsByCategory[categoryId] || [];
  return categoryProducts.length;
};

// ============================================================================
// BACKWARD COMPATIBILITY
// ============================================================================
// Maintain compatibility with existing code
// Add category name to products for backward compatibility
export const products = getAllProducts().map((product) => {
  const category = getCategoryByIdOrSlug(product.categoryId);
  return {
    ...product,
    // Add category name for backward compatibility
    category: category?.name || product.categoryId,
  };
});

// Legacy category format for backward compatibility
export const categoriesLegacy = categories.map((cat) => ({
  id: cat.id,
  name: cat.name,
  icon: cat.icon,
  count: getCategoryProductCount(cat.id),
}));

// Legacy getProductsByCategory that works with category names
export const getProductsByCategoryName = (categoryName) => {
  if (!categoryName || categoryName === "All") return getAllProducts();
  const category = categories.find((cat) => cat.name === categoryName);
  if (!category) return [];
  return getProductsByCategory(category.id);
};

// Legacy functions
export const getPopularItems = getPopularProducts;
export const getItemsByCategory = getProductsByCategoryName;
