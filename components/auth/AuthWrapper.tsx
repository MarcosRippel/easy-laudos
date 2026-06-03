'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import MainLayout from '../layout/MainLayout';
import { AuthUser } from '@/lib/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthWrapperProps {
  children: ReactNode;
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Páginas que não precisam de autenticação
  const publicRoutes = ['/login'];
  const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/verificar');

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
        if (!isPublicRoute) {
          router.push('/login');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      setUser(null);
      if (!isPublicRoute) {
        router.push('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/login');
    } catch (error) {
      console.error('Erro no logout:', error);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  // Redirecionamento para usuários autenticados tentando acessar login
  useEffect(() => {
    if (!isLoading && user && pathname === '/login') {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [user, isLoading, pathname]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        Carregando...
      </div>
    );
  }

  // Se não está autenticado e não é rota pública, não renderizar nada
  // (o useEffect já redirecionou para login)
  if (!user && !isPublicRoute) {
    return null;
  }

  const contextValue = {
    user,
    isLoading,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {isPublicRoute ? (
        children
      ) : (
        <MainLayout>
          {children}
        </MainLayout>
      )}
    </AuthContext.Provider>
  );
}