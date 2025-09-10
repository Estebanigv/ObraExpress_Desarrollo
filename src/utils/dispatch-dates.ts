// Utilidades para calcular fechas de despacho por tipo de producto

// Feriados de Chile (formato MM-DD)
const CHILEAN_HOLIDAYS: { [key: string]: string } = {
  '01-01': 'Año Nuevo',
  '03-29': 'Viernes Santo',
  '03-30': 'Sábado Santo',
  '05-01': 'Día del Trabajo',
  '05-21': 'Día de las Glorias Navales',
  '06-20': 'Día Nacional de los Pueblos Indígenas',
  '06-29': 'San Pedro y San Pablo',
  '07-16': 'Día de la Virgen del Carmen',
  '08-15': 'Asunción de la Virgen',
  '09-18': 'Primera Junta Nacional de Gobierno',
  '09-19': 'Día de las Glorias del Ejército',
  '09-20': 'Feriado adicional Fiestas Patrias',
  '10-12': 'Encuentro de Dos Mundos',
  '10-31': 'Día de las Iglesias Evangélicas',
  '11-01': 'Día de Todos los Santos',
  '12-08': 'Inmaculada Concepción',
  '12-25': 'Navidad'
};

// Función para verificar si una fecha es feriado en Chile
export function isChileanHoliday(date: Date): boolean {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;
  return key in CHILEAN_HOLIDAYS;
}

// Función para obtener el nombre del feriado
export function getHolidayName(date: Date): string | null {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const key = `${month}-${day}`;
  return CHILEAN_HOLIDAYS[key] || null;
}

// Definir tipos de productos y sus reglas de despacho
export interface ProductDispatchRule {
  category: string;
  availableDays: number[]; // 0=Domingo, 1=Lunes, ..., 6=Sábado
  timeRange: {
    start: number; // Hora de inicio (24h format)
    end: number;   // Hora de fin (24h format)
  };
  cutoffHour?: number; // Hora límite para despacho mismo día (solo aplicable si hoy es día disponible)
  description: string;
}

export const DISPATCH_RULES: ProductDispatchRule[] = [
  {
    category: 'policarbonato',
    availableDays: [4], // Solo jueves
    timeRange: { start: 9, end: 18 },
    cutoffHour: 18,
    description: 'Solo jueves de 9:00 a 18:00 hrs'
  },
  {
    category: 'accesorio',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 18 },
    cutoffHour: 16,
    description: 'Lunes a viernes de 9:00 a 18:00 hrs'
  },
  {
    category: 'rollo',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 18 },
    cutoffHour: 16,
    description: 'Lunes a viernes de 9:00 a 18:00 hrs'
  },
  {
    category: 'perfil',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 18 },
    cutoffHour: 16,
    description: 'Lunes a viernes de 9:00 a 18:00 hrs'
  },
  {
    category: 'pintura',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 17 },
    cutoffHour: 15,
    description: 'Lunes a viernes de 9:00 a 17:00 hrs'
  },
  {
    category: 'sellador',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 17 },
    cutoffHour: 15,
    description: 'Lunes a viernes de 9:00 a 17:00 hrs'
  },
  {
    category: 'herramienta',
    availableDays: [1, 2, 3, 4, 5], // Lunes a viernes
    timeRange: { start: 9, end: 18 },
    cutoffHour: 16,
    description: 'Lunes a viernes de 9:00 a 18:00 hrs'
  }
];

export function getDispatchRuleForProduct(productType: string): ProductDispatchRule {
  const normalizedType = productType.toLowerCase();
  
  // Buscar regla específica
  const rule = DISPATCH_RULES.find(rule => 
    normalizedType.includes(rule.category)
  );
  
  // Si no se encuentra regla específica, usar la de policarbonato como default
  return rule || DISPATCH_RULES[0];
}

export function getNextDispatchDate(productType: string = 'policarbonato'): Date {
  const rule = getDispatchRuleForProduct(productType);
  const today = new Date();
  const currentDay = today.getDay();
  const currentHour = today.getHours();
  
  let daysToAdd = 0;
  let found = false;
  
  // Para policarbonato específicamente, aplicar regla especial
  if (productType.toLowerCase().includes('policarbonato')) {
    // NUEVA REGLA: Si es MIÉRCOLES, el jueves más próximo queda bloqueado
    if (currentDay === 3) { // Es miércoles
      // El jueves de esta semana (mañana) está bloqueado
      // Buscar el jueves de la próxima semana
      for (let i = 8; i <= 21; i++) { // Empezar desde 8 días (jueves próxima semana)
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const checkDay = checkDate.getDay();
        
        if (checkDay === 4 && !isChileanHoliday(checkDate)) { // Jueves y no es feriado
          daysToAdd = i;
          found = true;
          break;
        }
      }
    }
    // Si es jueves y ya pasó la hora límite, ir al jueves siguiente
    else if (currentDay === 4 && rule.cutoffHour && currentHour >= rule.cutoffHour) {
      // Buscar el próximo jueves disponible que no sea feriado
      for (let i = 7; i <= 21; i += 7) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        
        if (!isChileanHoliday(checkDate)) {
          daysToAdd = i;
          found = true;
          break;
        }
      }
    }
    // Si es jueves y aún no pasa la hora límite, verificar si no es feriado
    else if (currentDay === 4 && rule.cutoffHour && currentHour < rule.cutoffHour) {
      if (!isChileanHoliday(today)) {
        return today;
      } else {
        // Si hoy es feriado, buscar el próximo jueves disponible
        for (let i = 7; i <= 21; i += 7) {
          const checkDate = new Date(today);
          checkDate.setDate(today.getDate() + i);
          
          if (!isChileanHoliday(checkDate)) {
            daysToAdd = i;
            found = true;
            break;
          }
        }
      }
    }
    // Para cualquier otro día, buscar el próximo jueves disponible
    else {
      for (let i = 1; i <= 21; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() + i);
        const checkDay = checkDate.getDay();
        
        if (checkDay === 4 && !isChileanHoliday(checkDate)) { // Jueves y no es feriado
          daysToAdd = i;
          found = true;
          break;
        }
      }
    }
  } else {
    // Para otros productos, usar la lógica normal
    // Primero verificar si hoy es día disponible y aún no ha pasado la hora límite
    if (rule.availableDays.includes(currentDay) && 
        rule.cutoffHour && 
        currentHour < rule.cutoffHour &&
        !isChileanHoliday(today)) {
      return today; // Despacho hoy mismo
    }
    
    // Buscar el próximo día disponible que no sea feriado
    for (let i = 1; i <= 21; i++) { // Buscar hasta 3 semanas adelante
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() + i);
      const checkDay = checkDate.getDay();
      
      if (rule.availableDays.includes(checkDay) && !isChileanHoliday(checkDate)) {
        daysToAdd = i;
        found = true;
        break;
      }
    }
  }
  
  const nextDispatchDate = new Date(today);
  nextDispatchDate.setDate(today.getDate() + daysToAdd);
  
  return nextDispatchDate;
}

export function formatDispatchDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    day: 'numeric',
    month: 'short'
  };
  
  const formattedDate = date.toLocaleDateString('es-CL', options);
  // Capitalizar la primera letra (Jueves en vez de jueves)
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  return `Despacho más próximo: ${capitalizedDate}`;
}

export function getDispatchTimeInfo(productType: string = 'policarbonato'): string {
  const rule = getDispatchRuleForProduct(productType);
  return `${rule.timeRange.start}:00 - ${rule.timeRange.end}:00 hrs`;
}

export function getDispatchMessage(productType: string = 'policarbonato'): string {
  const nextDate = getNextDispatchDate(productType);
  const formattedDate = formatDispatchDate(nextDate);
  const timeInfo = getDispatchTimeInfo(productType);
  
  return `Próximo: ${formattedDate}, ${timeInfo}`;
}

export function getDispatchDescription(productType: string = 'policarbonato'): string {
  const rule = getDispatchRuleForProduct(productType);
  return rule.description;
}

export function isWednesdayRule(): boolean {
  const today = new Date();
  return today.getDay() === 3; // Es miércoles
}

export function getDaysUntilNextDispatch(): number {
  const today = new Date();
  const nextDispatch = getNextDispatchDate();
  const diffTime = nextDispatch.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}