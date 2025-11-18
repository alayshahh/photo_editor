/* tslint:disable */
/* eslint-disable */
/**
 *
 * * Creates the final noise mask to use to apply grain to the photo.
 * * 3 masks created that are summed and returned.
 * * We will then use the returned Vec<f32> in the final composition.
 * * Since we dont want to update the final image, we will store it as a mask, but it needs to scale to the image so it will need to be applied at the end.
 * * (still deciding before or after halation)
 * 
 */
export function get_noise_mask(width: number, height: number, fine_grain_intensity: number, medium_grain_intensity: number, large_grain_intensity: number): Float32Array;
export function overlay_halation(base: Uint8Array, halation_mask: Uint8Array): void;
export function overlay_grain_mask(image: Uint8Array, grain_mask: Float32Array): void;
export function color_blurred_mask(blur_mask: Uint8Array, r: number, g: number, b: number): void;
export function create_brightness_mask(img_data: Uint8Array, threshold: number): void;
export function wbg_rayon_start_worker(receiver: number): void;
export function initThreadPool(num_threads: number): Promise<any>;
export class wbg_rayon_PoolBuilder {
  private constructor();
  free(): void;
  [Symbol.dispose](): void;
  numThreads(): number;
  build(): void;
  receiver(): number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly get_noise_mask: (a: number, b: number, c: number, d: number, e: number) => [number, number];
  readonly overlay_grain_mask: (a: number, b: number, c: any, d: number, e: number) => void;
  readonly overlay_halation: (a: number, b: number, c: any, d: number, e: number) => void;
  readonly color_blurred_mask: (a: number, b: number, c: any, d: number, e: number, f: number) => void;
  readonly create_brightness_mask: (a: number, b: number, c: any, d: number) => void;
  readonly __wbg_wbg_rayon_poolbuilder_free: (a: number, b: number) => void;
  readonly initThreadPool: (a: number) => any;
  readonly wbg_rayon_poolbuilder_build: (a: number) => void;
  readonly wbg_rayon_poolbuilder_numThreads: (a: number) => number;
  readonly wbg_rayon_poolbuilder_receiver: (a: number) => number;
  readonly wbg_rayon_start_worker: (a: number) => void;
  readonly memory: WebAssembly.Memory;
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_externrefs: WebAssembly.Table;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_thread_destroy: (a?: number, b?: number, c?: number) => void;
  readonly __wbindgen_start: (a: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number }} module - Passing `SyncInitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput, memory?: WebAssembly.Memory, thread_stack_size?: number } | SyncInitInput, memory?: WebAssembly.Memory): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number }} module_or_path - Passing `InitInput` directly is deprecated.
* @param {WebAssembly.Memory} memory - Deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput>, memory?: WebAssembly.Memory, thread_stack_size?: number } | InitInput | Promise<InitInput>, memory?: WebAssembly.Memory): Promise<InitOutput>;
