// import React from 'react';
// import { render, screen, waitFor, act } from '@testing-library/react';
// import { MemoryRouter, Route, Routes } from 'react-router-dom';
// import { describe, it, vi, beforeEach } from 'vitest';
// import axios from 'axios';
// import VerifyAdminEmail from '../../../components/admin/VerifyAdminEmail';
// vi.mock('axios');

// const mockNavigate = vi.fn();
// vi.mock('react-router-dom', async () => {
//   const actual = await vi.importActual('react-router-dom');
//   return {
//     ...actual,
//     useNavigate: () => mockNavigate,
//   };
// });

// describe('VerifyAdminEmail', () => {
//   beforeEach(() => {
//     vi.clearAllMocks();
//     localStorage.clear();
//   });

//   const renderWithToken = (token = 'valid-token') => {
//     return render(
//       <MemoryRouter initialEntries={[`/verify-admin-email/${token}`]}>
//         <Routes>
//           <Route path="/verify-admin-email/:token" element={<VerifyAdminEmail />} />
//         </Routes>
//       </MemoryRouter>
//     );
//   };

//   it('displays the verification stsatus as verifying', async () => {
//     axios.get.mockResolvedValueOnce({
//       data: { message: 'Verified!', tokens: { access: 'abc', refresh: 'xyz' } },
//     });

//     renderWithToken();
//     expect(screen.getByText('Verifying your email...')).toBeInTheDocument();

//     await waitFor(() => {
//       expect(screen.queryByText('Verifying your email...')).not.toBeInTheDocument();
//     });
//   });

//   it('displays success message ', async () => {
//     axios.get.mockResolvedValueOnce({
//       data: { message: 'Email verified successfully.', tokens: { access: 'abc123', refresh: 'xyz123' } },
//     });

//     renderWithToken();

//     await waitFor(() => {
//       expect(screen.getByText('Email verified successfully.')).toBeInTheDocument();
//       expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
//     });

//     expect(localStorage.getItem('token')).toBe('abc123');
//     expect(localStorage.getItem('refreshToken')).toBe('xyz123');
//     await act(() => new Promise((resolve) => setTimeout(resolve, 3100)));
//     expect(mockNavigate).toHaveBeenCalledWith('/login');
//   });

//   it('shows default message if no succsesful message displayed', async () => {
//     axios.get.mockResolvedValueOnce({
//       data: { tokens: { access: 'token123', refresh: 'refresh123' } }, 
//     });
  
//     renderWithToken();
  
//     await waitFor(() => {
//       expect(
//         screen.getByText('Email verified successfully. You can now log in.')
//       ).toBeInTheDocument();
//       expect(screen.getByText('Redirecting to login page...')).toBeInTheDocument();
//     });
//     expect(localStorage.getItem('token')).toBe('token123');
//     expect(localStorage.getItem('refreshToken')).toBe('refresh123');
//   });

//   it('displays error message on failure', async () => {
//     axios.get.mockRejectedValueOnce({
//       response: { data: { error: 'Invalid or expired token.' } },
//     });
//     renderWithToken();
//     await waitFor(() => {
//       expect(screen.getByText('Invalid or expired token.')).toBeInTheDocument();
//     });

//     expect(screen.getByText('Go to Login')).toBeInTheDocument();
//     expect(screen.getByText('Try Again')).toBeInTheDocument();
//   });

//   it('falls back to default error message if no error response', async () => {
//     axios.get.mockRejectedValueOnce(new Error('Network Error'));

//     renderWithToken();

//     await waitFor(() => {
//       expect(screen.getByText('Verification failed. Please try again or contact support.')).toBeInTheDocument();
//     });
//   });

  // it('goes to login paeg when "Go to Login" button is clicked', async () => {
  //   axios.get.mockRejectedValueOnce({
  //     response: { data: { error: 'Token expired' } },
  //   });
  
  //   renderWithToken();
  //   await waitFor(() => {
  //     expect(screen.getByText('Token expired')).toBeInTheDocument();
  //   });
  //   act(() => {
  //     screen.getByText('Go to Login').click();
  //   });
  //   expect(mockNavigate).toHaveBeenCalledWith('/login');
  // });
  
//   it('reloads page when "Try Again" is clicked', async () => {
//     axios.get.mockRejectedValueOnce({
//       response: { data: { error: 'Token expired' } },
//     });
//     const originalLocation = window.location;
//     delete window.location;
//     window.location = {
//       ...originalLocation,
//       reload: vi.fn(),
//     };
  
//     renderWithToken();
//     await waitFor(() => {
//       expect(screen.getByText('Try Again')).toBeInTheDocument();
//     });
  
//     act(() => {
//       screen.getByText('Try Again').click();
//     });
  
//     expect(window.location.reload).toHaveBeenCalled();
//     window.location = originalLocation;
//   });
  
  
  
// });

describe.skip('some test suite', () => {
  test('will not run', () => {
    expect(true).toBe(false);
  });
});