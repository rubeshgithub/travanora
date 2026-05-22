import type { LoginInput, RegisterInput } from '@travanora/shared';
export declare function useAuth(): {
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
    isAuthenticated: boolean;
    login: (input: LoginInput) => Promise<{
        user: {
            firstName: string;
            lastName: string;
            email: string;
            city: string;
            id: string;
            emailVerified: boolean;
            createdAt: string;
        };
        member: {
            homeAirport: string;
            id: string;
            tier: "free" | "gold" | "platinum" | "corporate";
            discountPercent: number;
            joinedAt: string;
            preferredCabin?: "economy" | "premium_economy" | "business" | "first" | undefined;
        };
        accessToken: string;
    }>;
    register: (input: RegisterInput) => Promise<{
        user: {
            firstName: string;
            lastName: string;
            email: string;
            city: string;
            id: string;
            emailVerified: boolean;
            createdAt: string;
        };
        member: {
            homeAirport: string;
            id: string;
            tier: "free" | "gold" | "platinum" | "corporate";
            discountPercent: number;
            joinedAt: string;
            preferredCabin?: "economy" | "premium_economy" | "business" | "first" | undefined;
        };
        accessToken: string;
    }>;
    logout: () => Promise<void>;
};
//# sourceMappingURL=useAuth.d.ts.map