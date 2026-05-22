export declare function useCreateOrder(): import("@tanstack/react-query").UseMutationResult<{
    passengers: {
        email: string;
        title: "mr" | "ms" | "mrs" | "miss" | "dr";
        given_name: string;
        family_name: string;
        born_on: string;
        gender: "m" | "f";
        phone_number: string;
    }[];
    savings: number;
    currency: string;
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
    bookingRef: string;
    duffelOrderId: string;
    totalAmount: number;
}, Error, {
    passengers: {
        email: string;
        title: "mr" | "ms" | "mrs" | "miss" | "dr";
        given_name: string;
        family_name: string;
        born_on: string;
        gender: "m" | "f";
        phone_number: string;
    }[];
    offerId: string;
}, unknown>;
//# sourceMappingURL=useCreateOrder.d.ts.map