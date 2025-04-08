import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import ParagraphContent from '../../components/module-content/ParagraphContent';

describe('ParagraphContent', () => {
  it('renders the paragraph with the correct text', () => {
    const paragraphData = { text: 'Test paragraph content.' };
    render(<ParagraphContent paragraphData={paragraphData} />);
    const paragraphElement = screen.getByText('Test paragraph content.');
    expect(paragraphElement).toBeInTheDocument();
    expect(paragraphElement.tagName).toBe('P'); // Ensuring it's a paragraph element
  });

});
