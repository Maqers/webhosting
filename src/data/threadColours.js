// The silk-thread shade card (two photos of the spools), grouped so the admin
// dropdown is quick to scan. Names are the ones printed on the card. Shared by
// the admin's Colour Options dropdown and by the AI's naming rules
// (api/generate-description.js), so the two always agree.
export const THREAD_COLOURS = [
  ['Pinks & oranges', ['Baby Pink', 'Pink', 'Hot Pink', 'Peach', 'Onion', 'Dark Onion', 'Orange', 'Yellow']],
  ['Purples & reds', ['Violet', 'Light Purple', 'Purple', 'Light Magenta', 'Magenta', 'Red', 'Maroon', 'Black']],
  ['Blues & greens', ['Sky Blue', 'Peacock Blue', 'Royal Blue', 'Dark Blue', 'Rama Green', 'Light Turquoise', 'Turquoise', 'Mint Green', 'Parrot Green', 'Green']],
  ['Olives, golds & browns', ['Olive', 'Light Olive', 'Bronze', 'Brown', 'Gold', 'Bright Gold']],
]

export const THREAD_COLOUR_NAMES = THREAD_COLOURS.flatMap(([, names]) => names)
