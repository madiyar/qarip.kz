import type { CollectionEntry } from 'astro:content';

export type LicenseEntry = CollectionEntry<'licenses'>;

/**
 * A license is listed on /licenses only when editors switched on "Сайтта көрсету" in the CMS.
 * It gets its own page when it is listed and has a full text or prices.
 * Fonts always show their license (name, permissions) whatever the switch says.
 */
export const isLicenseShown = (l: LicenseEntry) => l.data.visible;
export const hasLicensePage = (l: LicenseEntry) => l.data.visible && (Boolean(l.body?.trim()) || l.data.prices.length > 0);
