"use client";

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { NavbarSimple } from '@/components/navbar-simple';

// Componente client-side independiente para perfiles
const PerfilesClientSideComponent = dynamic(
  () => import('@/components/PerfilesClientSide'),
  { 
    ssr: false
  }
);

export default function PerfilesPage() {
  return (
    <div>
      <NavbarSimple />
      <PerfilesClientSideComponent />
    </div>
  );
}