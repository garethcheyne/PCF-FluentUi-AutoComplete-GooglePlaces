// TypeScript interfaces for Google Places API Response
// This file contains all type definitions for Google Places API integration

export interface ParsedAddress {
    fullAddress: string;
    street?: string;
    suburb?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    building?: string;
    postcode?: string;
}

export interface AddressComponent {
    longName: string;
    shortName: string;
    types: string[];
}

export interface Geometry {
    location: {
        lat: number;
        lng: number;
    };
    viewport?: {
        northeast: {
            lat: number;
            lng: number;
        };
        southwest: {
            lat: number;
            lng: number;
        };
    };
}

export interface PlacePhoto {
    height: number;
    htmlAttributions: string[];
    photoReference: string;
    width: number;
}

export interface PlusCode {
    compoundCode?: string;
    globalCode: string;
}

export interface PlaceResult {
    addressComponents?: AddressComponent[];
    adrAddress?: string;
    businessStatus?: string;
    formattedAddress: string;
    geometry: Geometry;
    icon?: string;
    iconBackgroundColor?: string;
    iconMaskBaseUri?: string;
    name?: string;
    photos?: PlacePhoto[];
    placeId: string;
    plusCode?: PlusCode;
    rating?: number;
    reference?: string;
    types: string[];
    url?: string;
    userRatingsTotal?: number;
    utcOffset?: number;
    vicinity?: string;
}

export interface GooglePlacesAutocompleteResponse {
    predictions: PlacePrediction[];
    status: string;
}

export interface PlacePrediction {
    description: string;
    matchedSubstrings: MatchedSubstring[];
    placeId: string;
    reference: string;
    structuredFormatting: StructuredFormatting;
    terms: Term[];
    types: string[];
}

export interface MatchedSubstring {
    length: number;
    offset: number;
}

export interface StructuredFormatting {
    mainText: string;
    mainTextMatchedSubstrings?: MatchedSubstring[];
    secondaryText: string;
}

export interface Term {
    offset: number;
    value: string;
}

export interface PlaceDetailsResponse {
    result: PlaceResult;
    status: string;
}

// Utility class for working with Google Places data
export class GooglePlacesUtils {
    static getFormattedAddress(place: PlaceResult): string {
        return place.formattedAddress || '';
    }

    static getPlaceId(place: PlaceResult): string {
        return place.placeId || '';
    }

    static getAddressComponent(place: PlaceResult, componentType: string): string {
        if (!place.addressComponents) return '';

        for (const comp of place.addressComponents) {
            if (comp.types.indexOf(componentType) !== -1) {
                return comp.longName;
            }
        }

        return '';
    }

    static getAddressComponentShort(place: PlaceResult, componentType: string): string {
        if (!place.addressComponents) return '';

        for (const comp of place.addressComponents) {
            if (comp.types.indexOf(componentType) !== -1) {
                return comp.shortName;
            }
        }

        return '';
    }

    static getStreetNumber(place: PlaceResult): string {
        return this.getAddressComponent(place, 'street_number');
    }

    static getStreetName(place: PlaceResult): string {
        return this.getAddressComponent(place, 'route');
    }

    static getCity(place: PlaceResult): string {
        return this.getAddressComponent(place, 'locality') ||
            this.getAddressComponent(place, 'administrative_area_level_2');
    }

    static getState(place: PlaceResult): string {
        return this.getAddressComponent(place, 'administrative_area_level_1');
    }

    static getStateShort(place: PlaceResult): string {
        return this.getAddressComponentShort(place, 'administrative_area_level_1');
    }

    static getStateFormatted(place: PlaceResult, useShortName: boolean = false): string {
        return useShortName ? this.getStateShort(place) : this.getState(place);
    }

    static getPostalCode(place: PlaceResult): string {
        return this.getAddressComponent(place, 'postal_code');
    }

    static getCountry(place: PlaceResult): string {
        return this.getAddressComponent(place, 'country');
    }

    static getCountryShort(place: PlaceResult): string {
        return this.getAddressComponentShort(place, 'country');
    }

    static getCountryFormatted(place: PlaceResult, useShortName: boolean = false): string {
        return useShortName ? this.getCountryShort(place) : this.getCountry(place);
    }

    static getLatitude(place: PlaceResult): number {
        return place.geometry?.location?.lat || 0;
    }

    static getLongitude(place: PlaceResult): number {
        return place.geometry?.location?.lng || 0;
    }

    static getPremise(place: PlaceResult): string {
        return this.getAddressComponent(place, 'premise') ||
            this.getAddressComponent(place, 'subpremise');
    }

    static getSublocality(place: PlaceResult): string {
        return this.getAddressComponent(place, 'sublocality') ||
            this.getAddressComponent(place, 'sublocality_level_1') ||
            this.getAddressComponent(place, 'neighborhood');
    }

    static parseAddressComponents(place: PlaceResult, stateReturnShortName: boolean = false, countryReturnShortName: boolean = false): ParsedAddress {
        const streetNumber = this.getStreetNumber(place);
        const streetName = this.getStreetName(place);
        const street = streetNumber && streetName ? `${streetNumber} ${streetName}` : (streetName || streetNumber);

        return {
            fullAddress: this.getFormattedAddress(place),
            street: street || '',
            suburb: this.getSublocality(place) || '',
            city: this.getCity(place) || '',
            state: this.getStateFormatted(place, stateReturnShortName) || '',
            country: this.getCountryFormatted(place, countryReturnShortName) || '',
            latitude: this.getLatitude(place),
            longitude: this.getLongitude(place),
            building: this.getPremise(place) || '',
            postcode: this.getPostalCode(place) || ''
        };
    }
}

// Interface for the autocomplete component props
export interface AutoCompleteProps {
    value: string;
    onChange: (value: string) => void;
    apiKey: string;
    disabled?: boolean;
    placeholder?: string;
}

// Interface for search result items
export interface AddressItem {
    placeId: string;
    description: string;
    mainText: string;
    secondaryText: string;
    types: string[];
}
