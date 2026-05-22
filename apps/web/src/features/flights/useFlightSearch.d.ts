export declare function useFlightSearch(): import("@tanstack/react-query").UseMutationResult<{
    discountPercent: number;
    offers: {
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
    }[];
    isMember: boolean;
    searchId: string;
}, Error, {
    origin: string;
    destination: string;
    departDate: string;
    passengers: number;
    cabinClass: "economy" | "premium_economy" | "business" | "first";
    tripType: "return" | "one_way" | "multi_city";
    returnDate?: string | undefined;
}, unknown>;
//# sourceMappingURL=useFlightSearch.d.ts.map