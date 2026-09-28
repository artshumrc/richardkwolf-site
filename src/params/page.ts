export function match(param: string) {
	return !/\.[a-z0-9]+$/i.test(param);
}
