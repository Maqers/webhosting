import { useEffect } from 'react'

/**
 * Freezes background scrolling while a drawer, modal or menu is open.
 *
 * Replaces six separate hand-rolled implementations (CartDrawer, Modal,
 * WishlistDrawer, WhatsAppButton, GiftAssistant, Navbar, ProductSort) that
 * used three different techniques between them and all failed on mobile,
 * because the old mobile-scroll-priority.css forced
 * `body { overflow-y: visible !important; position: static !important }`
 * and silently discarded whatever they set.
 *
 * Why `position: fixed` rather than `overflow: hidden`: iOS Safari ignores
 * `overflow: hidden` on body and keeps scrolling the page behind the overlay.
 * Pinning the body and offsetting it by the saved scroll position is the only
 * technique that holds there.
 *
 * Locks are reference-counted, so a modal opened on top of a drawer does not
 * release the lock when only the modal closes.
 */

let lockCount = 0
let savedScrollY = 0
let savedInline = null

const lockBody = () => {
  if (lockCount++ > 0) return

  const { body } = document
  savedScrollY = window.scrollY || window.pageYOffset || 0

  savedInline = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  }

  // Desktop has a visible scrollbar; removing it would shift the layout, so
  // replace its width with padding for as long as the lock is held.
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

  body.style.position = 'fixed'
  body.style.top = `-${savedScrollY}px`
  body.style.left = '0'
  body.style.right = '0'
  body.style.width = '100%'
  body.style.overflow = 'hidden'
  if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`

  body.setAttribute('data-scroll-locked', '')
}

const unlockBody = () => {
  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0 || !savedInline) return

  const { body } = document
  body.style.position = savedInline.position
  body.style.top = savedInline.top
  body.style.left = savedInline.left
  body.style.right = savedInline.right
  body.style.width = savedInline.width
  body.style.overflow = savedInline.overflow
  body.style.paddingRight = savedInline.paddingRight
  body.removeAttribute('data-scroll-locked')
  savedInline = null

  // Jump straight back without smooth-scrolling through the whole document.
  const html = document.documentElement
  const prevBehavior = html.style.scrollBehavior
  html.style.scrollBehavior = 'auto'
  window.scrollTo(0, savedScrollY)
  html.style.scrollBehavior = prevBehavior
}

export function useScrollLock(isLocked) {
  useEffect(() => {
    if (!isLocked) return undefined
    lockBody()
    return unlockBody
  }, [isLocked])
}

export default useScrollLock
