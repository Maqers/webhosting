/**
 * Product data - SINGLE SOURCE OF TRUTH for products and images.
 * - Add your images as URLs (https://...) or paths: /images/yourfile.jpg
 * - Put files in public/images/ and use /images/filename.jpg
 * - No dummy/placeholder URLs — only your images or /images/placeholder.svg
 */

const PLACEHOLDER = "/images/logo.png";

export const products = [
  {
    id: 1,
    title: "Handcrafted Wooden Jewelry Box",
    description:
      "Beautiful handcrafted wooden jewelry box with intricate carvings. Perfect for storing your precious jewelry and keepsakes. Made from premium quality wood with a smooth finish. Features multiple compartments and a velvet-lined interior.",
    price: 2499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 2,
    title: "Customized Photo Frame Set",
    description:
      "Elegant photo frame set perfect for displaying your cherished memories. Available in various sizes and finishes. Can be customized with names, dates, or special messages. Makes a perfect gift for weddings, anniversaries, or birthdays.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 3,
    title: "Traditional Indian Silk Scarf",
    description:
      "Luxurious handwoven silk scarf featuring traditional Indian patterns and vibrant colors. Made from premium silk with intricate embroidery work. Perfect for adding elegance to any outfit. Available in multiple color combinations.",
    price: 1899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Fashion & Accessories",
    popular: false,
  },
  {
    id: 4,
    title: "Handmade Ceramic Dinner Set",
    description:
      "Beautiful handcrafted ceramic dinner set featuring traditional Indian designs. Includes plates, bowls, and serving dishes. Each piece is unique and hand-painted. Perfect for special occasions or as a decorative piece.",
    price: 3499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 5,
    title: "Custom Engraved Watch",
    description:
      "Elegant wristwatch with custom engraving option. Choose from various designs and add personalized text or dates. Premium quality movement with leather or metal strap options. Perfect gift for special occasions.",
    price: 4499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: false,
  },
  {
    id: 6,
    title: "Handwoven Cotton Cushion Covers",
    description:
      "Set of 4 handwoven cotton cushion covers with traditional Indian motifs. Made from 100% organic cotton. Available in various color combinations and patterns. Adds a touch of elegance to your home decor.",
    price: 999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: false,
  },
  {
    id: 7,
    title: "Customized Leather Wallet",
    description:
      "Premium quality leather wallet with custom embossing option. Available in multiple colors and styles. Features multiple card slots and compartments. Can be personalized with initials or names.",
    price: 1799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Fashion & Accessories",
    popular: true,
  },
  {
    id: 8,
    title: "Handmade Brass Candle Holders",
    description:
      "Set of 2 elegant brass candle holders with intricate traditional designs. Handcrafted by skilled artisans. Perfect for creating a warm and inviting atmosphere. Makes a beautiful decorative piece.",
    price: 1599,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: false,
  },
  {
    id: 9,
    title: "Personalized Coffee Mug Set",
    description:
      "Set of 2 ceramic coffee mugs with custom printing option. Add names, photos, or special messages. Dishwasher safe and microwave friendly. Perfect for couples or best friends.",
    price: 799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 10,
    title: "Traditional Indian Art Print",
    description:
      "Beautiful framed art print featuring traditional Indian artwork. High-quality print on premium paper. Available in various sizes and designs. Perfect for adding cultural elegance to your home or office.",
    price: 2199,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: false,
  },
  {
    id: 11,
    title: "Customized Keychain Set",
    description:
      "Set of 4 personalized keychains with custom text or initials. Made from durable materials. Available in various colors and finishes. Perfect as a small gift or party favor.",
    price: 499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: false,
  },
  {
    id: 12,
    title: "Handmade Pottery Vase",
    description:
      "Beautiful handcrafted pottery vase with unique designs. Made by skilled artisans using traditional techniques. Perfect for flowers or as a standalone decorative piece. Each vase is one-of-a-kind.",
    price: 2799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 13,
    title: "Traditional Brass Diya Set",
    description:
      "Set of 5 traditional brass diyas (oil lamps) with intricate designs. Perfect for festivals, prayers, and creating a warm ambiance. Handcrafted by skilled artisans using traditional methods. Each piece is polished to a beautiful shine.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 14,
    title: "Handwoven Jute Wall Hanging",
    description:
      "Beautiful handwoven jute wall hanging with traditional Indian motifs. Made from natural jute fibers. Adds a rustic and elegant touch to any wall. Available in various sizes and designs.",
    price: 899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: false,
  },
  {
    id: 15,
    title: "Copper Water Pot Set",
    description:
      "Set of 2 traditional copper water pots (lota) with hammered finish. Copper is known for its health benefits. Handcrafted by skilled coppersmiths. Perfect for traditional Indian homes or as decorative pieces.",
    price: 2199,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 16,
    title: "Handmade Terracotta Planters Set",
    description:
      "Set of 3 handcrafted terracotta planters in different sizes. Made from natural clay and fired using traditional methods. Perfect for indoor and outdoor plants. Each planter has unique texture and design.",
    price: 1499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: false,
  },
  {
    id: 17,
    title: "Traditional Wooden Wall Clock",
    description:
      "Beautiful handcrafted wooden wall clock with traditional Indian design elements. Made from premium quality wood with intricate carvings. Quartz movement ensures accurate timekeeping. Perfect for adding elegance to your home.",
    price: 3299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Home Decor",
    popular: true,
  },
  {
    id: 19,
    title: "Custom Engraved Nameplate",
    description:
      "Elegant wooden or brass nameplate with custom engraving. Perfect for office doors, home entrances, or as a gift. Available in various sizes and finishes. Add names, titles, or special messages.",
    price: 899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 20,
    title: "Personalized Birthstone Jewelry Box",
    description:
      "Beautiful jewelry box with personalized birthstone and name engraving. Made from premium materials with velvet-lined interior. Perfect gift for birthdays, anniversaries, or special occasions.",
    price: 2999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 21,
    title: "Custom Printed T-Shirt",
    description:
      "Premium quality cotton t-shirt with custom printing. Add names, photos, quotes, or designs. Available in various sizes and colors. Perfect for events, teams, or personal use.",
    price: 699,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 22,
    title: "Engraved Crystal Award",
    description:
      "Elegant crystal award with custom engraving. Perfect for recognition, achievements, or corporate gifts. Available in various shapes and sizes. Add names, dates, or special messages.",
    price: 2499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: false,
  },
  {
    id: 23,
    title: "Custom Photo Calendar",
    description:
      "Beautiful wall calendar with your custom photos. Add 12 of your favorite photos, one for each month. Perfect gift for family, friends, or corporate use. High-quality printing on premium paper.",
    price: 1199,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Personalized Gifts",
    popular: true,
  },
  {
    id: 24,
    title: "Handwoven Cotton Tote Bag",
    description:
      "Eco-friendly handwoven cotton tote bag with traditional Indian patterns. Made from 100% organic cotton. Spacious and durable. Perfect for shopping, beach, or daily use. Available in various colors.",
    price: 799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Fashion & Accessories",
    popular: true,
  },
  {
    id: 25,
    title: "Traditional Handloom Stole",
    description:
      "Luxurious handloom stole with traditional Indian designs. Made from premium cotton or silk blend. Perfect for adding elegance to any outfit. Available in various colors and patterns.",
    price: 1499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Fashion & Accessories",
    popular: false,
  },
  {
    id: 26,
    title: "Handmade Leather Belt",
    description:
      "Premium quality handmade leather belt with traditional buckle design. Made from genuine leather. Available in various sizes and colors. Can be customized with initials or patterns.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Fashion & Accessories",
    popular: false,
  },
  {
    id: 27,
    title: "Traditional Silver Anklets",
    description:
      "Beautiful traditional silver anklets with intricate designs. Handcrafted by skilled artisans. Made from pure silver with traditional patterns. Perfect for festivals and special occasions.",
    price: 2499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Jewelry & Accessories",
    popular: true,
  },
  {
    id: 28,
    title: "Handmade Beaded Necklace Set",
    description:
      "Set of 3 handcrafted beaded necklaces with traditional Indian designs. Made from natural stones and beads. Each necklace is unique. Perfect for adding elegance to traditional and modern outfits.",
    price: 1899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Jewelry & Accessories",
    popular: true,
  },
  {
    id: 29,
    title: "Traditional Jhumka Earrings",
    description:
      "Elegant traditional jhumka (dangler) earrings with intricate designs. Made from brass or silver with traditional patterns. Perfect for weddings, festivals, and special occasions. Available in various sizes.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Jewelry & Accessories",
    popular: true,
  },
  {
    id: 30,
    title: "Handcrafted Bangles Set",
    description:
      "Set of 6 handcrafted bangles with traditional designs. Made from brass, wood, or lacquer. Each bangle features unique patterns. Perfect for traditional Indian attire and festivals.",
    price: 999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Jewelry & Accessories",
    popular: false,
  },
  {
    id: 31,
    title: "Traditional Maang Tikka",
    description:
      "Beautiful traditional maang tikka (forehead jewelry) with intricate designs. Made from brass or silver with traditional patterns. Perfect for weddings and special occasions. Available in various designs.",
    price: 1599,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Jewelry & Accessories",
    popular: false,
  },
  {
    id: 32,
    title: "Traditional Brass Serving Set",
    description:
      "Complete brass serving set including plates, bowls, and serving spoons. Handcrafted by skilled artisans using traditional methods. Perfect for traditional Indian dining. Each piece is polished to perfection.",
    price: 4499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: true,
  },
  {
    id: 33,
    title: "Handmade Clay Cookware Set",
    description:
      "Set of traditional clay cookware including pots and pans. Made from natural clay using traditional methods. Enhances food flavor and retains nutrients. Perfect for healthy cooking.",
    price: 1999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: true,
  },
  {
    id: 34,
    title: "Copper Water Bottle",
    description:
      "Traditional copper water bottle with modern design. Copper is known for its health benefits including antimicrobial properties. Handcrafted with hammered finish. Perfect for daily use.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: true,
  },
  {
    id: 35,
    title: "Handwoven Bamboo Dinnerware Set",
    description:
      "Eco-friendly bamboo dinnerware set including plates, bowls, and serving trays. Made from sustainable bamboo. Lightweight, durable, and perfect for outdoor dining or daily use.",
    price: 1799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: false,
  },
  {
    id: 36,
    title: "Traditional Spice Box Set",
    description:
      "Beautiful traditional spice box (masala dabba) with multiple compartments. Made from stainless steel or brass. Perfect for storing and organizing spices. Essential for Indian cooking.",
    price: 899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: true,
  },
  {
    id: 37,
    title: "Handcrafted Wooden Spoons Set",
    description:
      "Set of 6 handcrafted wooden spoons and ladles. Made from premium quality wood. Perfect for cooking and serving. Each piece is smooth and polished. Safe for non-stick cookware.",
    price: 699,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kitchen & Dining",
    popular: false,
  },
  {
    id: 38,
    title: "Handmade Marble Sculpture",
    description:
      "Beautiful handcrafted marble sculpture featuring traditional Indian motifs. Made from premium quality marble by skilled artisans. Perfect for home decor or as a collectible piece. Each sculpture is unique.",
    price: 5999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Art & Collectibles",
    popular: false,
  },
  {
    id: 39,
    title: "Traditional Madhubani Painting",
    description:
      "Authentic Madhubani (Mithila) painting on canvas or paper. Hand-painted by skilled artists using traditional techniques. Features vibrant colors and intricate patterns. Perfect for home decor.",
    price: 3499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Art & Collectibles",
    popular: true,
  },
  {
    id: 40,
    title: "Handcrafted Wooden Carving",
    description:
      "Intricate wooden carving featuring traditional Indian designs. Made from premium quality wood by skilled craftsmen. Perfect for wall decoration or as a standalone art piece. Each carving is unique.",
    price: 2799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Art & Collectibles",
    popular: false,
  },
  {
    id: 41,
    title: "Traditional Tanjore Painting",
    description:
      "Beautiful Tanjore painting with gold foil work and gemstones. Handcrafted by skilled artists using traditional techniques. Features religious or mythological themes. Perfect for home or temple.",
    price: 4999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Art & Collectibles",
    popular: true,
  },
  {
    id: 42,
    title: "Custom Wedding Favor Box Set",
    description:
      "Beautiful custom wedding favor boxes with couple names and wedding date. Made from premium materials. Perfect for gifting to wedding guests. Can be customized with colors, designs, and messages.",
    price: 1999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Wedding & Special Occasions",
    popular: true,
  },
  {
    id: 43,
    title: "Engraved Wedding Plaque",
    description:
      "Elegant wedding plaque with couple names, wedding date, and special message. Made from premium wood or metal. Perfect for wedding decoration or as a keepsake. Can be customized with designs.",
    price: 2499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Wedding & Special Occasions",
    popular: true,
  },
  {
    id: 44,
    title: "Traditional Wedding Gift Set",
    description:
      "Complete traditional wedding gift set including brass items, decorative pieces, and traditional accessories. Perfect for gifting to newlyweds. Packaged beautifully in traditional style.",
    price: 4999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Wedding & Special Occasions",
    popular: true,
  },
  {
    id: 45,
    title: "Custom Anniversary Gift Box",
    description:
      "Beautiful custom anniversary gift box with couple names and anniversary date. Includes curated traditional gifts. Perfect for celebrating milestones. Can be customized with items and messages.",
    price: 2999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Wedding & Special Occasions",
    popular: false,
  },
  {
    id: 46,
    title: "Handmade Wooden Toys Set",
    description:
      "Set of traditional handmade wooden toys including puzzles, blocks, and figurines. Made from safe, non-toxic materials. Perfect for developing motor skills and creativity. Safe for children.",
    price: 1499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kids & Baby Gifts",
    popular: true,
  },
  {
    id: 47,
    title: "Personalized Baby Name Plate",
    description:
      "Beautiful personalized name plate for baby room. Made from premium wood with custom engraving. Includes baby name, birth date, and optional design. Perfect for nursery decoration.",
    price: 999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kids & Baby Gifts",
    popular: true,
  },
  {
    id: 48,
    title: "Handwoven Baby Blanket",
    description:
      "Soft handwoven baby blanket made from organic cotton. Features traditional Indian patterns and vibrant colors. Perfect for keeping baby warm and comfortable. Safe and gentle on sensitive skin.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kids & Baby Gifts",
    popular: true,
  },
  {
    id: 49,
    title: "Custom Storybook with Child Name",
    description:
      "Personalized storybook featuring your child as the main character. Includes child name throughout the story. Beautiful illustrations and engaging story. Perfect gift for birthdays or special occasions.",
    price: 899,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Kids & Baby Gifts",
    popular: true,
  },
  {
    id: 50,
    title: "Handcrafted Wooden Pen Stand",
    description:
      "Elegant handcrafted wooden pen stand with multiple compartments. Made from premium quality wood with smooth finish. Perfect for organizing pens, pencils, and office supplies. Adds elegance to any desk.",
    price: 799,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Office & Stationery",
    popular: true,
  },
  {
    id: 51,
    title: "Custom Engraved Business Card Holder",
    description:
      "Premium business card holder with custom engraving. Made from wood or metal. Perfect for professional use. Can be personalized with name, company, or logo. Elegant and professional design.",
    price: 1299,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Office & Stationery",
    popular: false,
  },
  {
    id: 52,
    title: "Handmade Leather Journal",
    description:
      "Beautiful handmade leather journal with traditional binding. Made from premium quality leather. Features lined or blank pages. Perfect for writing, journaling, or as a gift. Can be personalized with initials.",
    price: 1499,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Office & Stationery",
    popular: true,
  },
  {
    id: 53,
    title: "Traditional Brass Paperweight Set",
    description:
      "Set of 2 traditional brass paperweights with intricate designs. Handcrafted by skilled artisans. Perfect for keeping papers organized. Adds elegance to any desk. Makes a great gift.",
    price: 999,
    images: [PLACEHOLDER, PLACEHOLDER, PLACEHOLDER],
    category: "Office & Stationery",
    popular: false,
  },
];

export const categories = [
  { id: 1, name: "Home Decor", icon: "home", count: 13 },
  { id: 2, name: "Personalized Gifts", icon: "gift", count: 10 },
  { id: 3, name: "Fashion & Accessories", icon: "fashion", count: 6 },
  { id: 4, name: "Jewelry & Accessories", icon: "jewelry", count: 5 },
  { id: 5, name: "Kitchen & Dining", icon: "kitchen", count: 6 },
  { id: 6, name: "Art & Collectibles", icon: "art", count: 4 },
  { id: 7, name: "Wedding & Special Occasions", icon: "wedding", count: 4 },
  { id: 8, name: "Kids & Baby Gifts", icon: "kids", count: 4 },
  { id: 9, name: "Office & Stationery", icon: "office", count: 4 },
];

// Utility functions
export const getProductById = (id) => {
  return products.find((product) => product.id === parseInt(id));
};

export const getProductsByCategory = (categoryName) => {
  if (categoryName === "All") return products;
  return products.filter((product) => product.category === categoryName);
};

export const getPopularProducts = () => {
  return products.filter((product) => product.popular);
};

// For backward compatibility
export const foodItems = products;
export const getPopularItems = getPopularProducts;
export const getItemsByCategory = getProductsByCategory;

// Restaurants page (separate data; add entries with image, name, cuisine, etc.)
export const restaurants = [];
