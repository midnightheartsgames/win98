import type { App, Scene } from '../app.ts';

export interface SceneFactories {
  shop?: (app: App, shopId: string) => Scene;
  save?: (app: App, mode: 'save' | 'load' | 'clean') => Scene;
  paisho?: (app: App, opponent: string, done: (won: boolean) => void) => Scene;
  worldmap?: (app: App, node: string, done: (dest: { map: string; spawn: string } | null) => void) => Scene;
  name?: (app: App, done: (name: string) => void) => Scene;
  radio?: (app: App) => Scene;
  ending?: (app: App, id: string) => Scene;
  titlecard?: (app: App, title: string, sub: string | null, frames: number) => Scene;
  battle?: (app: App, troop: string, done: (result: 'win' | 'lose' | 'escape') => void) => Scene;
  menu?: (app: App) => Scene;
  settings?: (app: App) => Scene;
}

export const Factories: SceneFactories = {};
