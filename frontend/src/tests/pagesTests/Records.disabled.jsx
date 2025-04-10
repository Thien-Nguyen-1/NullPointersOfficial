import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Records from '../../pages/Records';

describe('Records Component', () => {
  it('should render the records page with placeholder text', () => {
    render(<Records />);

    // Check for page title
    expect(screen.getByText('Patient Records')).toBeInTheDocument();

    // Check for placeholder message
    expect(screen.getByText('Records data coming soon.')).toBeInTheDocument();
  });
});