/**
 * Preloads an array of image URLs by creating Image objects and waiting for
 * each to load. Errors are silently ignored so a missing asset never blocks
 * the loading screen.
 *
 * @param {string[]} hrefs
 * @returns {Promise<void>}
 */
export function preloadImages(hrefs) {
    const promises = hrefs.map(href => {
        const img = new Image();
        img.src = href;
        return img.decode().catch(() => undefined);
    });
    return Promise.all(promises).then(() => undefined);
}