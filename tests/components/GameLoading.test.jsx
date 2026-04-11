/**
 * Tests for the GameLoading component.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GameLoading } from '../../src/components/GameLoading.jsx';

// Mock dependencies
vi.mock('../../src/utils/preloadImages.js', () => ({
    preloadImages: vi.fn(),
}));

vi.mock('../../src/game/gameState.js', () => ({
    createInitialState: vi.fn(),
}));

vi.mock('../../src/components/Logo.jsx', () => ({
    Logo: ({ className }) => <div data-testid="logo" className={className} />,
}));

vi.mock('../../src/components/Spinner.jsx', () => ({
    Spinner: () => <div data-testid="spinner" />,
}));

const LOADING_DURATION_MS = 1800;

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

/** Helper to build minimal test props. */
function makeProps(overrides = {}) {
    const defaults = {
        playerConfigs: [
            { id: 'red', name: 'Alice', coatOfArms: 'bear' },
            { id: 'blue', name: 'Bob', coatOfArms: 'wolf' },
        ],
        map: { fields: [] },
        onDone: vi.fn(),
    };
    return { ...defaults, ...overrides };
}

describe('GameLoading — rendering', () => {
    it('renders Logo component', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {}));

        render(<GameLoading {...makeProps()} />);
        expect(screen.getByTestId('logo')).toBeDefined();
    });

    it('renders Spinner component', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {}));

        render(<GameLoading {...makeProps()} />);
        expect(screen.getByTestId('spinner')).toBeDefined();
    });

    it('renders player names', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {}));

        render(<GameLoading {...makeProps()} />);
        expect(screen.getByText('Alice')).toBeDefined();
        expect(screen.getByText('Bob')).toBeDefined();
    });
});

describe('GameLoading — initialization', () => {
    it('calls createInitialState with player IDs and map fields', async () => {
        const { createInitialState } = await import('../../src/game/gameState.js');
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockReturnValue(new Promise(() => {})); // Never resolves

        const props = makeProps({ map: { fields: ['field1', 'field2'] } });
        render(<GameLoading {...props} />);

        expect(createInitialState).toHaveBeenCalledWith(['red', 'blue'], ['field1', 'field2']);
    });

    it('calls preloadImages on mount', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();
        preloadImages.mockReturnValue(new Promise(() => {})); // Never resolves

        render(<GameLoading {...makeProps()} />);
        expect(preloadImages).toHaveBeenCalledTimes(1);
    });
});

describe('GameLoading — loading behavior', () => {
    it('calls onDone after preload completes + LOADING_DURATION_MS', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();

        let resolvePreload;
        preloadImages.mockReturnValue(new Promise((resolve) => {
            resolvePreload = resolve;
        }));

        const props = makeProps();
        render(<GameLoading {...props} />);

        // Resolve preloadImages
        resolvePreload();
        await Promise.resolve(); // Let microtasks flush

        expect(props.onDone).not.toHaveBeenCalled();

        vi.advanceTimersByTime(LOADING_DURATION_MS);
        expect(props.onDone).toHaveBeenCalledTimes(1);
        expect(props.onDone).toHaveBeenCalledWith(['red', 'blue'], []);
    });

    it('does not call onDone if unmounted before timeout', async () => {
        const { preloadImages } = await import('../../src/utils/preloadImages.js');
        preloadImages.mockClear();

        let resolvePreload;
        preloadImages.mockReturnValue(new Promise((resolve) => {
            resolvePreload = resolve;
        }));

        const props = makeProps();
        const { unmount } = render(<GameLoading {...props} />);

        // Resolve preload
        resolvePreload();
        await Promise.resolve();

        // Unmount before timer expires
        unmount();

        vi.advanceTimersByTime(LOADING_DURATION_MS);
        expect(props.onDone).not.toHaveBeenCalled();
    });
});
