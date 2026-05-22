export declare const apiClient: {
    setToken(token: string | null): void;
    onTokenRefreshed(cb: (token: string) => void): void;
    onSessionExpired(cb: () => void): void;
};
export declare class ApiError extends Error {
    readonly status: number;
    readonly code: string;
    readonly details?: {
        fields?: Record<string, string>;
        [key: string]: unknown;
    } | undefined;
    constructor(status: number, code: string, message: string, details?: {
        fields?: Record<string, string>;
        [key: string]: unknown;
    } | undefined);
}
export declare const api: {
    get<T>(path: string): Promise<T>;
    post<T>(path: string, body?: unknown): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
};
//# sourceMappingURL=api.d.ts.map