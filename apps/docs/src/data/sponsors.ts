/** GitHub Sponsors page: the "Sponsor" buttons, footers and the command palette link here. */
export const SPONSOR_URL = 'https://github.com/sponsors/mrpiotr-dev';

/** Business inquiries (integration help, custom work) go here, not through sponsorship. */
export const BUSINESS_EMAIL = 'contact@mrpiotr.dev';

export type Sponsor = {
  name: string;
  url: string;
  /** Avatar (backers) or logo (companies). */
  image: string;
  tier: 'gold' | 'company' | 'backer';
};

/**
 * Current sponsors, largest tier first. Add people here when they sponsor (and agree to be listed),
 * and mirror the change in the README's Sponsors section. While the list is empty, the landing page
 * shows only the call to action.
 */
export const sponsors: Sponsor[] = [];
