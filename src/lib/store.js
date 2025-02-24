import { writable } from 'svelte/store';
/**
 * @type {import('svelte/store').Writable<import('../types/board').Board[]>}
 */
export const boards = writable([]);
/**
 * @type {import('svelte/store').Writable<import('../types/card').Card[]>}
 */
export const cards = writable([]);
/**
 * @type {import('svelte/store').Writable<import('../types/note').Note[]>}
 */
export const notes = writable([]);
export const activeBoard = writable('');
