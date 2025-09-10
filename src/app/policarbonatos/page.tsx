"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import { NavbarSimple } from '@/components/navbar-simple';

// Componente client-side independiente para policarbonatos
const PolicarbonatosClientSideComponent = dynamic(
  () => import('@/components/PolicarbonatosClientSide'),
  { 
    ssr: false
  }
);

export default function PolicarbonatosPage() {
  return (
    <div>
      <NavbarSimple />
      <PolicarbonatosClientSideComponent />
    </div>
  );
}