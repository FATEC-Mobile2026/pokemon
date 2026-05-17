export const FIREWORK_COLORS = [
  '#FFD600', '#FF6B35', '#F06292', '#4FC3F7',
  '#66BB6A', '#AB47BC', '#80DEEA', '#EF5350',
  '#AED581', '#7E57C2', '#F48FB1', '#FFCA28',
];

export const Colors = {
  white: '#FFFFFF',
  black: '#000000',
  background: '#080808',
  surface: '#111111',

  surfaceDeep: '#060606',
  surfaceAlt: '#141414',
  surfaceCard: '#1C1C1C',
  surfaceHighlight: '#2A2A2A',

  btnPrimary: '#FF6B35',
  labelPrimary: '#FFFFFF',
  txtPrimary: '#FFFFFF',

  overlayDark: 'rgba(0,0,0,0.65)',
  pokeballRed: '#FF1C1C',

  game: {
    win:  '#4ADE80',
    loss: '#F87171',
  },

  semantic: {
    error:   { bg: '#2a0800', border: '#FF6B35', text: '#FF6B35' },
    success: { bg: '#001a00', border: '#66BB6A', text: '#66BB6A' },
    warning: { bg: '#1a1400', border: '#FFD600', text: '#FFD600' },
    info:    { bg: '#00091a', border: '#4FC3F7', text: '#4FC3F7' },
  },

  gray: {
    100: '#F2F2F2',
    500: '#999999',
    800: '#333333',
  },

  // White transparency variants — muted text, dividers, subtle borders
  whiteAlpha: {
    '05': 'rgba(255,255,255,0.05)',
    '06': 'rgba(255,255,255,0.06)',
    '07': 'rgba(255,255,255,0.07)',
    '08': 'rgba(255,255,255,0.08)',
    '12': 'rgba(255,255,255,0.12)',
    '30': 'rgba(255,255,255,0.30)',
    '35': 'rgba(255,255,255,0.35)',
    '40': 'rgba(255,255,255,0.40)',
    '45': 'rgba(255,255,255,0.45)',
    '50': 'rgba(255,255,255,0.50)',
    '55': 'rgba(255,255,255,0.55)',
    '65': 'rgba(255,255,255,0.65)',
  },

  // Primary orange (#FF6B35) transparency variants
  primaryAlpha: {
    '18': 'rgba(255,107,53,0.18)',
    '25': 'rgba(255,107,53,0.25)',
    '30': 'rgba(255,107,53,0.30)',
    '60': 'rgba(255,107,53,0.60)',
  },

  types: {
    fogo:     { bg: '#1a0a00', accent: '#FF6B35', glow: 'rgba(255,107,53,0.5)'   },
    água:     { bg: '#00091a', accent: '#4FC3F7', glow: 'rgba(79,195,247,0.5)'   },
    grama:    { bg: '#001a00', accent: '#66BB6A', glow: 'rgba(102,187,106,0.5)'  },
    elétrico: { bg: '#1a1400', accent: '#FFD600', glow: 'rgba(255,214,0,0.5)'    },
    psíquico: { bg: '#1a0010', accent: '#F06292', glow: 'rgba(240,98,146,0.5)'   },
    gelo:     { bg: '#001218', accent: '#80DEEA', glow: 'rgba(128,222,234,0.5)'  },
    dragão:   { bg: '#06001a', accent: '#7E57C2', glow: 'rgba(126,87,194,0.5)'   },
    trevas:   { bg: '#0d0d0d', accent: '#8D6E63', glow: 'rgba(141,110,99,0.5)'   },
    fada:     { bg: '#1a0018', accent: '#F48FB1', glow: 'rgba(244,143,177,0.5)'  },
    lutador:  { bg: '#1a0500', accent: '#EF5350', glow: 'rgba(239,83,80,0.5)'    },
    veneno:   { bg: '#0f001a', accent: '#AB47BC', glow: 'rgba(171,71,188,0.5)'   },
    terra:    { bg: '#1a1000', accent: '#D4A373', glow: 'rgba(212,163,115,0.5)'  },
    pedra:    { bg: '#141008', accent: '#BCAAA4', glow: 'rgba(188,170,164,0.5)'  },
    inseto:   { bg: '#0a1400', accent: '#AED581', glow: 'rgba(174,213,129,0.5)'  },
    fantasma: { bg: '#0a0014', accent: '#9575CD', glow: 'rgba(149,117,205,0.5)'  },
    aço:      { bg: '#0f0f14', accent: '#90A4AE', glow: 'rgba(144,164,174,0.5)'  },
    voador:   { bg: '#000d1a', accent: '#81D4FA', glow: 'rgba(129,212,250,0.5)'  },
    normal:   { bg: '#111111', accent: '#BDBDBD', glow: 'rgba(189,189,189,0.4)'  },
  } as Record<string, { bg: string; accent: string; glow: string }>,
} as const;

export function getColor(types: string[]): { bg: string; accent: string; glow: string } {
  const primary = types[0] ?? 'normal';
  return Colors.types[primary] ?? Colors.types['normal'];
}
