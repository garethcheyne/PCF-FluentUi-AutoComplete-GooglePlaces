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
    console.log('loadGooglePlacesAPI - Starting with apiKey:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');

    // Check if already loaded (like in CloseQuote.js)
    if (window.google && window.google.maps && window.google.maps.places) {
        console.log('loadGooglePlacesAPI - Google Maps API already loaded');
        isGoogleApiLoaded = true;
        return Promise.resolve();
    }

    // Check if script is already being loaded
    if (document.getElementById("google-maps-script-pcf")) {
        console.log('loadGooglePlacesAPI - Script already loading, waiting...');
        return googleApiPromise || Promise.resolve();
    }

    if (googleApiPromise) {
        console.log('loadGooglePlacesAPI - Loading in progress...');
        return googleApiPromise;
    }

    console.log('loadGooglePlacesAPI - Creating new Google Maps script');

    googleApiPromise = new Promise((resolve, reject) => {
        // Create callback function (following CloseQuote.js pattern)
        const callbackName = 'initGoogleMapsForPCF';

        // Set up global callback
        (window as any)[callbackName] = () => {
            console.log('loadGooglePlacesAPI - Google Maps API loaded successfully via callback');
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
            console.error("loadGooglePlacesAPI - Failed to load Google Maps API");
            delete (window as any)[callbackName];
            reject(new Error('Failed to load Google Maps API'));
        };

        console.log('loadGooglePlacesAPI - Appending script to document head');
        document.head.appendChild(script);
    });

    return googleApiPromise;
}

async function fetchAddressSuggestions(query: string, apiKey: string, countryRestriction?: string): Promise<GooglePlacesAutocompleteResponse> {
    console.log('fetchAddressSuggestions - Starting with query:', query);
    console.log('fetchAddressSuggestions - API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');
    console.log('fetchAddressSuggestions - Country Restriction:', countryRestriction || 'NONE');

    try {
        // Ensure Google Places API is loaded (following CloseQuote.js pattern)
        await loadGooglePlacesAPI(apiKey);

        if (!window.google?.maps?.places) {
            throw new Error('Google Places API not available after loading');
        }

        console.log('fetchAddressSuggestions - Google Places API is available, creating AutocompleteService');

        return new Promise((resolve, reject) => {
            const service = new google.maps.places.AutocompleteService();

            const request: google.maps.places.AutocompletionRequest = {
                input: query,
                types: ['address']
            };

            // Add country restriction if provided
            if (countryRestriction && countryRestriction.trim()) {
                const countries = countryRestriction.split(',').map(c => c.trim().toLowerCase());
                request.componentRestrictions = {
                    country: countries
                };
                console.log('fetchAddressSuggestions - Added country restrictions:', countries);
            }

            console.log('fetchAddressSuggestions - Making AutocompleteService request:', request);

            service.getPlacePredictions(request, (predictions, status) => {
                console.log('fetchAddressSuggestions - AutocompleteService response status:', status);
                console.log('fetchAddressSuggestions - AutocompleteService predictions count:', predictions?.length || 0);

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

                    console.log('fetchAddressSuggestions - Successfully mapped response with', response.predictions.length, 'predictions');
                    resolve(response);
                } else {
                    const errorMsg = `Google Places API error: ${status}`;
                    console.error('fetchAddressSuggestions - Error:', errorMsg);
                    reject(new Error(errorMsg));
                }
            });
        });
    } catch (error) {
        console.error('fetchAddressSuggestions - Catch block error:', error);
        throw error;
    }
}

async function fetchPlaceDetails(placeId: string, apiKey: string): Promise<PlaceDetailsResponse> {
    console.log('fetchPlaceDetails - Starting with placeId:', placeId);
    console.log('fetchPlaceDetails - API Key:', apiKey ? `${apiKey.substring(0, 8)}...` : 'NOT PROVIDED');

    try {
        // Ensure Google Places API is loaded (following CloseQuote.js pattern)
        await loadGooglePlacesAPI(apiKey);

        if (!window.google?.maps?.places) {
            throw new Error('Google Places API not available after loading');
        }

        console.log('fetchPlaceDetails - Google Places API is available, using new Place API');

        // Use the new Place API instead of deprecated PlacesService
        // According to Google's migration guide, we should use Place.fetchFields()
        const place = new google.maps.places.Place({
            id: placeId,
            requestedLanguage: 'en' // Optional: specify language preference
        });

        const fieldsToFetch = [
            'formattedAddress',
            'location',
            'viewport',
            'displayName',
            'rating',
            'userRatingCount',
            'websiteURI',
            'nationalPhoneNumber',
            'regularOpeningHours',
            'photos',
            'addressComponents',
            'types',
            'googleMapsURI'
        ];

        console.log('fetchPlaceDetails - Making Place.fetchFields request with fields:', fieldsToFetch);

        try {
            // Fetch the place details using the new API
            await place.fetchFields({ fields: fieldsToFetch });

            console.log('fetchPlaceDetails - Place.fetchFields response received');
            console.log('fetchPlaceDetails - Place data:', place);

            // Map the new Place object to our existing response structure
            const response: PlaceDetailsResponse = {
                result: {
                    addressComponents: place.addressComponents?.map(component => ({
                        longName: component.longText || '',
                        shortName: component.shortText || '',
                        types: component.types || []
                    })),
                    formattedAddress: place.formattedAddress || '',
                    geometry: {
                        location: {
                            lat: place.location?.lat() || 0,
                            lng: place.location?.lng() || 0
                        },
                        viewport: place.viewport ? {
                            northeast: {
                                lat: place.viewport.getNorthEast().lat(),
                                lng: place.viewport.getNorthEast().lng()
                            },
                            southwest: {
                                lat: place.viewport.getSouthWest().lat(),
                                lng: place.viewport.getSouthWest().lng()
                            }
                        } : undefined
                    },
                    name: place.displayName || '',
                    placeId: placeId,
                    rating: place.rating || undefined,
                    types: place.types || [],
                    url: place.googleMapsURI || undefined,
                    userRatingsTotal: place.userRatingCount || undefined
                },
                status: 'OK'
            };

            console.log('fetchPlaceDetails - Successfully mapped response using new Place API');
            return response;
        } catch (placeError) {
            console.error('fetchPlaceDetails - Place.fetchFields error:', placeError);
            
            // Fallback to the old PlacesService for compatibility during transition
            console.log('fetchPlaceDetails - Falling back to legacy PlacesService API');
            
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

                console.log('fetchPlaceDetails - Making fallback PlacesService request:', request);

                service.getDetails(request, (place, status) => {
                    console.log('fetchPlaceDetails - PlacesService fallback response status:', status);

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

                        console.log('fetchPlaceDetails - Successfully mapped fallback response');
                        resolve(response);
                    } else {
                        const errorMsg = `Google Places API error: ${status}`;
                        console.error('fetchPlaceDetails - Fallback error:', errorMsg);
                        reject(new Error(errorMsg));
                    }
                });
            });
        }
    } catch (error) {
        console.error('fetchPlaceDetails - Catch block error:', error);
        throw error;
    }
}

export { fetchAddressSuggestions, fetchPlaceDetails };