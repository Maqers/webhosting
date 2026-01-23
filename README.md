# Premium E-Commerce Catalogue

A beautiful, static React website for showcasing products with WhatsApp integration.

## Features

- 🏠 **Home Page** - Display all products in an elegant grid layout
- 📦 **Product Detail Page** - Three images with zoom functionality, title, description, and price
- 📱 **WhatsApp Integration** - Floating button with popup to contact about products (includes product ID)
- 🧭 **Navigation Bar** - Responsive navigation with mobile menu
- ℹ️ **About Us Page** - Information about your business
- ❓ **FAQs Page** - Frequently asked questions with accordion style
- 📱 **100% Mobile Responsive** - Beautiful on all devices
- ⚡ **Fast Loading** - Optimized with Vite and lazy loading images

## Design

- **Primary Color**: #760909 (Deep Red)
- **Secondary Colors**: Cream (#f5f5dc) and Black (#1a1a1a)
- **Font**: EB Garamond (Google Fonts)

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Add Your Product Images**
   - Place product images in the `public/images/` folder
   - Name them as: `product{id}-{imageNumber}.jpg`
   - Example: `product1-1.jpg`, `product1-2.jpg`, `product1-3.jpg`
   - Each product needs 3 images

3. **Update Product Data**
   - Edit `src/data/products.js` to add/update your products
   - Update titles, descriptions, prices, and categories

4. **Configure WhatsApp Number**
   - Open `src/components/WhatsAppButton.jsx`
   - Replace `"1234567890"` with your actual WhatsApp business number (include country code, no + sign)
   - Example: `"919876543210"` for India

5. **Run Development Server**
   ```bash
   npm run dev
   ```

6. **Build for Production**
   ```bash
   npm run build
   ```

## Project Structure

```
├── public/
│   └── images/          # Product images go here
├── src/
│   ├── components/      # Reusable components
│   │   ├── Navbar.jsx
│   │   └── WhatsAppButton.jsx
│   ├── pages/           # Page components
│   │   ├── Home.jsx
│   │   ├── ProductDetail.jsx
│   │   ├── AboutUs.jsx
│   │   └── FAQs.jsx
│   ├── data/
│   │   └── products.js  # Product data
│   ├── App.jsx
│   └── main.jsx
└── package.json
```

## Adding Products

Edit `src/data/products.js` and add products following this format:

```javascript
{
  id: 9,
  title: "Your Product Name",
  description: "Product description here...",
  price: 199.99,
  images: [
    "/images/product9-1.jpg",
    "/images/product9-2.jpg",
    "/images/product9-3.jpg"
  ],
  category: "Category Name"
}
```

## Customization

- **Colors**: Edit CSS variables in `src/index.css`
- **Font**: Already set to Garamond via Google Fonts
- **Content**: Edit page components in `src/pages/`
- **Styling**: Each component has its own CSS file

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment to Vercel

This project is configured for easy deployment to Vercel. Follow these steps:

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Import Project on Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite configuration

3. **Configure Build Settings** (if needed)
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
   - **Development Command**: `npm run dev`

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live!

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

4. **For Production Deployment**
   ```bash
   vercel --prod
   ```

### Build Configuration

The project includes a `vercel.json` file with the following configuration:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Framework**: Vite
- **SPA Routing**: Configured for React Router (all routes redirect to index.html)

### Environment Variables (if needed)

If you need to add environment variables:
1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add any required variables
4. Redeploy

### Post-Deployment Checklist

- [ ] Test all pages and routes
- [ ] Verify WhatsApp button works with your number
- [ ] Check mobile responsiveness
- [ ] Test image loading
- [ ] Verify zoom functionality
- [ ] Check all product links

### Custom Domain (Optional)

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Build Commands

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

## Troubleshooting

### Build Fails
- Ensure all dependencies are in `package.json`
- Check Node.js version (Vercel uses Node 18.x by default)
- Review build logs in Vercel dashboard

### Routes Not Working
- Ensure `vercel.json` is in the root directory
- Check that rewrites are configured correctly
- Verify React Router is set up properly

### Images Not Loading
- Ensure images are in `public/images/` folder
- Check image paths in `src/data/products.js`
- Verify image URLs are correct

## License

Private - All rights reserved

