/**
 * Tests for the Spinner component.
 */

import { render } from '@testing-library/react';
import { Spinner } from '../../src/components/Spinner.jsx';

describe('Spinner', () => {
    test('renders a single div element', () => {
        const { container } = render(<Spinner />);
        const divs = container.querySelectorAll('div');
        expect(divs).toHaveLength(1);
    });

    test('has the animate-spin class for rotation', () => {
        const { container } = render(<Spinner />);
        const spinner = container.querySelector('div');
        expect(spinner.className).toMatch(/animate-spin/);
    });

    test('has rounded border styling', () => {
        const { container } = render(<Spinner />);
        const spinner = container.querySelector('div');
        expect(spinner.className).toMatch(/rounded-full/);
        expect(spinner.className).toMatch(/border-/);
    });
});
