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
    id: "Crochet",
    name: "Handmade Crochet",
    slug: "Crochet",
    description: "Beautiful crochet handmade products",
    icon: "home",
    order: 1, // Display order
    featured: true, // Show in featured sections
    meta: {
      keywords: ["crochet", "flowers", "bouquets", "handmade", "anniversary","gift"],
    },
  },
  {
    id: "Candles",
    name: "Candles",
    slug: "Candles",
    description: "Beautiful fragnant candles, customisations available",
    icon: "gift",
    order: 2,
    featured: true,
    meta: {
      keywords: ["personalized", "candles", "gift", "candle", "birthday","anniversary"],
    },
  },
  {
    id: "Handbags",
    name: "Handbags",
    slug: "Handbags",
    description: "Elegant fashion items and bags",
    icon: "fashion",
    order: 3,
    featured: true,
    meta: {
      keywords: ["bags", "handbags", "prints", "printed", "bag"],
    },
  },
  {
    id: "Frames&Paintings",
    name: "Frames & Paintings",
    slug: "Frames&Paintings",
    description: "Handmade paintings in beautiful frames",
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
    id: "Home-decor",
    name: "Home decor",
    slug: "Home-decor",
    description: "Fancy home and dining utilities",
    icon: "kitchen",
    order: 5,
    featured: true,
    meta: {
      keywords: ["homedecor", "decor", "glasses", "glass", "homeutilities"],
    },
  },
  /*{
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
  },*/
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
  "Crochet": [
    {
      id: 1,
      categoryId: "Crochet",
      title: "Handcrafted Yarn Tulip",
      slug: "Handcrafted-yarn-tulip-single-stem",
      description:
        "A cute, forever-flower tulip made with soft yarn and a sturdy stem—won’t wilt, won’t fade. Perfect for gifting as a mini bouquet/add-on gift; available in multiple colors (mix & match)..",
      price: 199,
      images: ["/images/1.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["yarn", "tulip", "crochet", "forever-flower", "gift"],
      meta: {
        keywords: ["tulip", "crochet flower", "forever", "gift", "handcrafted"],
      },
    },
    {
      id: 4,
      categoryId: "Crochet",
      title: "Crochet Flower Bouquet",
      slug: "handmade-crochet-flower-bouquet",
      description:
      "A cute, forever-flower bouquet handcrafted with soft yarn and wrapped in aesthetic pastel packaging. Choose from multiple flower styles and colors—perfect for birthdays, anniversaries, or a “just because” gift.",
      price: 249,
      images: ["/images/2.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["bouquet", "crochet", "yarn", "birthday", "gift"],
      meta: {
        keywords: ["crochet bouquet", "yarn flowers", "gift", "birthday", "anniversary"],
      },
    },
    {
      id: 6,
      categoryId: "Crochet",
      title: "Crochet Flower Pot",
      slug: "handmade-crochet-flower-pot",
      description:
        "A charming mini flower pot made with crochet—bright, durable, and zero-maintenance. Available in multiple colors and styles, it’s a perfect desk décor piece or a cute gifting add-on.",
      price: 299,
      images: ["/images/3.png","/images/3-1.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["crochet", "pot", "decor", "handmade", "gift"],
      meta: {
        keywords: ["crochet pot", "flower pot", "desk decor", "handmade", "gift"],
      },
    },
    {
      id: 8,
      categoryId: "Crochet",
      title: "Crochet Flower Bouquet",
      slug: "crochet-flower-bouquet",
      description:
        "A detailed crochet bouquet with layered florals and greens, wrapped in a premium pastel sleeve and ribbon. A forever keepsake for birthdays, anniversaries, or proposals—available in multiple color themes.",
      price: 399,
      images: ["/images/4.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["bouquet", "crochet", "keepsake", "layered", "gift"],
      meta: {
        keywords: ["bouquet", "flowers", "proposal gift", "anniversary", "keepsake"],
      },
    },
    {
      id: 10,
      categoryId: "Crochet",
      title: "Crochet Flower Keychain",
      slug: "crochet-flower-keychain",
      description:
        "A cute crochet flower keychain with soft petals and a sturdy key ring—instant fresh pop for your keys or bag. Available in multiple flower designs and colors; lightweight but eye-catching for everyday use.",
      price: 79,
      images: ["/images/5.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["keychain", "crochet", "flower", "cute", "handmade"],
      meta: {
        keywords: ["crochet keychain", "flower keychain", "cute", "handmade", "gift"],
      },
    },
    {
      id: 12,
      categoryId: "Crochet",
      title: "Crochet Keychain Collection",
      slug: "crochet-keychain-collection",
      description:
        "A super-cute set of crochet keychains in multiple designs—flowers, strawberries, cherries, and more—each one made to stand out. Lightweight, durable, and perfect for gifting or adding instant fresh pop to your keys or bag.",
      price: 79,
      images: ["/images/6.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["keychain", "crochet", "collection", "cute", "gift"],
      meta: {
        keywords: ["keychain", "handmade", "cute gift", "strawberry", "cherry"],
      },
    },
    /*{
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
    },*/
  ],
  "Candles": [
    {
      id: 2,
      categoryId: "Candles",
      title: "Strawberry Dessert Candle",
      slug: "strawberry-dessert-candle",
      description:
        "A dessert-style candle crafted to look like a strawberry parfait—complete with a creamy top layer and berry detailing. Perfect for gifting or home décor; looks delicious on a bedside table, desk, or vanity.",
      price: 518,
      images: ["/images/7.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["candle", "strawberry", "dessert", "scented", "gift"],
      meta: {
        keywords: ["dessert", "strawberry", "scented", "gift", "home decor"],
      },
    },
    {
      id: 5,
      categoryId: "Candles",
      title: "Heart Layered Jar Candle",
      slug: "heart-layered-jar-candle",
      description:
        "A romantic layered candle in a glass jar with heart detailing—made to set the mood instantly. Perfect for date nights, anniversaries, and gifting; looks stunning as table décor even when unlit..",
      price: 599,
      images: ["/images/8.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["candle", "romantic", "layered", "anniversary", "scented"],
      meta: {
        keywords: ["romantic", "layered", "anniversary", "scented", "date night"],
      },
    },
    {
      id: 9,
      categoryId: "Candles",
      title: "Rose Layered Jar Candle",
      slug: "rose-layered-jar-candle",
      description:
        "A romantic layered candle in a glass jar with rose-toned detailing—made to set the mood instantly. Perfect for date nights, anniversaries, and gifting; looks elegant as table décor even when unlit.",
      price: 599,
      images: ["/images/9.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["candle", "romantic", "rose", "anniversary", "scented"],
      meta: {
        keywords: ["rose", "romantic", "layered candle", "anniversary", "scented"],
      },
    },
    {
      id: 11,
      categoryId: "Candles",
      title: "Ocean Breeze Dessert Candle",
      slug: "ocean-breeze-dessert-candle",
      description:
        "A beach-inspired dessert candle in a glass jar with ocean-blue layers, whipped wax topping, and seashell detailing. Perfect for gifting or coastal home décor—looks like a mini seaside treat even when unlit.",
      price: 879,
      images: ["/images/10.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["candle", "ocean", "coastal", "dessert", "scented"],
      meta: {
        keywords: ["ocean", "coastal", "dessert", "scented", "beach decor"],
      },
    },
    {
      id: 19,
      categoryId: "Candles",
      title: "Mini Bucket Candlee",
      slug: "mini-bucket-candle",
      description:
        "A fun mini candle poured in a colorful bucket jar—cute, compact, and perfect for brightening up any corner. Great for gifting or desk décor; available in multiple colors and (optionally) different fragrances.",
      price: 899,
      images: ["/images/11.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["candle", "mini", "bucket", "colorful", "scented"],
      meta: {
        keywords: ["candle", "bucket", "desk", "scented", "colorful"],
      },
    },
    /*{
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
    },*/
  ],
  "Handbags": [
    {
      id: 3,
      categoryId: "Handbags",
      title: "Fiery Tote Bag",
      slug: "fiery-tote-bag",
      description:
        "A bold everyday tote with a flame print that adds instant edge to your fit and your carry. Spacious, lightweight, and easy to sling on—perfect for college, work, or quick errands.",
      price: 249,
      images: ["/images/12.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["tote", "flame", "bold", "everyday", "canvas"],
      meta: {
        keywords: ["tote bag", "flame print", "everyday bag", "canvas", "college"],
      },
    },
    {
      id: 7,
      categoryId: "Handbags",
      title: "Heart Print Tote Bag",
      slug: "heart-print-tote-bag",
      description:
        "A clean canvas tote with playful heart prints—easy to style and roomy enough for everyday essentials. Lightweight, comfortable to carry, and perfect for college, work, or casual outings.",
      price: 249,
      images: ["/images/13.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["tote", "heart", "canvas", "playful", "everyday"],
      meta: {
        keywords: ["heart print tote", "canvas tote", "everyday bag", "college bag", "cute"],
      },
    },
    {
      id: 24,
      categoryId: "Handbags",
      title: "Sunflower Butterfly Tote Bag",
      slug: "sunflower-butterfly-tote-bag",
      description:
        "A statement black tote with a sunflower-and-butterflies artwork that instantly brightens your everyday carry. Roomy, lightweight, and sturdy—perfect for college, work, errands, or gifting.",
      price: 299,
      images: ["/images/14.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["tote", "sunflower", "butterfly", "statement", "art"],
      meta: {
        keywords: ["sunflower tote", "butterfly tote", "statement bag", "canvas", "artwork"],
      },
    },
    {
      id: 25,
      categoryId: "Handbags",
      title: "Sunflower Butterfly Tote Bag",
      slug: "sunflower-butterfly-tote-bag",
      description:
        "A statement black tote with a sunflower-and-butterflies artwork that instantly brightens your everyday carry. Roomy, lightweight, and sturdy—perfect for college, work, errands, or gifting.",
      price: 349,
      images: ["/images/15.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["tote", "sunflower", "butterfly", "statement", "art"],
      meta: {
        keywords: ["sunflower tote", "butterfly tote", "statement bag", "canvas", "artwork"],
      },
    },
    {
      id: 26,
      categoryId: "Handbags",
      title: "Hand-Painted Boot Tote Bag",
      slug: "hand-painted-boot-tote-bag",
      description:
        "A sleek black tote with a hand-painted boot motif and bead detailing—subtle, artsy, and statement-worthy. Roomy and lightweight for everyday use; perfect for college, work, or gifting to someone with bold style.",
      price: 349,
      images: ["/images/16.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["tote", "boot", "hand-painted", "artsy", "statement"],
      meta: {
        keywords: ["hand-painted tote", "boot tote", "artsy bag", "canvas", "beaded"],
      },
    },
  ],
  "Frames&Paintings": [
    {
      id: 27,
      categoryId: "Frames&Paintings",
      title: "Pressed Flower Memory Frame",
      slug: "pressed-flower-memory-frame",
      description:
        "Preserve your special moments with real pressed flowers, arranged into an elegant keepsake frame. Perfect for gifting or home décor—ideal for wedding flowers, anniversaries, or meaningful memories you want to keep forever.",
      price: 1859,
      images: ["/images/17.png", "/images/17-1.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["flowers", "memory", "frame", "keepsake", "wedding"],
      meta: {
        keywords: ["pressed flower frame", "memory keepsake", "wedding flowers", "home decor", "gift"],
      },
    },
    {
      id: 28,
      categoryId: "Frames&Paintings",
      title: "Pressed Flower Wall Frame",
      slug: "pressed-flower-wall-frame",
      description:
        "Real pressed flowers arranged in a minimal, elegant frame—perfect for adding a soft, natural touch to your space. A timeless décor piece for bedrooms, living rooms, or gifting to someone who loves subtle aesthetics.",
      price: 1439,
      images: ["/images/18-1.png", "/images/18.png", "/images/18-2.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["flowers", "frame", "minimal", "natural", "decor"],
      meta: {
        keywords: ["pressed flower frame", "wall decor", "minimal aesthetic", "home decor", "gift"],
      },
    },
    {
      id: 29,
      categoryId: "Frames&Paintings",
      title: "Pressed Petal Heart Frame",
      slug: "pressed-petal-heart-frame",
      description:
        "A romantic wall frame made with real pressed petals, arranged around a heart cut-out for a warm, timeless look. Perfect for anniversaries, weddings, and meaningful gifts—adds a soft pop of color to any room.",
      price: 1509,
      images: ["/images/19.png", "/images/19-1.png", "/images/19-2.png"],
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
      categoryId: "Frames&Paintings",
      title: "Pressed Flower Skull Art Frame",
      slug: "pressed-flower-skull-art-frame",
      description:
        "A bold mixed-media frame featuring a monochrome skull illustration accented with real pressed flowers and leaves. A statement décor piece for modern homes—perfect for gifting to someone who loves edgy, artsy aesthetics.",
      price: 1859,
      images: ["/images/20.png", "/images/20-1.png"],
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
      categoryId: "Frames&Paintings",
      title: "Pressed Flower Botanical Frame",
      slug: "pressed-flower-botanical-frame",
      description:
        "A minimal, elegant frame with real pressed flowers and leaves arranged on textured handmade paper. A timeless décor piece for desks or walls—perfect for housewarmings, birthdays, or calm aesthetic spaces.",
      price: 1689,
      images: ["/images/21.png", "/images/21-1.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["maang tikka", "forehead jewelry", "traditional", "wedding"],
      meta: {
        keywords: ["maang tikka", "forehead jewelry", "traditional", "jewelry"],
      },
    },
  ],
  "Home-decor": [
    {
      id: 32,
      categoryId: "Home-decor",
      title: "Rhinestone Heart Champagne Flutes",
      slug: "rhinestone-heart-champagne-flutes-set-of-2",
      description:
        "A luxe pair of champagne flutes with heart-shaped rhinestone detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 2199,
      images: ["/images/28.png"],
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
      categoryId: "Home-decor",
      title: "Spiral Champagne Flutes",
      slug: "Spiral Champagne Flutes",
      description:
        "A luxe pair of champagne flutes with Spiral rhinestone detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 1499,
      images: ["/images/23.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
    {
      id: 34,
      categoryId: "Home-decor",
      title: "Twirl Rhinestone Champagne Flutes",
      slug: "Twirl Rhinestone Champagne Flutes",
      description:
        "A luxe pair of twirl rhinestone flutes with heart-shaped rhinestone detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 1499,
      images: ["/images/24.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
    {
      id: 35,
      categoryId: "Home-decor",
      title: "Minimal Champagne Flutes",
      slug: "Minimal Champagne Flutes",
      description:
        "A luxe pair of champagne flutes with minimal rhinestone detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 1499,
      images: ["/images/25.png"],
      popular: false,
      featured: false,
      inStock: true,
         tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
    {
      id: 36,
      categoryId: "Home-decor",
      title: "Beaded Neck Champagne Flutes",
      slug: "Beaded Neck Champagne Flutes",
      description:
        "A luxe pair of champagne flutes with Beaded Neck detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 2199,
      images: ["/images/26.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
    {
      id: 37,
      categoryId: "Home-decor",
      title: "Rhinestoned Champagne Flutes",
      slug: "Rhinestoned Champagne Flutes",
      description:
        "A luxe pair of Rhinestoned champagne flutes with heart-shaped rhinestone detailing and elegant gold accents for a glam toast. Perfect for weddings, anniversaries, proposals, and gifting—made to elevate any celebration table.",
      price: 2199,
      images: ["/images/27.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["brass", "serving set", "traditional", "dining"],
      meta: {
        keywords: ["brass serving set", "traditional", "dining", "kitchen"],
      },
    },
  ],
  /*"art-collectibles": [
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
  ],*/
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
