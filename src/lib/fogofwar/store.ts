export function createStore<T extends object>(initial: T) {
	let state = initial;
	const subs = new Set<(s: T) => void>();
	return {
		get: () => state,
		set: (patch: Partial<T>) => {
			state = { ...state, ...patch };
			subs.forEach((f) => f(state));
		},
		subscribe: (f: (s: T) => void) => {
			subs.add(f);
			f(state);
			return () => subs.delete(f);
		}
	};
}

export type Store<T extends object> = ReturnType<typeof createStore<T>>;
