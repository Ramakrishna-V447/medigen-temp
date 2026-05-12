
import React, { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import { AuthState, User } from '../types';
import { db } from '../services/db';
import { sendLoginAlert } from '../services/emailService';

interface AuthContextType extends AuthState {
    loginWithOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
    requestOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<User | null>(null);

  // Load user from session (basic persistence for reload)
  useEffect(() => {
      const stored = sessionStorage.getItem('medigen_session_user');
      if (stored) {
          try {
              setUser(JSON.parse(stored));
          } catch (e) {
              console.error("Session parse error", e);
          }
      }
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
        const loggedUser = await db.authenticateUser(email, password);
        setUser(loggedUser);
        sessionStorage.setItem('medigen_session_user', JSON.stringify(loggedUser));
        
        await db.logActivity('Login', `User logged in: ${email}`);
        await db.logNotification('login', `User Login: ${loggedUser.name}`, email);
        
        // Trigger Email/SMS Notification
        sendLoginAlert(loggedUser).catch(err => console.error("Failed to send login alert", err));

        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Login failed" };
    }
  };

  const loginWithOtp = async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const loggedUser = await db.verifyOtp(email, otp);
          setUser(loggedUser);
          sessionStorage.setItem('medigen_session_user', JSON.stringify(loggedUser));
          
          await db.logActivity('OTP Login', `User logged in via OTP: ${email}`);
          await db.logNotification('login', `OTP Login: ${loggedUser.name}`, email);
          
          sendLoginAlert(loggedUser).catch(err => console.error("Failed to send login alert", err));
          return { success: true };
      } catch (e: any) {
          return { success: false, error: e.message || "Invalid OTP" };
      }
  };

  const requestOtp = async (email: string): Promise<{ success: boolean; error?: string }> => {
      try {
          await db.sendOtp(email);
          return { success: true };
      } catch (e: any) {
          return { success: false, error: e.message || "Failed to send OTP" };
      }
  };

  const register = async (name: string, email: string, phone: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
          const newUser = await db.registerUser(name, email, phone, password);
          setUser(newUser);
          sessionStorage.setItem('medigen_session_user', JSON.stringify(newUser));
          
          // Log locally so admin dashboard sees it even if backend is offline
          await db.logNotification('registration', `New User Registered: ${name}`, email);
          
          // Trigger Notification for new registration login
          sendLoginAlert(newUser).catch(err => console.error("Failed to send login alert", err));

          return { success: true };
      } catch (e: any) {
          return { success: false, error: e.message || "Registration failed" };
      }
  };

  const logout = () => {
    if (user) {
        db.logActivity('Logout', `User logged out: ${user.email}`);
    }
    setUser(null);
    sessionStorage.removeItem('medigen_session_user');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, loginWithOtp, requestOtp, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
