export type DataPackageType = 'order' | 'confirmation' | 'email' | 'draft';

export interface OrderData {
  supplier?: string;
  itemCount?: number;
  total?: string;
}

export interface ParticleConfig {
  // Animation
  duration: number;           // ms - Geschwindigkeit der Animation
  
  // Größen
  mainParticleSize: number;   // px - Hauptpartikel Radius
  coreSize: number;           // px - Weißer Kern Radius
  trail1Size: number;         // px - Kleinster Trail Radius
  trail2Size: number;         // px - Mittlerer Trail Radius
  
  // Styling
  strokeWidth: number;        // px - Randdicke des Hauptpartikels
  pulseIntensity: number;     // 0-0.5 - Pulsier-Stärke (0 = kein Pulsieren)
  glowBlur: number;           // Glow-Effekt Stärke (stdDeviation)
  
  // Trail-Abstände (0-1, Anteil der Pfadlänge)
  trailOffset1: number;       // Abstand Trail 1 hinter Hauptpartikel
  trailOffset2: number;       // Abstand Trail 2 hinter Hauptpartikel
  
  // Opazität
  trail1Opacity: number;      // 0-1 - Transparenz Trail 1
  trail2Opacity: number;      // 0-1 - Transparenz Trail 2
  coreOpacity: number;        // 0-1 - Transparenz des Kerns

  // Data Package (new)
  showDataIcons: boolean;     // Zeige Daten-Icons statt Partikel
  iconSize: number;           // px - Größe der Icons
  showInfoPopup: boolean;     // Zeige Info-Popup beim Icon
  popupWidth: number;         // px - Breite des Popups
}

export const DEFAULT_PARTICLE_CONFIG: ParticleConfig = {
  duration: 1200,
  mainParticleSize: 24,
  coreSize: 10,
  trail1Size: 10,
  trail2Size: 16,
  strokeWidth: 5,
  pulseIntensity: 0.15,
  glowBlur: 10,
  trailOffset1: 0.08,
  trailOffset2: 0.16,
  trail1Opacity: 0.3,
  trail2Opacity: 0.5,
  coreOpacity: 0.8,
  // Data Package defaults
  showDataIcons: true,
  iconSize: 40,
  showInfoPopup: true,
  popupWidth: 140,
};

// Preset configurations for different effects
export const PARTICLE_PRESETS = {
  default: DEFAULT_PARTICLE_CONFIG,
  fast: {
    ...DEFAULT_PARTICLE_CONFIG,
    duration: 600,
    pulseIntensity: 0.25,
  },
  slow: {
    ...DEFAULT_PARTICLE_CONFIG,
    duration: 2500,
    pulseIntensity: 0.08,
  },
  large: {
    ...DEFAULT_PARTICLE_CONFIG,
    mainParticleSize: 36,
    coreSize: 14,
    trail1Size: 14,
    trail2Size: 22,
    strokeWidth: 6,
    iconSize: 48,
  },
  subtle: {
    ...DEFAULT_PARTICLE_CONFIG,
    mainParticleSize: 16,
    coreSize: 6,
    trail1Size: 6,
    trail2Size: 10,
    strokeWidth: 3,
    glowBlur: 5,
    pulseIntensity: 0.08,
    iconSize: 32,
    showInfoPopup: false,
  },
} as const;
