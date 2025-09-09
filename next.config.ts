import type { NextConfig } from "next";

// Configuración condicional basada en el entorno
const isStaticExport = process.env.STATIC_EXPORT === 'true';

const nextConfig: NextConfig = {
  // Configuración de raíz del proyecto
  outputFileTracingRoot: __dirname,
  
  // Export estático para Hostinger
  ...(isStaticExport && {
    output: 'export',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  }),
  
  // Configuración de imágenes para modo desarrollo/producción
  ...(!isStaticExport && {
    images: {
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: 31536000, // 1 año
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    },
  }),
  
  eslint: {
    // No bloquear el build por reglas ESLint en producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // No bloquear por type errors en el build
    ignoreBuildErrors: true,
  },
  // Optimizaciones para deployment
  poweredByHeader: false,
  generateEtags: false,
  
  // SOLUCIÓN DEFINITIVA: Sin configuración experimental para evitar Jest worker
  // Comentado completamente para usar configuración por defecto estable
  // experimental: {},

  // Compilador SWC optimizado
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Configuración turbopack estable
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // SOLUCIÓN MINIMALISTA: Solo configuraciones esenciales para Jest worker
  webpack: (config, { dev }) => {
    // SOLO las configuraciones absolutamente necesarias
    if (dev) {
      // Prevenir Jest worker error con configuración mínima
      config.cache = false;
      config.parallelism = 1;
    }
    
    return config;
  },
  
  // Headers de seguridad (solo para Vercel, no para static export)
  ...(!isStaticExport && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Content-Security-Policy',
              value: "default-src 'self' 'unsafe-inline' 'unsafe-eval'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; style-src 'self' 'unsafe-inline' https: data:; img-src 'self' data: https: blob:; connect-src 'self' https: data:; font-src 'self' https: data:; media-src 'self' https: data:; frame-src 'self' https:; object-src 'none'; base-uri 'self'; form-action 'self';",
            },
          ],
        },
      ];
    },
    
    // Redirects para SEO
    async redirects() {
      return [
        // Redirects de URLs legacy
        {
          source: '/home',
          destination: '/',
          permanent: true,
        },
        {
          source: '/inicio',
          destination: '/',
          permanent: true,
        },
        {
          source: '/catalog',
          destination: '/productos',
          permanent: true,
        },
        {
          source: '/catalogo',
          destination: '/productos',
          permanent: true,
        },
        {
          source: '/about',
          destination: '/nosotros',
          permanent: true,
        },
        {
          source: '/acerca-de',
          destination: '/nosotros',
          permanent: true,
        },
        {
          source: '/contact',
          destination: '/contacto',
          permanent: true,
        },
        // Redirects de productos específicos para SEO
        {
          source: '/productos/laminas-alveolares',
          destination: '/productos/policarbonato-alveolar',
          permanent: true,
        },
        {
          source: '/productos/laminas-compactas',
          destination: '/productos/policarbonato-compacto',
          permanent: true,
        },
        {
          source: '/productos/ondulado',
          destination: '/productos/policarbonato-ondulado',
          permanent: true,
        }
      ];
    },

    // Rewrites para better URL structure
    async rewrites() {
      return [
        {
          source: '/sitemap_index.xml',
          destination: '/api/sitemap',
        },
        {
          source: '/feed.xml',
          destination: '/api/feed',
        },
        {
          source: '/robots.txt',
          destination: '/api/robots',
        }
      ];
    },
  }),
  
  // SEO y Performance optimizations
  compress: true,
  productionBrowserSourceMaps: false,
  
  // Asset optimization
  assetPrefix: process.env.ASSET_PREFIX || '',
  
  // Configuraciones adicionales para SEO
  trailingSlash: false,
  skipMiddlewareUrlNormalize: false,
  skipTrailingSlashRedirect: false,
};

export default nextConfig;
