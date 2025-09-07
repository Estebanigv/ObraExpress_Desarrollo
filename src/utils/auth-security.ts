// Utilidades de seguridad para autenticación
export class AuthSecurity {
  // Hash simple para contraseñas (para desarrollo - en producción usar bcrypt o similar)
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'obra_express_salt_2025');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Verificar contraseña contra hash
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedInput = await this.hashPassword(password);
    return hashedInput === hash;
  }

  // Validar fuerza de contraseña
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('La contraseña debe tener al menos 8 caracteres');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Debe contener al menos una letra mayúscula');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Debe contener al menos una letra minúscula');
    }
    
    if (!/[0-9]/.test(password)) {
      errors.push('Debe contener al menos un número');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Debe contener al menos un carácter especial');
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (errors.length === 0) {
      strength = password.length >= 12 ? 'strong' : 'medium';
    } else if (errors.length <= 2) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  // Validar formato de email
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Generar token de sesión seguro
  static generateSessionToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Verificar que el token de sesión no haya expirado
  static isSessionValid(timestamp: number, maxAgeHours: number = 24): boolean {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000; // Convertir a millisegundos
    return (now - timestamp) < maxAge;
  }

  // Sanitizar input para prevenir inyecciones
  static sanitizeInput(input: string): string {
    return input
      .trim()
      .replace(/[<>]/g, '') // Remover caracteres peligrosos básicos
      .substring(0, 255); // Limitar longitud
  }

  // Rate limiting simple (usando localStorage para demo)
  static checkRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 15): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const key = `auth_attempts_${identifier}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;
    
    const stored = localStorage.getItem(key);
    let attempts = stored ? JSON.parse(stored) : { count: 0, firstAttempt: now };
    
    // Resetear si ha pasado el tiempo
    if (now - attempts.firstAttempt > windowMs) {
      attempts = { count: 0, firstAttempt: now };
    }
    
    const allowed = attempts.count < maxAttempts;
    const remaining = Math.max(0, maxAttempts - attempts.count);
    const resetTime = attempts.firstAttempt + windowMs;
    
    if (!allowed) {
      console.warn(`🚫 Rate limit excedido para ${identifier}. Reinténtalo en ${Math.ceil((resetTime - now) / 60000)} minutos`);
    }
    
    return { allowed, remaining, resetTime };
  }

  // Incrementar contador de intentos
  static recordFailedAttempt(identifier: string): void {
    const key = `auth_attempts_${identifier}`;
    const now = Date.now();
    const stored = localStorage.getItem(key);
    let attempts = stored ? JSON.parse(stored) : { count: 0, firstAttempt: now };
    
    attempts.count++;
    if (attempts.count === 1) {
      attempts.firstAttempt = now;
    }
    
    localStorage.setItem(key, JSON.stringify(attempts));
  }

  // Limpiar intentos fallidos después de login exitoso
  static clearFailedAttempts(identifier: string): void {
    const key = `auth_attempts_${identifier}`;
    localStorage.removeItem(key);
  }
}

// Credenciales predeterminadas del sistema (hasheadas)
export const DEFAULT_ADMIN_CREDENTIALS = {
  email: 'admin@obraexpress.cl',
  // Hash de 'ObraExpress2025!' - cambiar en producción
  passwordHash: '1d5aa8a02743fac1fa732682ee79ba8ab751d7f7ba9e82062b9caeb857cfc8d6',
  role: 'admin' as const
};