import * as React from 'react';
import { PlaceResult, GooglePlacesUtils } from '../types';
import { Stack, Text, Link, Icon, Spinner, SpinnerSize } from '@fluentui/react';
import { fetchPlaceDetails } from './Queries';

/// <reference types="google.maps" />

// Card dimensions
const CARD_WIDTH = 420;
const MAP_HEIGHT = 180; // Square-ish with the card width

interface EntityHoverCardProps {
    placeId: string;
    apiKey: string;
    arrowPosition?: number;
    onLoading?: (isLoading: boolean) => void;
}

export const EntityHoverCard: React.FC<EntityHoverCardProps> = ({
    placeId,
    apiKey,
    arrowPosition = 24,
    onLoading
}) => {
    const [placeDetails, setPlaceDetails] = React.useState<PlaceResult | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [mapLoaded, setMapLoaded] = React.useState(false);
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<google.maps.Map | null>(null);

    React.useEffect(() => {
        const fetchDetails = async () => {
            if (!placeId || !apiKey) return;

            setIsLoading(true);
            setMapLoaded(false); // Reset map loaded state
            if (onLoading) onLoading(true);

            try {
                const response = await fetchPlaceDetails(placeId, apiKey);

                if (response.status === 'OK') {
                    setPlaceDetails(response.result);
                    setError(null);
                } else {
                    setError(`Google Places API Error: ${response.status}`);
                }
            } catch (err) {
                console.error('Error fetching place details:', err);
                setError('Failed to load place details');
            } finally {
                setIsLoading(false);
                if (onLoading) onLoading(false);
            }
        };

        fetchDetails();
    }, [placeId, apiKey, onLoading]);

    // Initialize map when place details are loaded
    React.useEffect(() => {
        if (!placeDetails) return;

        let isMounted = true; // Track if component is still mounted

        const initMap = async () => {
            console.log('EntityHoverCard - initMap called');
            console.log('EntityHoverCard - placeDetails:', !!placeDetails);

            // Wait for mapRef to be available (with retry mechanism)
            let retryCount = 0;
            const maxRetries = 10;
            
            while (!mapRef.current && retryCount < maxRetries && isMounted) {
                console.log(`EntityHoverCard - Waiting for mapRef, retry ${retryCount + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, 50));
                retryCount++;
            }

            if (!isMounted || !mapRef.current) {
                console.log('EntityHoverCard - Component unmounted or mapRef not available');
                return;
            }

            // Google Maps API should already be loaded by the PCF control
            if (!window.google?.maps) {
                console.error('EntityHoverCard - Google Maps API not available (should be loaded by PCF control)');
                return;
            }

            const lat = GooglePlacesUtils.getLatitude(placeDetails);
            const lng = GooglePlacesUtils.getLongitude(placeDetails);

            console.log('EntityHoverCard - Map coordinates:', { lat, lng });

            if (lat === 0 && lng === 0) {
                console.warn('EntityHoverCard - Invalid coordinates, cannot display map');
                return;
            }

            try {
                console.log('EntityHoverCard - Creating map with element:', mapRef.current);

                const mapOptions: google.maps.MapOptions = {
                    center: { lat, lng },
                    zoom: 15,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    disableDefaultUI: true,
                    zoomControl: true,
                    scrollwheel: false,
                    draggable: false
                };

                const map = new google.maps.Map(mapRef.current, mapOptions);
                
                if (!isMounted) {
                    console.log('EntityHoverCard - Component unmounted after map creation');
                    return;
                }
                
                mapInstanceRef.current = map;
                console.log('EntityHoverCard - Map created successfully');

                // Wait for map to be ready
                google.maps.event.addListenerOnce(map, 'idle', () => {
                    console.log('EntityHoverCard - Map is idle and ready');
                    
                    // Only update state if component is still mounted
                    if (isMounted) {
                        setMapLoaded(true);

                        // Add marker for the location
                        const marker = new google.maps.Marker({
                            position: { lat, lng },
                            map: map,
                            title: placeDetails.name || placeDetails.formattedAddress,
                            animation: google.maps.Animation.DROP
                        });

                        console.log('EntityHoverCard - Marker created successfully');

                        // Add info window
                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div style="padding: 8px; max-width: 200px;">
                                    <strong>${placeDetails.name || 'Location'}</strong><br>
                                    <small>${placeDetails.formattedAddress}</small>
                                </div>
                            `
                        });

                        marker.addListener('click', () => {
                            infoWindow.open(map, marker);
                        });
                    }
                });

            } catch (error) {
                console.error('EntityHoverCard - Error creating map:', error);
            }
        };

        // Start initialization
        initMap();

        // Cleanup function
        return () => {
            isMounted = false; // Mark component as unmounted
            
            if (mapInstanceRef.current) {
                console.log('EntityHoverCard - Cleaning up map instance');
                try {
                    // Clear all event listeners
                    google.maps.event.clearInstanceListeners(mapInstanceRef.current);
                    
                    // Clear the map container completely
                    if (mapRef.current) {
                        mapRef.current.innerHTML = '';
                    }
                } catch (error) {
                    console.log('EntityHoverCard - Error during cleanup:', error);
                }
                mapInstanceRef.current = null;
            }
        };
    }, [placeDetails]);

    const renderAddressComponents = React.useCallback(() => {
        if (!placeDetails) return null;

        const streetNumber = GooglePlacesUtils.getStreetNumber(placeDetails);
        const streetName = GooglePlacesUtils.getStreetName(placeDetails);
        const city = GooglePlacesUtils.getCity(placeDetails);
        const state = GooglePlacesUtils.getState(placeDetails);
        const postalCode = GooglePlacesUtils.getPostalCode(placeDetails);
        const country = GooglePlacesUtils.getCountry(placeDetails);

        return (
            <Stack horizontalAlign="start" tokens={{ childrenGap: 4 }}>
                {streetNumber && streetName && (
                    <Text variant="small">
                        <strong>Street:</strong> {streetNumber} {streetName}
                    </Text>
                )}
                {city && (
                    <Text variant="small">
                        <strong>City:</strong> {city}
                    </Text>
                )}
                {state && (
                    <Text variant="small">
                        <strong>State/Region:</strong> {state}
                    </Text>
                )}
                {postalCode && (
                    <Text variant="small">
                        <strong>Postal Code:</strong> {postalCode}
                    </Text>
                )}
                {country && (
                    <Text variant="small">
                        <strong>Country:</strong> {country}
                    </Text>
                )}
            </Stack>
        );
    }, [placeDetails]);

    if (isLoading) {
        return (
            <Stack
                horizontalAlign="start"
                style={{
                    padding: '16px',
                    minWidth: `${CARD_WIDTH}px`,
                    maxWidth: `${CARD_WIDTH + 20}px`,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 3
                }}
            >
                {/* Arrow pointing to the hovered item */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-8px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #ffffff',
                        zIndex: 2
                    }}
                />
                {/* Arrow border */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-9px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #e1e1e1',
                        zIndex: 1
                    }}
                />

                <Stack horizontalAlign="center" verticalAlign="center" style={{ 
                    padding: '20px', 
                    minHeight: '200px', 
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Spinner size={SpinnerSize.medium} label="Loading place details..." />
                </Stack>
            </Stack>
        );
    }

    if (error) {
        return (
            <Stack
                horizontalAlign="start"
                style={{
                    padding: '16px',
                    minWidth: `${CARD_WIDTH}px`,
                    maxWidth: `${CARD_WIDTH + 20}px`,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 3
                }}
            >
                {/* Arrow pointing to the hovered item */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-8px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #ffffff',
                        zIndex: 2
                    }}
                />
                {/* Arrow border */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-9px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #e1e1e1',
                        zIndex: 1
                    }}
                />

                <Stack horizontalAlign="center" verticalAlign="center" style={{ 
                    padding: '20px', 
                    minHeight: '200px', 
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon iconName="Error" style={{ color: '#A80000', fontSize: '24px', marginBottom: '8px' }} />
                    <Text variant="small" style={{ color: '#A80000', textAlign: 'center' }}>
                        {error}
                    </Text>
                </Stack>
            </Stack>
        );
    }

    if (!placeDetails) {
        return (
            <Stack
                horizontalAlign="start"
                style={{
                    padding: '16px',
                    minWidth: `${CARD_WIDTH}px`,
                    maxWidth: `${CARD_WIDTH + 20}px`,
                    backgroundColor: '#ffffff',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    position: 'relative',
                    zIndex: 3
                }}
            >
                {/* Arrow pointing to the hovered item */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-8px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #ffffff',
                        zIndex: 2
                    }}
                />
                {/* Arrow border */}
                <div
                    style={{
                        position: 'absolute',
                        left: '-9px',
                        top: `${arrowPosition - 2}px`,
                        width: '0',
                        height: '0',
                        borderTop: '8px solid transparent',
                        borderBottom: '8px solid transparent',
                        borderRight: '8px solid #e1e1e1',
                        zIndex: 1
                    }}
                />

                <Stack horizontalAlign="center" verticalAlign="center" style={{ 
                    padding: '20px', 
                    minHeight: '200px', 
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <Icon iconName="Info" style={{ color: '#605E5C', fontSize: '24px', marginBottom: '8px' }} />
                    <Text variant="small" style={{ color: '#605E5C', textAlign: 'center' }}>
                        No details available
                    </Text>
                </Stack>
            </Stack>
        );
    }

    return (
        <Stack
            horizontalAlign="start"
            style={{
                padding: '16px',
                minWidth: `${CARD_WIDTH}px`,
                maxWidth: `${CARD_WIDTH + 20}px`,
                backgroundColor: '#ffffff',
                border: '1px solid #e1e1e1',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                position: 'relative',
                zIndex: 3,
                display: 'flex',
                flexDirection: 'column',
                height: 'auto'
            }}
        >
            {/* Arrow pointing to the hovered item */}
            <div
                style={{
                    position: 'absolute',
                    left: '-8px',
                    top: `${arrowPosition - 2}px`,
                    width: '0',
                    height: '0',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid #ffffff',
                    zIndex: 2
                }}
            />
            {/* Arrow border */}
            <div
                style={{
                    position: 'absolute',
                    left: '-9px',
                    top: `${arrowPosition - 2}px`,
                    width: '0',
                    height: '0',
                    borderTop: '8px solid transparent',
                    borderBottom: '8px solid transparent',
                    borderRight: '8px solid #e1e1e1',
                    zIndex: 1
                }}
            />

            {/* Place Name */}
            {placeDetails.name && (
                <Text variant="mediumPlus" style={{ fontWeight: 600, marginBottom: '8px' }}>
                    {placeDetails.name}
                </Text>
            )}

            {/* Map Container */}
            <div
                style={{
                    width: '100%',
                    height: `${MAP_HEIGHT}px`,
                    marginBottom: '12px',
                    border: '1px solid #e1e1e1',
                    borderRadius: '4px',
                    backgroundColor: '#f8f8f8',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Google Maps will completely take over this div */}
                <div
                    ref={mapRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        position: 'absolute',
                        top: 0,
                        left: 0
                    }}
                />
                {/* Loading overlay - positioned above the map div */}
                {!mapLoaded && (
                    <div
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: '#f8f8f8',
                            zIndex: 1
                        }}
                    >
                        <Text variant="small" style={{ textAlign: 'center', color: '#666', fontSize: '12px' }}>
                            <Icon iconName="MapPin" style={{ marginRight: '4px' }} />
                            {!placeDetails ? 'Loading place details...' : !window.google?.maps ? 'Loading Google Maps...' : 'Initializing map...'}
                        </Text>
                    </div>
                )}
            </div>

            {/* Place Details */}
            <Stack horizontalAlign="start" tokens={{ childrenGap: 8 }} style={{ flex: 1 }}>
                <Text variant="small" style={{ fontWeight: 500 }}>
                    <Icon iconName="MapPin" style={{ marginRight: '4px', color: '#0078d4' }} />
                    {GooglePlacesUtils.getFormattedAddress(placeDetails)}
                </Text>

                {/* Address Components */}
                {renderAddressComponents()}

                {/* Coordinates */}
                <Text variant="xSmall" style={{ color: '#605E5C' }}>
                    <strong>Coordinates:</strong> {GooglePlacesUtils.getLatitude(placeDetails).toFixed(6)}, {GooglePlacesUtils.getLongitude(placeDetails).toFixed(6)}
                </Text>

                {/* Rating */}
                {placeDetails.rating && (
                    <Text variant="small">
                        <Icon iconName="FavoriteStarFill" style={{ marginRight: '4px', color: '#FFB900' }} />
                        <strong>Rating:</strong> {placeDetails.rating}/5
                        {placeDetails.userRatingsTotal && ` (${placeDetails.userRatingsTotal} reviews)`}
                    </Text>
                )}
            </Stack>

            {/* Footer Section - External Links */}
            <div style={{ 
                borderTop: '1px solid #e1e1e1', 
                paddingTop: '12px', 
                marginTop: '12px', 
                minWidth: '100%'
            }}>
                <Stack horizontal tokens={{ childrenGap: 16 }} horizontalAlign="space-between">
                    {placeDetails.url && (
                        <Link
                            href={placeDetails.url}
                            target="_blank"
                            style={{ fontSize: '12px' }}
                        >
                            <Icon iconName="NavigateExternalInline" style={{ marginRight: '4px' }} />
                            View on Maps
                        </Link>
                    )}

                    <Link
                        href={`https://www.google.com/search?q=${encodeURIComponent(GooglePlacesUtils.getFormattedAddress(placeDetails))}`}
                        target="_blank"
                        style={{ fontSize: '12px' }}
                    >
                        <Icon iconName="Search" style={{ marginRight: '4px' }} />
                        Search Address
                    </Link>
                </Stack>
            </div>
        </Stack>
    );
};
