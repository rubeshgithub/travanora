import type { UserResponse, MemberResponse } from '@travanora/shared';
interface AuthState {
    user: UserResponse | null;
    member: MemberResponse | null;
    accessToken: string | null;
    isAuthenticated: boolean;
    setAuth: (data: {
        user: UserResponse;
        member: MemberResponse;
        accessToken: string;
    }) => void;
    updateToken: (token: string) => void;
    clearAuth: () => void;
}
export declare const useAuthStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<AuthState>, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: {
                firstName: string;
                lastName: string;
                email: string;
                city: string;
                id: string;
                emailVerified: boolean;
                createdAt: string;
            } | null;
            member: {
                homeAirport: string;
                id: string;
                tier: "free" | "gold" | "platinum" | "corporate";
                discountPercent: number;
                joinedAt: string;
                preferredCabin?: "economy" | "premium_economy" | "business" | "first" | undefined;
            } | null;
            accessToken: string | null;
            isAuthenticated: boolean;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: AuthState) => void) => () => void;
        onFinishHydration: (fn: (state: AuthState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<AuthState, {
            user: {
                firstName: string;
                lastName: string;
                email: string;
                city: string;
                id: string;
                emailVerified: boolean;
                createdAt: string;
            } | null;
            member: {
                homeAirport: string;
                id: string;
                tier: "free" | "gold" | "platinum" | "corporate";
                discountPercent: number;
                joinedAt: string;
                preferredCabin?: "economy" | "premium_economy" | "business" | "first" | undefined;
            } | null;
            accessToken: string | null;
            isAuthenticated: boolean;
        }>>;
    };
}>;
export {};
//# sourceMappingURL=auth.store.d.ts.map