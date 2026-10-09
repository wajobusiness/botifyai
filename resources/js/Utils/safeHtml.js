/**
 * Safely encode rich-text / HTML payloads to prevent false-positive blocks
 * by server Web Application Firewalls (LiteSpeed WAF / ModSecurity).
 * The Laravel backend automatically decodes any field with the 'b64:' prefix.
 *
 * @param {string|null|undefined} str
 * @returns {string}
 */
export function encodeSafeHtml(str) {
    if (!str || typeof str !== 'string') return str || '';
    try {
        return 'b64:' + btoa(unescape(encodeURIComponent(str)));
    } catch (_) {
        return str;
    }
}

