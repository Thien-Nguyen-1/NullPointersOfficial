

import React from "react";

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModuleCompletion from '../../components/module-content/ModuleCompletion';
import { BrowserRouter, useNavigate ,waitFor} from 'react-router-dom';
import * as api from "../../services/api";


const mockNavigate = vi.fn();

// Properly mock `react-router-dom`
vi.mock(import("react-router-dom"), async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ModuleCompletion',async () => {

  // it('navigates to the correct path for a worker', async () => {
  //  render( <BrowserRouter><ModuleCompletion user={{ user_type: 'worker' }} /> </BrowserRouter>);

  //   userEvent.click(screen.getByRole('button', { name: 'Back to Modules' }));
    
  //     expect(mockNavigate).toHaveBeenCalledWith('/worker/courses');
  //   });

  it('renders correctly for a worker', async() => {
    const user = { user_type: 'worker' };
    render( <BrowserRouter><ModuleCompletion user={{ user}} /> </BrowserRouter>);

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText(/successfully completed all content in this module/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Modules' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Back to Modules' }));
   });

   it('defaults to worker role if user_type is undefined', () => {
    const user = {};
    render( <BrowserRouter><ModuleCompletion user={{user}} /> </BrowserRouter>);

    userEvent.click(screen.getByRole('button', { name: 'Back to Modules' }));
  });

    
  it('renders correctly for an admin', () => {
    const user = { user_type: 'admin' };
    render( <BrowserRouter><ModuleCompletion user={{user}} /> </BrowserRouter>);

    expect(screen.getByText('Congratulations!')).toBeInTheDocument();
    expect(screen.getByText(/successfully completed all content in this module/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to Modules' })).toBeInTheDocument();

    userEvent.click(screen.getByRole('button', { name: 'Back to Modules' }));
  });
  
});
