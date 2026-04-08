/**
 * Logo component — displays the Donjon Fall logo image.
 * Phase 9.2
 */

/**
 * @param {{ className?: string, alt?: string }} props
 * @returns {JSX.Element}
 */
export function Logo({ className = "w-48 h-48", alt = "Donjon Fall logo" }) {
    return (
        <img
            src="/logo-donjon-fall.png"
            alt={alt}
            className={`object-contain ${className}`}
        />
    );
}
