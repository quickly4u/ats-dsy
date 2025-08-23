import { useState, useEffect, createContext, useContext } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';
import type { User as SupaUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mapSupabaseUser = (su: SupaUser): User => {
      const md = (su?.user_metadata ?? {}) as any;
      const company = md.company ?? {
        id: 'default',
        name: 'Your Company',
        slug: 'default',
        subscriptionPlan: 'free' as const,
        createdAt: new Date(),
      };
      const roles = (md.roles as User['roles']) ?? [
        { id: 'default', name: 'User', permissions: [], isSystem: false },
      ];

      return {
        id: su.id,
        email: su.email ?? '',
        firstName: md.firstName ?? md.first_name ?? '',
        lastName: md.lastName ?? md.last_name ?? '',
        phone: md.phone ?? '',
        avatar: md.avatar_url ?? md.avatar ?? undefined,
        company,
        roles,
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(su.created_at),
      };
    };

    const init = async () => {
      try {
        // Purge legacy demo auth cache if it exists
        try { localStorage.removeItem('ats_user'); } catch {}
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const session = data.session;
        if (session?.user) {
          setUser(mapSupabaseUser(session.user));
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
    });

    init();

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const getFriendlyAuthMessage = (error: any) => {
    const msg = (error?.message ?? '').toString().toLowerCase();
    const status = error?.status as number | undefined;
    if (msg.includes('invalid login credentials') || status === 400) {
      return 'Incorrect email or password.';
    }
    if (msg.includes('user not found')) {
      return 'No account found with that email.';
    }
    if (msg.includes('not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (status === 429 || msg.includes('rate limit')) {
      return 'Too many attempts. Please wait a minute and try again.';
    }
    if (typeof status === 'number' && status >= 500) {
      return 'Server error. Please try again later.';
    }
    return error?.message || 'Login failed. Please try again.';
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const supaUser = data.user;
      if (!supaUser) throw new Error('No user returned from Supabase');
      // Reuse mapper defined in effect via getUser to ensure metadata is fresh
      const { data: userResp } = await supabase.auth.getUser();
      const u = userResp.user as SupaUser;
      const md = (u?.user_metadata ?? {}) as any;
      const appUser: User = {
        id: u.id,
        email: u.email ?? email,
        firstName: md.firstName ?? md.first_name ?? '',
        lastName: md.lastName ?? md.last_name ?? '',
        phone: md.phone ?? '',
        avatar: md.avatar_url ?? md.avatar ?? undefined,
        company: md.company ?? {
          id: 'default',
          name: 'Your Company',
          slug: 'default',
          subscriptionPlan: 'free',
          createdAt: new Date(),
        },
        roles: (md.roles as User['roles']) ?? [
          { id: 'default', name: 'User', permissions: [], isSystem: false },
        ],
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(u.created_at),
      };
      setUser(appUser);
    } catch (error: any) {
      throw new Error(getFriendlyAuthMessage(error));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    try { localStorage.removeItem('ats_user'); } catch {}
    setUser(null);
  };

  const register = async (userData: Partial<User>) => {
    try {
      const email = userData.email;
      const password = (userData as any).password as string | undefined;
      if (!email || !password) {
        throw new Error('Email and password are required');
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            avatar: userData.avatar,
            company: userData.company,
            roles: userData.roles,
          },
        },
      });
      if (error) throw error;
    } finally {
      // no-op: keep global isLoading for auth bootstrapping only
    }
  };

  const resetPassword = async (email: string) => {
    if (!email) throw new Error('Enter your email to reset the password.');
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw new Error(error.message || 'Failed to send password reset email.');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    resetPassword,
  };
};

export { AuthContext };