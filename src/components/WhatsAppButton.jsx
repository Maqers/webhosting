import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { getWhatsAppNumber } from '../data/contactInfo';
import { getProductBySlug, getProductById } from '../data/catalog';
import { useScrollLock } from '../hooks/useScrollLock';
import { trackEvent } from '../utils/analytics';
import './WhatsAppButton.css';

const SITE = 'https://www.maqers.in';

// Off product pages the visitor picks what they want to ask, so the first
// WhatsApp message already says what they need instead of one canned line.
// On a product page it stays one tap: the message names the product.
// `ask` opens the message; `hint` is the placeholder for the optional details.
const GENERAL_TOPICS = [
  { id: 'gift', label: 'Help me choose a gift', ask: 'Can you help me choose a gift?', hint: 'Who it is for, occasion and budget' },
  { id: 'bulk', label: 'Bulk or corporate gifting', ask: "I'm looking for bulk / corporate gifting.", hint: 'Quantity, budget per gift and date needed' },
  { id: 'custom', label: 'Something personalised', ask: "I'd like something personalised.", hint: 'What you have in mind' },
  { id: 'order', label: 'About my order', ask: "I have a question about my order.", hint: 'Your order ID (starts with MQ) and question' },
  { id: 'other', label: 'Something else', ask: 'I have a question.', hint: 'Type your question' },
];

const WaIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const WhatsAppButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [topicId, setTopicId] = useState(null);
  const [details, setDetails] = useState('');
  const location = useLocation();
  const popupRef = useRef(null);
  const buttonRef = useRef(null);
  const detailsRef = useRef(null);

  const slug = location.pathname.startsWith('/product/')
    ? decodeURIComponent(location.pathname.split('/product/')[1].split('/')[0])
    : null;
  const product = slug ? (getProductBySlug(slug) || getProductById(slug)) : null;
  const topics = GENERAL_TOPICS;
  const topic = topics.find(t => t.id === topicId) || null;
  const canSend = !!product || !!topic;

  // Fresh form each time it opens, and when the page changes underneath it
  useEffect(() => { setTopicId(null); setDetails(''); }, [isOpen, location.pathname]);

  const whatsappNumber = getWhatsAppNumber();

  const buildMessage = () => {
    if (product) return `Hello! I want to buy ${product.title}: ${SITE}/product/${product.slug}`;
    const text = `Hi Maqers! ${topic.ask}`;
    return details.trim() ? `${text} ${details.trim()}` : text;
  };

  const pickTopic = (id) => {
    setTopicId(id);
    requestAnimationFrame(() => detailsRef.current?.focus({ preventScroll: true }));
  };

  const handleWhatsAppClick = () => {
    if (!canSend) return;
    trackEvent('WhatsAppEnquiry', {
      topic: product ? 'product' : topic.id,
      has_details: !!details.trim(),
      ...(product && { product_id: product.id, title: product.title, price: product.price }),
      page: location.pathname,
    });
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(buildMessage())}`, '_blank');
    setIsOpen(false);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  useScrollLock(isOpen);

  return (
    <>
      {isOpen && (
        <div className="whatsapp-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" />
      )}

      {isOpen && (
        <div ref={popupRef} className="wa-sheet" role="dialog" aria-modal="true" aria-labelledby="wa-sheet-title">
          <div className="wa-sheet-head">
            <span className="wa-sheet-icon"><WaIcon size={22} /></span>
            <div className="wa-sheet-titles">
              <h3 id="wa-sheet-title">Chat with us</h3>
              <p>We usually reply within minutes</p>
            </div>
            <button type="button" className="wa-sheet-close" onClick={() => setIsOpen(false)} aria-label="Close chat">×</button>
          </div>

          <div className="wa-sheet-body">
            {product && (
              <p className="wa-sheet-q">Questions about this piece? Message us on WhatsApp.</p>
            )}
            {product && (
              <div className="wa-sheet-product">
                {product.images?.[0] && <img src={product.images[0]} alt="" />}
                <div>
                  <p className="wa-sheet-product-title">{product.title}</p>
                  <p className="wa-sheet-product-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
                </div>
              </div>
            )}

            {product && (
              <p className="wa-sheet-preview">
                <span>Your message</span>
                {buildMessage().split(': http')[0]}
              </p>
            )}

            {!product && <>
            <p className="wa-sheet-q">What would you like to ask?</p>
            <div className="wa-sheet-topics" role="radiogroup" aria-label="Topic">
              {topics.map(t => (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={topicId === t.id}
                  className={`wa-sheet-topic${topicId === t.id ? ' is-on' : ''}`}
                  onClick={() => pickTopic(t.id)}
                >{t.label}</button>
              ))}
            </div>

            {topic && (
              <textarea
                ref={detailsRef}
                className="wa-sheet-details"
                rows={2}
                maxLength={300}
                placeholder={topic.hint}
                value={details}
                onChange={e => setDetails(e.target.value)}
              />
            )}
            </>}
          </div>

          <div className="wa-sheet-foot">
            <button type="button" className="wa-sheet-send" onClick={handleWhatsAppClick} disabled={!canSend}>
              <WaIcon size={20} />
              <span>{canSend ? 'Continue on WhatsApp' : 'Pick a question above'}</span>
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Floating Button - ALWAYS VISIBLE */}
      <button
        ref={buttonRef}
        className={`whatsapp-button ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close WhatsApp chat' : 'Open WhatsApp chat'}
        aria-expanded={isOpen}
        type="button"
      >
        {isOpen ? (
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="whatsapp-icon"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
          </svg>
        )}
        <span className="whatsapp-text">Chat</span>
      </button>
    </>
  );
};

export default WhatsAppButton;