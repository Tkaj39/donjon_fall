/**
 * Tests for the SplashScreen component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SplashScreen } from '../../src/components/SplashScreen.jsx';

// Mock dependencies
vi.mock('../../src/utils/preloadImages.js', () => ({
    preloadImages: vi.fn(),
}));

vi.mock('../../src/components/Logo.jsx', () => ({
    Logo: ({ className }) => <div data-testid="logo" className={className} />,
}));

vi.mock('../../src/components/Spinner.jsx', () => ({
    Spinner: () => <div data-testid="spinner" />,
}));

const SPLASH_DURATION_MS = 2000;

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

describe('SplashScreen — rendering', () => {
    it('renders Logo component', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {})); // Never resolves

        render(<SplashScreen onDone={() => {}} />);
        expect(screen.getByTestId('logo')).toBeDefined();
    });

    it('renders Spinner component', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {}));

        render(<SplashScreen onDone={() => {}} />);
        expect(screen.getByTestId('spinner')).toBeDefined();
    });

    it('renders "Loading…" text', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {}));

        render(<SplashScreen onDone={() => {}} />);
        expect(screen.getByText('Loading…')).toBeDefined();
    });
});

describe('SplashScreen — loading behavior', () => {
    it('calls preloadImages on mount', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();
        preloadImages.mockReturnValue(new Promise(() => {})); // Never resolves

        render(<SplashScreen onDone={() => {}} />);
        expect(preloadImages).toHaveBeenCalledTimes(1);
    });

    it('calls onDone after preload completes + SPLASH_DURATION_MS', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();
        
        let resolvePreload;
        preloadImages.mockReturnValue(new Promise((resolve) => {
            resolvePreload = resolve;
        }));

        const onDone = vi.fn();
        render(<SplashScreen onDone={onDone} />);

        // Resolve preloadImages
        resolvePreload();
        await Promise.resolve(); // Let microtasks flush

        expect(onDone).not.toHaveBeenCalled();

        // Advance time by SPLASH_DURATION_MS
        vi.advanceTimersByTime(SPLASH_DURATION_MS);

        expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('does not call onDone if unmounted before timeout', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();

        let resolvePreload;
        preloadImages.mockReturnValue(new Promise((resolve) => {
            resolvePreload = resolve;
        }));

        const onDone = vi.fn();
        const { unmount } = render(<SplashScreen onDone={onDone} />);

        // Resolve preload
        resolvePreload();
        await Promise.resolve();

        // Unmount before timer expires
        unmount();

        vi.advanceTimersByTime(SPLASH_DURATION_MS);
        expect(onDone).not.toHaveBeenCalled();
    });
});
