import { useState } from 'react'
import { foodItems } from '../data/products'
import ImageWithFallback from '../components/ImageWithFallback'
import './Gallery.css'

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState(null)

  // Get all unique images from food items
  const allImages = foodItems.flatMap(item => 
    item.images.map((img, idx) => ({
      src: img,
      title: item.title,
      id: `${item.id}-${idx}`
    }))
  )

  return (
    <div className="gallery-page">
      <div className="gallery-hero">
        <div className="container">
          <h1 className="gallery-title">Food Gallery</h1>
          <p className="gallery-subtitle">Explore our delicious collection</p>
        </div>
      </div>

      <div className="container">
        <div className="gallery-grid">
          {allImages.map((image, index) => (
            <div
              key={image.id}
              className="gallery-item scroll-animate"
              style={{ '--i': index }}
              onClick={() => setSelectedImage(image)}
            >
              <ImageWithFallback
                src={image.src}
                alt={image.title}
                className="gallery-image"
              />
              <div className="gallery-overlay">
                <span className="gallery-title-text">{image.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedImage(null)}>×</button>
            <ImageWithFallback
              src={selectedImage.src}
              alt={selectedImage.title}
              className="modal-image"
            />
            <p className="modal-title">{selectedImage.title}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery

