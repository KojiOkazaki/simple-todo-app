export type Scene = 'title' | 'characterCreate' | 'battle' | 'event' | 'result';

export interface PlayerStats {
  communication: number;
  technical: number;
  motivation: number;
  luck: number;
}

export interface Player {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  stats: PlayerStats;
}

export interface EnemyData {
  name: string;
  title: string;
  hp: number;
  attack: number;
  stageName: string;
  actions: EnemyAction[];
}

export interface EnemyAction {
  name: string;
  minDamage: number;
  maxDamage: number;
  message: string;
}

export interface PlayerAction {
  id: string;
  name: string;
  description: string;
  statKey: keyof PlayerStats;
}

export interface GameEvent {
  title: string;
  description: string;
  effect: (player: Player) => Player;
  effectText: string;
}

export interface BattleLog {
  text: string;
  type: 'player' | 'enemy' | 'system';
}
