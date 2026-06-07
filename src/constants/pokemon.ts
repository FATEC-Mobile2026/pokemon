export type PokemonType =
  | 'fogo' | 'água' | 'grama' | 'elétrico' | 'psíquico' | 'gelo'
  | 'dragão' | 'trevas' | 'fada' | 'lutador' | 'veneno' | 'terra'
  | 'pedra' | 'inseto' | 'fantasma' | 'aço' | 'voador' | 'normal';

export const TYPE_MAP: Record<string, string> = {
  fire: 'fogo',      water: 'água',     grass: 'grama',
  electric: 'elétrico', psychic: 'psíquico', ice: 'gelo',
  dragon: 'dragão',  dark: 'trevas',    fairy: 'fada',
  fighting: 'lutador', poison: 'veneno', ground: 'terra',
  rock: 'pedra',     bug: 'inseto',     ghost: 'fantasma',
  steel: 'aço',      flying: 'voador',  normal: 'normal',
};

export const TYPE_ICONS: Record<string, string> = {
  fogo: '🔥', água: '💧', grama: '🌿', elétrico: '⚡',
  psíquico: '🔮', gelo: '❄️', dragão: '🐉', trevas: '🌑',
  fada: '✨', lutador: '🥊', veneno: '☠️', terra: '🪨',
  pedra: '💎', inseto: '🐛', fantasma: '👻', aço: '⚙️',
  voador: '🌬️', normal: '⭐',
};

export const STAT_ABBR: Record<string, string> = {
    hp: 'HP',
    attack: 'ATK',
    defense: 'DEF',
    'special-attack': 'SP.A',
    'special-defense': 'SP.D',
    speed: 'SPD',
};

export const VALID_USER = {
  name: 'admin',
  password: 'admin',
};

export function validateLogin(name: string, password: string): boolean {
  return (
    name.trim().toLowerCase() === VALID_USER.name.toLowerCase() &&
    password.trim() === VALID_USER.password
  );
}
