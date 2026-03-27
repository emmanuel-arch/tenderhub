import { User } from '../contexts/AuthContext';

// Mock user database
export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    phone: '+254712345678',
    name: 'John Doe',
    role: 'client'
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    phone: '+254723456789',
    name: 'Jane Smith',
    role: 'client'
  },
  {
    id: 'admin-1',
    email: 'admin@tenderhub.co.ke',
    phone: '+254700000000',
    name: 'Admin User',
    role: 'admin'
  }
];

// Mock OTP storage (in real app, this would be server-side)
export const otpStore: Record<string, { otp: string; expiresAt: number; identifier: string }> = {};

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function findUserByIdentifier(identifier: string): User | undefined {
  return mockUsers.find(
    user => user.email === identifier || user.phone === identifier
  );
}
