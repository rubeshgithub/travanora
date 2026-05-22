export declare function useBookingDraft(): import("@tanstack/react-query").UseMutationResult<import("./booking.api.js").BookingDraftAPIResponse, Error, {
    passengers: {
        type: "adult" | "child" | "infant_without_seat";
        firstName: string;
        lastName: string;
        dob: string;
        nationality: string;
        email: string;
        phone: {
            number: string;
            countryCode: string;
        };
        title: "mr" | "ms" | "mrs" | "miss" | "dr";
        gender: "m" | "f";
        passportNumber?: string | undefined;
        passportExpiry?: string | undefined;
        passportIssuingCountry?: string | undefined;
    }[];
    offerId: string;
    contactEmail: string;
    contactPhone: string;
}, unknown>;
//# sourceMappingURL=useBookingDraft.d.ts.map