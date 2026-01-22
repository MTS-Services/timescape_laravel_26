declare global {
    interface Route {
        (name?: undefined): {
            current(): string | null;
            params: Record<string, unknown>;
        };
        (
            name: string,
            params?: Record<string, unknown> | number | string | Array<number | string>,
            absolute?: boolean
        ): string;
    }

    var route: Route;
}

export { };