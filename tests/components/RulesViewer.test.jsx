/**
 * Tests for the RulesViewer component (Phase 8.3).
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RulesViewer } from '../../src/components/RulesViewer.jsx';

function renderViewer(onClose = () => {}) {
    return render(<RulesViewer onClose={onClose} />);
}

describe('RulesViewer — structure', () => {
    test('renders a dialog with accessible label', () => {
        renderViewer();
        expect(screen.getByRole('dialog', { name: /rules viewer/i })).toBeDefined();
    });

    test('has aria-modal="true"', () => {
        renderViewer();
        expect(screen.getByRole('dialog').getAttribute('aria-modal')).toBe('true');
    });

    test('shows "Game Rules" heading', () => {
        renderViewer();
        expect(screen.getByText('Game Rules')).toBeDefined();
    });

    test('renders a close button', () => {
        renderViewer();
        expect(screen.getByTestId('close-btn')).toBeDefined();
    });

    test('renders expand all and collapse all buttons', () => {
        renderViewer();
        expect(screen.getByTestId('expand-all-btn')).toBeDefined();
        expect(screen.getByTestId('collapse-all-btn')).toBeDefined();
    });
});

describe('RulesViewer — sections', () => {
    test('renders all 7 section headings', () => {
        renderViewer();
        const sections = [
            'Board & Components',
            'Win Condition',
            'Scoring',
            'Turn Structure',
            'Actions',
            'Combat',
            'Towers & Key Terms',
        ];
        for (const title of sections) {
            expect(screen.getByText(title)).toBeDefined();
        }
    });

    test('sections start collapsed', () => {
        renderViewer();
        const buttons = screen.getAllByRole('button').filter(
            (b) => b.hasAttribute('aria-expanded'),
        );
        expect(buttons.every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
    });

    test('clicking a section heading expands it', () => {
        renderViewer();
        const btn = screen.getByText('Win Condition').closest('button');
        fireEvent.click(btn);
        expect(btn.getAttribute('aria-expanded')).toBe('true');
    });

    test('clicking an expanded section collapses it', () => {
        renderViewer();
        const btn = screen.getByText('Win Condition').closest('button');
        fireEvent.click(btn);
        fireEvent.click(btn);
        expect(btn.getAttribute('aria-expanded')).toBe('false');
    });

    test('expanding a section shows its content', () => {
        renderViewer();
        const btn = screen.getByText('Win Condition').closest('button');
        fireEvent.click(btn);
        expect(screen.getByText(/5 victory points/i)).toBeDefined();
    });
});

describe('RulesViewer — expand / collapse all', () => {
    test('"Expand all" expands all sections', () => {
        renderViewer();
        fireEvent.click(screen.getByTestId('expand-all-btn'));
        const buttons = screen.getAllByRole('button').filter(
            (b) => b.hasAttribute('aria-expanded'),
        );
        expect(buttons.every((b) => b.getAttribute('aria-expanded') === 'true')).toBe(true);
    });

    test('"Collapse all" collapses all sections', () => {
        renderViewer();
        fireEvent.click(screen.getByTestId('expand-all-btn'));
        fireEvent.click(screen.getByTestId('collapse-all-btn'));
        const buttons = screen.getAllByRole('button').filter(
            (b) => b.hasAttribute('aria-expanded'),
        );
        expect(buttons.every((b) => b.getAttribute('aria-expanded') === 'false')).toBe(true);
    });
});

describe('RulesViewer — close', () => {
    test('clicking close button calls onClose', () => {
        const onClose = vi.fn();
        renderViewer(onClose);
        fireEvent.click(screen.getByTestId('close-btn'));
        expect(onClose).toHaveBeenCalledOnce();
    });

    test('clicking the backdrop calls onClose', () => {
        const onClose = vi.fn();
        renderViewer(onClose);
        const backdrop = screen.getByRole('dialog');
        fireEvent.click(backdrop);
        expect(onClose).toHaveBeenCalledOnce();
    });
});
