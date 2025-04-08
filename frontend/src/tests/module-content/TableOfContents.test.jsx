import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TableOfContents from '../../components/module-content/TableOfContents'; 

describe('TableOfContents', () => {
  const moduleContent = [
    { id: 'section1', title: 'Introduction' },
    { id: 'section2', title: 'Body' },
    { id: 'section3', title: 'Conclusion' }
  ];
  const setActiveSection = vi.fn();
  let dummyElement;

  beforeEach(() => {
    vi.clearAllMocks();
    dummyElement = document.createElement('div');
    dummyElement.scrollIntoView = vi.fn();
    document.getElementById = vi.fn().mockReturnValue(dummyElement);
    render(<TableOfContents moduleContent={moduleContent} activeSection="section1" setActiveSection={setActiveSection} />);
  });

  it('renders the component with the correct initial active section', () => {
    expect(screen.getByText('Introduction')).toHaveClass('active');
    expect(screen.getByText('Body')).not.toHaveClass('active');
    expect(screen.getByText('Conclusion')).not.toHaveClass('active');
  });

  it('changes active section on click and scrolls to it', async () => {
    const bodyItem = screen.getByText('Body');
    await userEvent.click(bodyItem);
    expect(setActiveSection).toHaveBeenCalledWith('section2');
    //expect(bodyItem).toHaveClass('active');
    expect(dummyElement.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
  });

  it('should render all sections from the module content', () => {
        moduleContent.forEach(section => {
          expect(screen.getByText(section.title)).toBeInTheDocument();
        });
      });


});
