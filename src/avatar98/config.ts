declare const __DEBUG__: boolean;

export const DEBUG: boolean = typeof __DEBUG__ !== 'undefined' ? __DEBUG__ : true;
export const SCREEN_W = 320;
export const SCREEN_H = 240;
export const TILE = 16;
export const STEP_HZ = 60;
export const STEP_MS = 1000 / STEP_HZ;
export const GAME_ID = 'avatar98';
export const SAVE_VERSION = 1;
export const SAVE_SLOTS = 3;
export const MAX_PARTY_ACTIVE = 3;
export const MAX_ROSTER = 8;
export const MAX_LEVEL = 99;
export const AVATAR_FORM_SLOTS = 4;
