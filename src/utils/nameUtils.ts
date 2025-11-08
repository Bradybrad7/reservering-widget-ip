/**
 * Capitalizes names properly, handling Dutch name particles like 'van', 'de', 'den', etc.
 * Examples:
 * - "sara van de bergen" → "Sara van de Bergen"
 * - "jan de vries" → "Jan de Vries"
 * - "piet van den berg" → "Piet van den Berg"
 */
export function capitalizeName(name: string): string {
  if (!name || typeof name !== 'string') return '';

  // List of Dutch name particles that should stay lowercase (unless at the start)
  const particles = ['van', 'de', 'den', 'der', 'het', "'t", 'te', 'ten', 'ter', 'op', 'onder', 'voor', 'aan', 'bij'];

  return name
    .trim()
    .toLowerCase()
    .split(/\s+/) // Split by any whitespace
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Keep particles lowercase unless they're the first word
      if (particles.includes(word)) {
        return word;
      }

      // Capitalize all other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Capitalizes first and last name together, useful for full names
 */
export function capitalizeFullName(firstName: string, lastName: string): { firstName: string; lastName: string } {
  return {
    firstName: capitalizeName(firstName),
    lastName: capitalizeName(lastName),
  };
}

/**
 * Capitalizes company names properly
 * Examples:
 * - "theater de kijker bv" → "Theater de Kijker BV"
 * - "koninklijke philips n.v." → "Koninklijke Philips N.V."
 * - "het depot" → "Het Depot"
 */
export function capitalizeCompanyName(companyName: string): string {
  if (!companyName || typeof companyName !== 'string') return '';

  // Company suffixes that should be uppercase
  const uppercaseSuffixes = ['bv', 'nv', 'n.v.', 'b.v.', 'vof', 'cv', 'c.v.', 'bvba'];
  
  // Words that can stay lowercase in company names (unless first word)
  const lowercaseWords = ['van', 'de', 'den', 'der', 'het', "'t", 'te', 'en', 'und', '&'];

  return companyName
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      // Always capitalize the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }

      // Check if it's a company suffix (should be uppercase)
      if (uppercaseSuffixes.includes(word)) {
        return word.toUpperCase();
      }

      // Keep certain words lowercase
      if (lowercaseWords.includes(word)) {
        return word;
      }

      // Capitalize all other words
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

/**
 * Capitalizes street names properly
 * Examples:
 * - "kerkstraat 12" → "Kerkstraat 12"
 * - "van der helststraat 1a" → "Van der Helststraat 1a"
 * - "plein 1944" → "Plein 1944"
 */
export function capitalizeStreetName(street: string): string {
  if (!street || typeof street !== 'string') return '';

  // Words that can stay lowercase in street names (unless first word)
  const lowercaseWords = ['van', 'de', 'den', 'der', 'het', "'t", 'te', 'ten', 'ter', 'aan', 'bij', 'op'];

  return street
    .trim()
    .split(/\s+/)
    .map((word, index) => {
      // Keep numbers as-is
      if (/^\d/.test(word)) {
        return word;
      }

      // Convert to lowercase first
      const lowerWord = word.toLowerCase();

      // Always capitalize the first word
      if (index === 0) {
        return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
      }

      // Keep particles lowercase
      if (lowercaseWords.includes(lowerWord)) {
        return lowerWord;
      }

      // Capitalize all other words
      return lowerWord.charAt(0).toUpperCase() + lowerWord.slice(1);
    })
    .join(' ');
}

/**
 * Capitalizes city names properly
 * Examples:
 * - "amsterdam" → "Amsterdam"
 * - "'s-gravenhage" → "'s-Gravenhage"
 * - "den haag" → "Den Haag"
 */
export function capitalizeCityName(city: string): string {
  if (!city || typeof city !== 'string') return '';

  // Special cases for Dutch cities
  const specialCases: { [key: string]: string } = {
    "'s-gravenhage": "'s-Gravenhage",
    "'s gravenhage": "'s-Gravenhage",
    "den haag": "Den Haag",
    "'s-hertogenbosch": "'s-Hertogenbosch",
    "'s hertogenbosch": "'s-Hertogenbosch",
  };

  const lowerCity = city.trim().toLowerCase();
  
  // Check for special cases first
  if (specialCases[lowerCity]) {
    return specialCases[lowerCity];
  }

  // For regular cities, capitalize each word
  return lowerCity
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
