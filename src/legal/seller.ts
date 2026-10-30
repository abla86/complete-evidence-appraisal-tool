/**
 * Seller identity required by e-handelsloven § 8 and angrerettloven § 8.
 * Contact e-mail and VAT status are supplied at build time so they can be changed without code edits.
 */
export const SELLER = {
  name: 'Andersen',
  owner: 'Anne Beth Andersen',
  organisationNumber: '835 983 102',
  address: 'Utsiragata 88, 5537 Haugesund, Norge',
  email: (import.meta.env?.VITE_SELLER_EMAIL || '').trim(),
  vatRegistered: (import.meta.env?.VITE_SELLER_VAT_REGISTERED || '').trim() === 'true',
  brregUrl: 'https://w2.brreg.no/enhet/sok/detalj.jsp?orgnr=835983102',
} as const;

export const LEGAL_LAST_UPDATED = '30. oktober 2026';

export function sellerContactLine(): string {
  return SELLER.email ? SELLER.email : 'e-postadresse er ikke konfigurert i denne utgaven (VITE_SELLER_EMAIL)';
}
