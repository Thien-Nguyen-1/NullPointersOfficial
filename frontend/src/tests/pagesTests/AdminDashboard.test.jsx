import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AdminDashboard from '../../pages/AdminDashboard';

describe('AdminDashboard Component', () => { //HAS TO BE CHANGED
  const renderWithRouter = (ui) => {
    return render(
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    );
  };

  // Test rendering of dashboard metrics
  it('should render dashboard metrics correctly', () => {
    renderWithRouter(<AdminDashboard />);

    // Check metrics
    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('1248')).toBeInTheDocument();

    expect(screen.getByText('Active Users')).toBeInTheDocument();
    expect(screen.getByText('986')).toBeInTheDocument();

    expect(screen.getByText('Total Modules')).toBeInTheDocument();
    expect(screen.getByText('76')).toBeInTheDocument();
  });

  // Test rendering of feature cards
  it('should render admin feature cards with correct links', () => {
    renderWithRouter(<AdminDashboard />);

    // Check Create Module card
    const createModuleCard = screen.getByText('Create Module').closest('a');
    expect(createModuleCard).toBeInTheDocument();
    expect(createModuleCard.getAttribute('href')).toBe('/admin/all-courses/create-and-manage-module');

    // Check Create Tag card
    const createTagCard = screen.getByText('Create Tag').closest('a');
    expect(createTagCard).toBeInTheDocument();
    expect(createTagCard.getAttribute('href')).toBe('/admin/create-tag');

    // Check Patient Profiles card
    const patientProfilesCard = screen.getByText('Patient Profiles').closest('a');
    expect(patientProfilesCard).toBeInTheDocument();
    expect(patientProfilesCard.getAttribute('href')).toBe('/admin/service-users');
  });

  // Test rendering of attention section
  it('should render attention section with correct data', () => {
    renderWithRouter(<AdminDashboard />);

    // Check attention section
    expect(screen.getByText('Requires Attention')).toBeInTheDocument();

    // Check reported issues
    expect(screen.getByText('Reported Issues')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Check pending approvals
    expect(screen.getByText('Pending Approvals')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    // Check link to support page
    const attentionSection = screen.getByText('Requires Attention').closest('a');
    expect(attentionSection).toBeInTheDocument();
    expect(attentionSection.getAttribute('href')).toBe('/admin/support');
  });
});