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
  {
    id: "resin-products",
    name: "Resin Products",
    slug: "resin-products",
    description: "Resin art and collectible items",
    icon: "art",
    order: 6,
    featured: true,
    meta: {
      keywords: ["art","resin","frames","flowers"],
    },
  },
  {
    id: "Handmade-Accessories",
    name: "Handmade Accessories",
    slug: "Handmade-Accessories",
    description: "Accessories for weddings and celebrations",
    icon: "wedding",
    order: 7,
    featured: true,
    meta: {
      keywords: ["wedding", "occasion", "celebration", "gift", "special"],
    },
  },
  {
    id: "Customised-Hampers",
    name: "Customised Hampers",
    slug: "Customised-Hampers",
    description: "Thoughtful gifts for hampers",
    icon: "hampers",
    order: 8,
    featured: false,
    meta: {
      keywords: ["gifts", "hampers", "rakhi", "anniversary", "birthday","gift"],
    },
  },
  {
    id: "Handmade-Soaps",
    name: "Handmade Soaps",
    slug: "Handmade-Soaps",
    description: "Handcrafted soaps in various fragnances",
    icon: "soaps",
    order: 9,
    featured: false,
    meta: {
      keywords: ["soaps", "handwash", "fragnance", "soap", "hanging"],
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
  "Crochet": [
    {
      id: 1,
      categoryId: "Crochet",
      title: "Handcrafted Yarn Tulip",
      slug: "Handcrafted-yarn-tulip-single-stem",
      description:
        "A cute, forever-flower tulip made with soft yarn and a sturdy stem—won’t wilt, won’t fade. Perfect for gifting as a mini bouquet/add-on gift; available in multiple colors (mix & match)..",
      price: 219,  //199
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
      price: 269,    //249
      images: ["/images/2.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["bouquet", "crochet", "yarn", "birthday", "gift"],
      meta: {
        keywords: ["bouquet", "yarn flowers", "gift", "birthday", "anniversary", "flowers"],
      },
    },
    {
      id: 6,
      categoryId: "Crochet",
      title: "Crochet Flower Pot",
      slug: "handmade-crochet-flower-pot",
      description:
        "A charming mini flower pot made with crochet—bright, durable, and zero-maintenance. Available in multiple colors and styles, it’s a perfect desk décor piece or a cute gifting add-on.",
      price: 329,   //299
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
      price: 439,  //399
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
      price: 89,  //79
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
      price: 89,  //79
      images: ["/images/6.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["keychain", "crochet", "collection", "cute", "gift"],
      meta: {
        keywords: ["keychain", "handmade", "cute gift", "strawberry", "cherry"],
      },
    },
    {
      id: 56,
      categoryId: "Crochet",
      title: "Handmade Crochet Flower Bouquet",
      slug: "handmade-crochet-flower-bouquet",
      description:
        "A beautifully handcrafted crochet flower bouquet designed to last forever. Made with soft yarn and detailed stitching, it’s a thoughtful alternative to fresh flowers that fade away. Perfect for birthdays, anniversaries, or anyone who prefers a meaningful and permanent gift.",
      price: 2199,  
      images: ["/images/39.png"], //hooksndhheart
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "handmade", "gift"],
      meta: {
        keywords: ["everlasting", "yarn", "floral", "decor", "keepsake"],
      },
    },
    {
      id: 57,
      categoryId: "Crochet",
      title: "Pink Crochet Flower Bouquet",
      slug: "pink-crochet-flower-bouquet",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 1749,
      images: ["/images/43.png","/images/44.png","/images/43.png"], //hooksndhheart
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 62,
      categoryId: "Crochet",
      title: "Dancing Daisies",
      slug: "Dancing-Daisies",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 349,
      images: ["/images/53.png","/images/53-1.png"], //LillyPad
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 63,
      categoryId: "Crochet",
      title: "Single Flower Pot",
      slug: "Dancing-Daisies",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 149,
      images: ["/images/49.png","/images/49-1.png","/images/49-2.png"], //LillyPad
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 66,
      categoryId: "Crochet",
      title: "Handmade Colourful Shawl ",
      slug: "Dancing-Daisies",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 2299,
      images: ["/images/54.png","/images/54-1.png","/images/54-2.png"], //Reena's Crochet
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
  ],
  "Candles": [
    {
      id: 2,
      categoryId: "Candles",
      title: "Strawberry Dessert Candle",
      slug: "strawberry-dessert-candle",
      description:
        "A dessert-style candle crafted to look like a strawberry parfait—complete with a creamy top layer and berry detailing. Perfect for gifting or home décor; looks delicious on a bedside table, desk, or vanity.",
      price: 569,  //518
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
      price: 659, //599
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
      price: 659, //599
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
      price: 949, //899
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
      title: "Mini Bucket Candles",
      slug: "mini-bucket-candle",
      description:
        "A fun mini candle poured in a colorful bucket jar—cute, compact, and perfect for brightening up any corner. Great for gifting or desk décor; available in multiple colors and (optionally) different fragrances.",
      price: 949,  //899
      images: ["/images/11.png"],
      popular: true,
      featured: false,
      inStock: true,
      tags: ["candle", "mini", "bucket", "colorful", "scented"],
      meta: {
        keywords: ["candle", "bucket", "desk", "scented", "colorful"],
      },
    },
  ],
  "Handbags": [
    {
      id: 3,
      categoryId: "Handbags",
      title: "Fiery Tote Bag",
      slug: "fiery-tote-bag",
      description:
        "A bold everyday tote with a flame print that adds instant edge to your fit and your carry. Spacious, lightweight, and easy to sling on—perfect for college, work, or quick errands.",
      price: 279, //249
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
      price: 279, //249
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
      price: 329, //299
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
      price: 389, //349 
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
      price: 389, //349
      images: ["/images/16.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["tote", "boot", "hand-painted", "artsy", "statement"],
      meta: {
        keywords: ["hand-painted tote", "boot tote", "artsy bag", "canvas", "beaded"],
      },
    },
    {
      id: 67,
      categoryId: "Handbags",
      title: "Sunflower Granny tote bag",
      slug: "Sunflower Granny crochet bag",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 999,
      images: ["/images/55.png","/images/55-1.png","/images/55-2.png"], //Reena's Crochet
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "handbag", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
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
      price: 1649, //1499
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
      price: 1649, //1499
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
      price: 1649, //1499
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
      price: 2149, //2199
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
      price: 2149, //2199
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
  "resin-products": [
    {
      id: 38,
      categoryId: "resin-products",
      title: "Resin flower clock",
      slug: "Resin-flower-clock",
      description:
        "This beautiful resin flower clock is handcrafted using real dried flowers sealed in premium resin, turning every second into a piece of art.",
      price: 1099, //999
      images: ["/images/29.png"],
      popular: false,
      featured: true,
      inStock: true,
      tags: ["resin", "clock", "handmade", "flower"],
      meta: {
        keywords: ["resin", "clock", "handmade", "flower"],
      },
    },
    {
      id: 39,
      categoryId: "resin-products",
      title: "Resin keychain",
      slug: "Resin-keychain",
      description:
        "A beautiful resin keychain featuring real dried flowers preserved forever in crystal-clear resin. Each piece is one of a kind, capturing nature in its most delicate form.",
      price: 109, //99
      images: ["/images/31.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["resin", "keychain", "handmade", "flower"],
      meta: {
        keywords: ["resin", "keychain", "handmade", "flower"],
      },
    },
    {
      id: 40,
      categoryId: "resin-products",
      title: "Resin flower-photo",
      slug: "Resin-flower-photo",
      description:
        "A beautiful resin with a picture featuring real dried flowers preserved forever in crystal-clear resin. Each piece is one of a kind, capturing nature in its most delicate form.",
      price: 309, //279
      images: ["/images/30.png"],
      popular: false,
      featured: false,
      inStock: true,
      tags: ["resin", "photo", "handmade", "flower"],
      meta: {
        keywords: ["resin", "photo", "handmade", "flower"],
      },
    },
    {
      id: 41,
      categoryId: "resin-products",
      title: "Resin flower name plate",
      slug: "Resin-flower-name-plate",
      description:
        "Add a personal touch to your space with this custom resin flower name plate. Featuring real flowers sealed forever in high-quality resin, it’s a timeless décor piece that welcomes with elegance.",
      price: 639, //579
      images: ["/images/32.png"],
      popular: true,
      featured: true,
      inStock: true,
      tags: ["resin", "nameplate", "handmade", "flower"],
      meta: {
        keywords: ["resin", "nameplate", "handmade", "flower"],
      },
    },
    {
      id: 59,
      categoryId: "resin-products",
      title: "Resin flower clock",
      slug: "Resin-flower-clock",
      description:
        "This 12-inch beautiful resin flower clock is handcrafted using real dried flowers sealed in premium resin, turning every second into a piece of art. Sizes Available 14, 16, 18, 24 inches",
      price: 1299,
      images: ["/images/45.png"], //AneraArt
      popular: false,
      featured: false,
      inStock: true,
     tags: ["resin", "clock", "handmade", "flower"],
      meta: {
        keywords: ["resin", "clock", "handmade", "flower"],
      },
    },
    {
      id: 60,
      categoryId: "resin-products",
     title: "Resin Floral Tissue Holder",
      slug: "Resin-floral-tissue-holder",
      description:
        "A handcrafted resin tissue holder designed with elegant floral detailing and gold accents. Combining utility with artistic home decor, it keeps tissues organised while adding a stylish touch to your table or console. A beautiful decor piece that enhances modern and classic interiors alike.",
      price: 599,
      images: ["/images/46.png"], //AneraArt
      popular: true,
      featured: true,
      inStock: true,
     tags: ["resin", "tissue", "holder", "floral", "decor"],
      meta: {
        keywords: ["homedecor", "handmade", "luxury", "table", "resin","tissueholder"],
      },
    },
  ],
  "Handmade-Accessories": [
    {
      id: 42,
      categoryId: "Handmade-Accessories",
      title: "Festive Thread Bangles",
      slug: "festive-thread-bangles",
      description:
        "Vibrant thread-wrapped bangles detailed with intricate gold-toned embellishments and delicate stones. Lightweight and comfortable, they’re perfect for college celebrations, wedding functions, or adding a bold pop of colour to everyday ethnic outfits. A subtle statement that instantly elevates your look.",
      price: 199, //179
      images: ["/images/33.png"],//craftsCorner
      popular: true,
      featured: true,
      inStock: true,
      tags: ["bangles", "thread", "festive", "ethnic", "colourful"],
      meta: {
        keywords: ["jewellery", "wedding", "college", "traditional", "handmade"],
      },
    },
    {
      id: 43,
      categoryId: "Handmade-Accessories",
      title: "Vintage Gold Minimal Bangles",
      slug: "vintage-gold-minimal-bangles",
      description:
        "Delicately crafted gold-toned bangles featuring subtle stone detailing for a refined, retro ethnic charm. Lightweight and versatile, they complement sarees, suits, or even minimalist fusion outfits effortlessly. Perfect for those who love understated elegance with a timeless touch.",
      price: 165, //149
      images: ["/images/34.png"],//craftsCorner
      popular: true,
      featured: false,
      inStock: true,
      tags: ["vintage", "gold", "minimal", "ethnic", "classic"],
      meta: {
        keywords: ["bangles", "retro", "traditional", "minimalist", "jewellery"],
      },
    },
    {
      id: 44,
      categoryId: "Handmade-Accessories",
      title: "Gold Lotus Design Bangles",
      slug: "gold-lotus-design-bangles",
      description:
        "Beautiful gold-toned bangles with detailed lotus designs and soft coloured accents. Perfect for weddings, festivals, or adding a traditional touch to your ethnic outfits. A graceful piece that blends classic style with everyday elegance.",
      price: 389, //349
      images: ["/images/35.png"],//craftsCorner
      popular: true,
      featured: true,
      inStock: true,
      tags: ["lotus", "gold", "ethnic", "wedding", "festive"],
      meta: {
        keywords: ["bangles", "traditional", "lotus", "ethnic", "design", "jewellery"],
      },
    },
    {
      id: 45,
      categoryId: "Handmade-Accessories",
      title: "Colourful Traditional Bangles Set",
      slug: "colourful-traditional-bangles-set",
      description:
        "A vibrant set of gold-toned bangles with multi-design detailing, red and green accents, and traditional patterns. Perfect for weddings, festive celebrations, casual ethnic wear, or thoughtful gifting. A beautiful bridal jewellery piece that adds colour, richness, and charm to any outfit.",
      price: 329, //299
      images: ["/images/36.png"],//craftsCorner
      popular: false,
      featured: false,
      inStock: true,
      tags: ["colourful", "bridal", "traditional", "festive", "gifting"],
      meta: {
        keywords: ["bangles", "wedding", "ethnic", "jewellery", "ornaments"],
      },
    },
   {
      id: 54,
      categoryId: "Handmade-Accessories",
      title: "Teal Thread Gold Detail Bangles",
      slug: "teal-thread-gold-detail-bangles",
      description:
        "Beautiful teal-threaded bangles with gold detailing and intricate patterns. Lightweight and elegant, they are perfect for adding a touch of sophistication to any ethnic outfit. Ideal for weddings, festivals, or everyday wear.A stylish accessory that adds colour and shine without feeling heavy.",
      price: 169, //149
      images: ["/images/37.png"],//craftsCorner
      popular: false,
      featured: false,
      inStock: true,
      tags: ["teal", "thread", "festive", "ethnic", "gifting"],
      meta: {
        keywords: ["bangles", "traditional", "jewellery", "fashion", "accessories"],
      },
    },
    {
      id: 55,
      categoryId: "Handmade-Accessories",
      title: "Gold Leaf Pattern Bangles",
      slug: "gold-leaf-pattern-bangles",
      description:
        "Stylish bangles with gold-toned edges and layered stone detailing for a rich traditional look. Designed to stand out at festive events, family functions, or special occasions. A bold yet elegant accessory that instantly adds colour and shine to ethnic outfits.",
      price: 329, //299
      images: ["/images/38.png"], //craftsCorner
      popular: false,
      featured: false,
      inStock: true,
      tags: ["gold", "leaf", "festive", "traditional", "statement"],
      meta: {
        keywords: ["bangles", "jewellery", "ethnic", "fashion", "accessories"],
      },
    },
    {
      id: 58,
      categoryId: "Handmade-Accessories",
      title: "Floral Crochet Parandi",
      slug: "custom-anniversary-gift-box",
      description:
        "A beautifully handmade crochet parandi with delicate white flowers and soft green detailing. Designed to add a soft statement look to braids, it makes your hairstyle stand out effortlessly. Perfect for festive wear, cultural events, or adding a graceful touch to everyday ethnic outfits.",
      price: 749,
      images: ["/images/40.png","/images/41.png","/images/42.png"], //hooksndheart
      popular: false,
      featured: false,
      inStock: true,
      tags: ["parandi", "crochet", "floral", "ethnic", "handmade"],
      meta: {
        keywords: ["braid", "hairaccessory", "traditional", "festive", "fashion"],
      },
    },
    {
      id: 61,
      categoryId: "Handmade-Accessories",
      title: "Vintage Art Statement Earrings",
      slug: "vintage-art-statement-earrings",
      description:
        "Beautiful vintage-style earrings with intricate art detailing and gold accents. These statement pieces are handcrafted with attention to detail, making them perfect for adding a touch of elegance to any outfit. A bold yet wearable accessory that instantly refreshes your everyday ethnic or fusion look.",
      price: 399,
      images: ["/images/47.png"], //aneraArt
      popular: false,
      featured: false,
      inStock: true,
      tags: ["anniversary", "gift box", "custom", "traditional", "resin" , "earrings"],
      meta: {
        keywords: ["anniversary gift", "custom", "gift box", "resin" , "earrings"],
      },
    },
  ],
  "Customised-Hampers": [
    {
      id: 64,
      categoryId: "Customised-Hampers",
      title: "Tshirt-Hampers",
      slug: "Dancing-Daisies",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 0,
      images: ["/images/48.png","/images/48-1.png","/images/48-2.png"], //LillyPad
      popular: false,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 65,
      categoryId: "Customised-Hampers",
      title: "Custom Hampers",
      slug: "Dancing-Daisies",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 0,
      images: ["/images/52.png","/images/52-1.png","/images/52-2.png"], //LillyPad
      popular: false,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 71,
      categoryId: "Customised-Hampers",
      title: "Photo Album",
      slug: "Photo-Album",
      description:
        "pages wise",
      price: 119,
      images: ["/images/51.png"], //LillyPad
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
  ],
  "Handmade-Soaps": [
    {
      id: 68,
      categoryId: "Handmade-Soaps",
      title: "Grape soap on rope",
      slug: "Grape-soap-on-rope",
      description:
        "A charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 349,
      images: ["/images/52.png","/images/52-1.png","/images/52-2.png"], //Divine Ember
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 69,
      categoryId: "Handmade-Soaps",
      title: "Glycerin Strawberry grape soap",
      slug: "Glycerin-Strawberry-grape-soap",
      description:
        "33pcs charming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 549,
      images: ["/images/57.png"], //Soaps
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    {
      id: 70,
      categoryId: "Handmade-Soaps",
      title: "Multicolor grape soap",
      slug: "Multicolor-grape-soap",
      description:
        "33 pcscharming handmade crochet flower bouquet in soft pink shades, crafted to stay beautiful forever. Wrapped elegantly and designed with detailed yarn flowers, it’s a thoughtful gift for birthdays, anniversaries, or special moments. A lasting floral keepsake that never fades.",
      price: 549,
      images: ["/images/58.png"], //Soaps
      popular: true,
      featured: true,
      inStock: true,
      tags: ["crochet", "bouquet", "flowers", "pink", "gift"],
      meta: {
        keywords: ["everlasting", "handmade", "floral", "keepsake", "decor"],
      },
    },
    /*{
      id: 53,
      categoryId: "Handmade-Soaps",
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
    },*/
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
