// import { AuthContextProvider } from "../../../services/AuthContext";
// import { describe, it, expect, vi, beforeEach } from 'vitest';

// describe ('AuthContextProvider', () => {
//     it("correctly stores the user data and token", async() =>{
//         const mockResponse = {
//             data: {
//                     user:
//                    { username: '@admin',
//                     first_name: 'John',
//                     last_name: 'Doe',
//                     user_type: 'admin',
//                     password: 'password',
//                     confirm_password: 'password',
//                     email: 'email@example.org'},
//                     token: 'token'   
//                  },
//         };
//         mockApiInstance.post.mockResolvedValueOnce(mockResponse);
//         const result = await AuthContextProvider({user}, 'token');
//         expect(localStorage.getItem('token')).toBe('token');
//         expect(result).toEqual(mockResponse.data);
//     });
// });


import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { AuthContextProvider, AuthContext , logInUser} from '../../../services/AuthContext';
import React, { useContext } from 'react';

describe('AuthContextProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly loads user and token from localStorage', () => {
    const mockUser = {
      username: '@admin',
      first_name: 'John',
      last_name: 'Doe',
      user_type: 'admin',
      email: 'email@example.org',
    };
    const mockToken = 'token';

    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', mockToken);

    let contextValue;

    const TestComponent = () => {
      const context = useContext(AuthContext);
      contextValue = context;
      return <div>Test</div>;
    };

    render(
      <AuthContextProvider>
        <TestComponent />
      </AuthContextProvider>
    );

    expect(contextValue.user).toEqual(mockUser);
    expect(contextValue.token).toBe(mockToken);
  });
});

// describe('login user' , async() => {
//     it('logs in succesfully and stores tokens', () => {
//         const mockUser = {
//             username: '@admin',
//             password: 'password123',
//         };
//         const mockToken = 'token';
//         const mockRefreshToken = 'refreshToken'
//         localStorage.setItem('user', JSON.stringify(mockUser));
//         localStorage.setItem('token', mockToken);
//         localStorage.setItem('refreshToken', mockRefreshToken);

//         const result = await logInUser('@admin','password123');

//         expect(localStorage.getItem('user')).toBe('user');
//         expect(localStorage.getItem('token')).toBe('token');
//         expect(localStorage.getItem('refreshToken')).toBe(null);
        
//     });

//         it('signsup a user successfully', () => {
//             const mockUser = {
//                 username: '@admin',
//                 password: 'password',
//                 confirm: 'password',
//                 first_name: 'John',
//                 last_name: 'Doe',
//                 email: 'johndoes@example.org'
//             }
//             localStorage.setItem('user', JSON.stringify(mockUser));
//         });

// });

