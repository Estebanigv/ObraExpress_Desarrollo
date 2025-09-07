"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';

// Client-side dynamic import with SSR disabled and error handling
const SimpleChatAI = dynamic(() => import('./SimpleChatAI').catch(() => {
  // Return a fallback component if import fails
  return { default: () => null };
}), { 
  ssr: false,
  loading: () => null
});

export default function SimpleChatAIWrapper() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything until component is mounted on client
  if (!isMounted) {
    return null;
  }

  return <SimpleChatAI />;
}