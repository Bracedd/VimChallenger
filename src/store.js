import { writable } from 'svelte/store';

export const currentMode = writable('normal'); // Default mode: 'normal'
export const keyPresses = writable([]);  // Make sure keyPresses is exported like this
