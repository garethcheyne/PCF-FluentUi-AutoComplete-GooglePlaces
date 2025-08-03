// Google Places API client-side functions using Google Maps JavaScript API
// Based on the working implementation from CloseQuote.js

/// <reference types="google.maps" />

import { GooglePlacesAutocompleteResponse, PlacePrediction, PlaceDetailsResponse } from '../types';

// Track if Google Maps API is loaded
let isGoogleApiLoaded = false;
let googleApiPromise: Promise<void> | null = null;

// Declare global Google Maps types for TypeScript
declare global {
    interface Window {
        google: typeof google;
        initGoogleMapsForPCF: () => void;
    }
}

function loadGooglePlacesAPI(apiKey: string): Promise<void> {
    // Check if already loaded (like in CloseQuote.js)
    if (window.google && window.google.maps && window.google.maps.places) {
        isGoogleApiLoaded = true;
        return Promise.resolve();
    }

    // Check if script is already being loaded
    if (document.getElementById("google-maps-script-pcf")) {
        return googleApiPromise || Promise.resolve();
    }

    if (googleApiPromise) {
        return googleApiPromise;
    }

    googleApiPromise = new Promise((resolve, reject) => {
        // Create callback function (following CloseQuote.js pattern)
        const callbackName = 'initGoogleMapsForPCF';

        // Set up global callback
        (window as any)[callbackName] = () => {
            isGoogleApiLoaded = true;
            delete (window as any)[callbackName];
            resolve();
        };

        // Create script element (following CloseQuote.js pattern)
        const script = document.createElement("script");
        script.id = "google-maps-script-pcf";
        script.async = true;
        script.defer = true;
        // Updated to include the new Places library with advanced markers support
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places,marker&callback=${callbackName}`;

        // Add error handling (like in CloseQuote.js)
        script.onerror = function () {
            delete (window as any)[callbackName];
            reject(new Error('Failed to load Google Maps API'));
        };

        document.head.appendChild(script);
    });

    return googleApiPromise;
}

async function fetchAddressSuggestions(query: string, apiKey: string, countryRestriction?: string, searchTypes?: string): Promise<GooglePlacesAutocompleteResponse> {
    // Ensure Google Places API is loaded (following CloseQuote.js pattern)
    await loadGooglePlacesAPI(apiKey);

    if (!window.google?.maps?.places) {
        throw new Error('Google Places API not available after loading');
    }

    return new Promise((resolve, reject) => {
            const service = new google.maps.places.AutocompleteService();

            const request: google.maps.places.AutocompletionRequest = {
                input: query,
                types: searchTypes ? searchTypes.split('|') as any : ['address']
            };

            // Add country restriction if provided
            if (countryRestriction && countryRestriction.trim()) {
                const countries = countryRestriction.split(',').map(c => c.trim().toLowerCase());
                request.componentRestrictions = {
                    country: countries
                };
            }

            service.getPlacePredictions(request, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    const response: GooglePlacesAutocompleteResponse = {
                        predictions: predictions.map(prediction => ({
                            description: prediction.description,
                            matchedSubstrings: prediction.matched_substrings?.map(ms => ({
                                length: ms.length,
                                offset: ms.offset
                            })) || [],
                            placeId: prediction.place_id,
                            reference: (prediction as any).reference || prediction.place_id,
                            structuredFormatting: {
                                mainText: prediction.structured_formatting?.main_text || '',
                                mainTextMatchedSubstrings: prediction.structured_formatting?.main_text_matched_substrings?.map(ms => ({
                                    length: ms.length,
                                    offset: ms.offset
                                })) || [],
                                secondaryText: prediction.structured_formatting?.secondary_text || ''
                            },
                            terms: prediction.terms?.map(term => ({
                                offset: term.offset,
                                value: term.value
                            })) || [],
                            types: prediction.types || []
                        })),
                        status: status
                    };

                    resolve(response);
                } else {
                    const errorMsg = `Google Places API error: ${status}`;
                    reject(new Error(errorMsg));
                }
            });
        });
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetailsResponse> {
    // Ensure Google Places API is loaded (following CloseQuote.js pattern)
    await loadGooglePlacesAPI(apiKey);

        if (!window.google?.maps?.places) {
            throw new Error('Google Places API not available after loading');
        }

        return new Promise((resolve, reject) => {
            // Create a temporary div for the PlacesService (required by Google API)
            const tempDiv = document.createElement('div');
            const service = new google.maps.places.PlacesService(tempDiv);

            const request: google.maps.places.PlaceDetailsRequest = {
                placeId: placeId,
                fields: [
                    'formatted_address',
                    'geometry',
                    'name',
                    'rating',
                    'user_ratings_total',
                    'website',
                    'formatted_phone_number',
                    'opening_hours',
                    'photos',
                    'address_components',
                    'types',
                    'url'
                ]
            };

            service.getDetails(request, (place, status) => {

                if (status === google.maps.places.PlacesServiceStatus.OK && place) {
                    const response: PlaceDetailsResponse = {
                        result: {
                            addressComponents: place.address_components?.map(component => ({
                                longName: component.long_name,
                                shortName: component.short_name,
                                types: component.types
                            })),
                            formattedAddress: place.formatted_address || '',
                            geometry: {
                                location: {
                                    lat: place.geometry?.location?.lat() || 0,
                                    lng: place.geometry?.location?.lng() || 0
                                },
                                viewport: place.geometry?.viewport ? {
                                    northeast: {
                                        lat: place.geometry.viewport.getNorthEast().lat(),
                                        lng: place.geometry.viewport.getNorthEast().lng()
                                    },
                                    southwest: {
                                        lat: place.geometry.viewport.getSouthWest().lat(),
                                        lng: place.geometry.viewport.getSouthWest().lng()
                                    }
                                } : undefined
                            },
                            name: place.name,
                            placeId: place.place_id || placeId,
                            rating: place.rating,
                            types: place.types || [],
                            url: place.url,
                            userRatingsTotal: place.user_ratings_total
                        },
                        status: status
                    };

                    resolve(response);
                } else {
                    const errorMsg = `Google Places API error: ${status}`;
                    reject(new Error(errorMsg));
                }
            });
        });
}

export { fetchAddressSuggestions, fetchPlaceDetails };