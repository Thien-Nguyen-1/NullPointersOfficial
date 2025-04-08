import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HeadingContent from '../../components/module-content/HeadingContent';

describe('HeadingContent', () => {
  it('renders a h1 tag when level is 1', () => {
    const headingData = { level: 1, text: 'Main Heading' };
    render(<HeadingContent headingData={headingData} />);
    const headingElement = screen.getByRole('heading', { level: 1 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent('Main Heading');
  });

  it('renders a h2 tag when level is 2', () => {
    const headingData = { level: 2, text: 'Sub Heading' };
    render(<HeadingContent headingData={headingData} />);
    const headingElement = screen.getByRole('heading', { level: 2 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent('Sub Heading');
  });

  it('renders a h3 tag when level is 3', () => {
    const headingData = { level: 3, text: 'Sub-Sub Heading' };
    render(<HeadingContent headingData={headingData} />);
    const headingElement = screen.getByRole('heading', { level: 3 });
    expect(headingElement).toBeInTheDocument();
    expect(headingElement).toHaveTextContent('Sub-Sub Heading');
  });

});
