import React from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/core/auth/AuthContext';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return null;
  }
  return isAuthenticated ? <Redirect href="/(tabs)" /> : <Redirect href="/login" />;
}
