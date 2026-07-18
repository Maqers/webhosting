// Hover-crossfade (swap to a product's second photo) is a desktop-only
// affordance driven by mouse :hover. This hook used to fake it on touch
// devices by auto-swapping whichever product row was scrolled to the
// viewport's vertical center — but across a long grid, that means every
// row crossfades in turn as you scroll past it, which reads as constant
// flickering rather than "dynamic". Touch grids now show a single static
// image; the rest of a product's photos are available on its detail page,
// matching how most e-commerce sites handle mobile listing grids.
//
// Kept as a no-op (rather than removing every call site) so the many
// pages that call it don't need touching if this behavior is revisited.
export function useMobileCenterSwap() {}
