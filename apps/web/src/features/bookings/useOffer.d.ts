export declare function useOffer(offerId: string): import("@tanstack/react-query").UseQueryResult<{
    isMember: boolean;
    offer: {
        id: string;
        cabinClass: "economy" | "premium_economy" | "business" | "first";
        airlineName: string;
        airlineCode: string;
        slices: {
            origin: string;
            destination: string;
            departureAt: string;
            arrivalAt: string;
            durationMinutes: number;
            stops: number;
            segments: {
                origin: string;
                destination: string;
                departureAt: string;
                arrivalAt: string;
                flightNumber: string;
                airlineName: string;
                airlineCode: string;
            }[];
            originName?: string | undefined;
            destinationName?: string | undefined;
        }[];
        publicPrice: number;
        memberPrice: number;
        savings: number;
        currency: string;
        passengerCount: number;
        expiresAt?: string | undefined;
    };
    expiresAt?: string | undefined;
}, Error>;
//# sourceMappingURL=useOffer.d.ts.map