import * as React from 'react';
import { PlaceResult, GooglePlacesUtils } from '../types';
import { Stack, IStackTokens } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { Link } from '@fluentui/react/lib/Link';
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner';
import { Icon } from '@fluentui/react/lib/Icon';
import { IconButton, DefaultButton } from '@fluentui/react/lib/Button';
import { fetchPlaceDetails } from './Queries';
import { PlaceDetailsDialog } from './PlaceDetailsDialog';
import { getTheme, mergeStyleSets } from '@fluentui/react/lib/Styling';

/// <reference types="google.maps" />

const theme = getTheme();
const { palette, fonts } = theme;

// Card dimensions
const CARD_WIDTH = 460;
const MAP_HEIGHT = 160; // Slightly reduced to accommodate header
const TOTAL_HEIGHT = 520; // Increased total height to show action buttons

// Shared header styles (consistent with SettingsCallout)
const headerStyles = mergeStyleSets({
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${palette.neutralQuaternaryAlt}`,
        padding: '12px 16px',
        backgroundColor: palette.neutralLighterAlt,
        borderRadius: '8px 8px 0 0',
        width: '100%',
        boxSizing: 'border-box',
        minWidth: '100%'
    },
    title: {
        fontSize: fonts.medium.fontSize,
        fontWeight: '600',
        color: palette.neutralPrimary,
        margin: 0,
        flex: 1
    },
    closeButton: {
        color: palette.neutralSecondary,
        flexShrink: 0,
        selectors: {
            '&:hover': {
                backgroundColor: palette.neutralQuaternary,
                color: palette.neutralPrimary,
            }
        }
    },
    cardContainer: {
        padding: '0px',
        minWidth: `${CARD_WIDTH}px`,
        maxWidth: `${CARD_WIDTH + 20}px`,
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        position: 'relative',
        zIndex: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 'auto',
        maxHeight: `${TOTAL_HEIGHT}px`,
        borderBottom: `1px solid ${palette.neutralQuaternaryAlt}`, // Only bottom border
        boxShadow: theme.effects.elevation8, // Add shadow back to HoverCard
    },
    bodyContent: {
        padding: '16px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'visible', // Remove scroll from body content
        width: '100%',
        boxSizing: 'border-box'
    }
});

interface IHoverCardProps {
    placeId?: string;
    apiKey: string;
    // Alternative lookup methods
    addressComponents?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        fullAddress?: string;
    };
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    arrowPosition?: number;
    onLoading?: (isLoading: boolean) => void;
    onSelect?: (placeDetails: PlaceResult) => void;
    onClose?: () => void;
    showCoordinates?: boolean;
    showRatings?: boolean;
}

export const HoverCard: React.FC<IHoverCardProps> = ({
    placeId,
    apiKey,
    addressComponents,
    coordinates,
    arrowPosition = 24,
    onLoading,
    onSelect,
    onClose,
    showCoordinates = true,
    showRatings = true
}) => {
    const [placeDetails, setPlaceDetails] = React.useState<PlaceResult | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [mapLoaded, setMapLoaded] = React.useState(false);
    const [isDialogOpen, setIsDialogOpen] = React.useState(false);
    const mapRef = React.useRef<HTMLDivElement>(null);
    const mapInstanceRef = React.useRef<google.maps.Map | null>(null);

    React.useEffect(() => {
        const fetchDetails = async () => {
            console.log('PCF HoverCard: Starting lookup process');
            console.log('PCF HoverCard: Input parameters - placeId:', placeId, 'addressComponents:', addressComponents, 'coordinates:', coordinates);
            
            if (!apiKey) {
                console.log('PCF HoverCard: No API key provided');
                setError('API key is required');
                setIsLoading(false);
                if (onLoading) onLoading(false);
                return;
            }

            // Determine lookup method priority: placeId > reconstructed address > coordinates
            let lookupMethod = '';
            let lookupValue: string | null = null;

            if (placeId && placeId.trim() !== '') {
                lookupMethod = 'placeId';
                lookupValue = placeId.trim();
                console.log('PCF HoverCard: Using Place ID lookup:', lookupValue);
            } else if (addressComponents && (addressComponents.street || addressComponents.city)) {
                lookupMethod = 'address';
                // Construct address string for geocoding
                const addressParts = [
                    addressComponents.street,
                    addressComponents.city,
                    addressComponents.state,
                    addressComponents.country
                ].filter(part => part && part.trim() !== '');
                
                lookupValue = addressParts.join(', ');
                console.log('PCF HoverCard: Using reconstructed address lookup:', lookupValue);
            } else if (coordinates && coordinates.latitude && coordinates.longitude) {
                lookupMethod = 'coordinates';
                lookupValue = `${coordinates.latitude},${coordinates.longitude}`;
                console.log('PCF HoverCard: Using coordinates lookup:', lookupValue);
            } else {
                console.log('PCF HoverCard: No valid lookup method available');
                setError('No place ID, coordinates, or address components provided for lookup');
                setIsLoading(false);
                if (onLoading) onLoading(false);
                return;
            }

            setIsLoading(true);
            setMapLoaded(false);
            if (onLoading) onLoading(true);

            try {
                let response;
                
                if (lookupMethod === 'placeId') {
                    console.log('PCF HoverCard: Calling fetchPlaceDetails with Place ID:', lookupValue);
                    response = await fetchPlaceDetails(lookupValue!, apiKey);
                    console.log('PCF HoverCard: Place ID lookup response:', response);
                } else if (lookupMethod === 'coordinates') {
                    console.log('PCF HoverCard: Creating mock result for coordinates:', lookupValue);
                    // TODO: Implement reverse geocoding API call
                    // For now, create a basic place result from coordinates
                    response = {
                        status: 'OK',
                        result: {
                            placeId: '',
                            formattedAddress: `Location at ${lookupValue}`,
                            name: 'Geographic Location',
                            geometry: {
                                location: {
                                    lat: coordinates!.latitude,
                                    lng: coordinates!.longitude
                                }
                            },
                            addressComponents: [],
                            types: ['geographic_location']
                        }
                    };
                } else if (lookupMethod === 'address') {
                    console.log('PCF HoverCard: Processing reconstructed address:', lookupValue);
                    // Check if we have coordinates available to use with the reconstructed address
                    const hasValidCoordinates = coordinates && coordinates.latitude !== 0 && coordinates.longitude !== 0;
                    console.log('PCF HoverCard: Available coordinates:', coordinates, 'Valid:', hasValidCoordinates);
                    
                    // TODO: Implement geocoding API call for addresses without coordinates
                    // For now, create a place result using available coordinates or default to 0,0
                    response = {
                        status: 'OK',
                        result: {
                            placeId: '',
                            formattedAddress: lookupValue!,
                            name: addressComponents!.street || addressComponents!.city || 'Address',
                            geometry: {
                                location: {
                                    lat: hasValidCoordinates ? coordinates!.latitude : 0,
                                    lng: hasValidCoordinates ? coordinates!.longitude : 0
                                }
                            },
                            addressComponents: [],
                            types: ['street_address']
                        }
                    };
                    console.log('PCF HoverCard: Address result created with coordinates:', response.result.geometry.location);
                }

                console.log('PCF HoverCard: Final lookup response:', response);
                if (response && response.status === 'OK') {
                    console.log('PCF HoverCard: Lookup successful, setting place details');
                    setPlaceDetails(response.result);
                    setError(null);
                } else {
                    console.error('PCF HoverCard: Lookup failed with status:', response?.status || 'Unknown error');
                    setError(`Lookup failed: ${response?.status || 'Unknown error'}`);
                }
            } catch (err) {
                console.error('PCF HoverCard: Error during lookup:', err);
                setError('Failed to load place details');
            } finally {
                console.log('PCF HoverCard: Lookup process completed');
                setIsLoading(false);
                if (onLoading) onLoading(false);
            }
        };

        fetchDetails();
    }, [placeId, addressComponents, coordinates, apiKey, onLoading]);

    // Initialize map when place details are loaded
    React.useEffect(() => {
        if (!placeDetails) return;

        let isMounted = true; // Track if component is still mounted

        const initMap = async () => {
            // Wait for mapRef to be available (with retry mechanism)
            let retryCount = 0;
            const maxRetries = 10;

            while (!mapRef.current && retryCount < maxRetries && isMounted) {
                await new Promise(resolve => setTimeout(resolve, 50));
                retryCount++;
            }

            if (!isMounted || !mapRef.current) {
                return;
            }

            // Google Maps API should already be loaded by the PCF control
            if (!window.google?.maps) {
                return;
            }

            const lat = GooglePlacesUtils.getLatitude(placeDetails);
            const lng = GooglePlacesUtils.getLongitude(placeDetails);

            console.log('PCF HoverCard: Map initialization - coordinates:', { lat, lng });

            if (lat === 0 && lng === 0) {
                console.log('PCF HoverCard: Invalid coordinates (0,0) detected - setting map as loaded to show warning');
                // Invalid coordinates from reconstructed address - set map as "loaded" to show the error message
                setMapLoaded(true);
                return;
            }

            try {

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
                    return;
                }

                mapInstanceRef.current = map;

                // Wait for map to be ready
                google.maps.event.addListenerOnce(map, 'idle', () => {
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
                // Error creating map - silently handled
            }
        };

        // Start initialization
        initMap();

        // Cleanup function
        return () => {
            isMounted = false; // Mark component as unmounted

            if (mapInstanceRef.current) {
                try {
                    // Clear all event listeners
                    google.maps.event.clearInstanceListeners(mapInstanceRef.current);

                    // Clear the map container completely
                    if (mapRef.current) {
                        mapRef.current.innerHTML = '';
                    }
                } catch (error) {
                    // Error during cleanup - silently handled
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
            <div style={{
                display: 'flex',
                flexDirection: 'column' as const,
                gap: '8px'
            }}>
                {streetNumber && streetName && (
                    <Text>
                        <strong>Street:</strong> {streetNumber} {streetName}
                    </Text>
                )}
                {city && (
                    <Text>
                        <strong>City:</strong> {city}
                    </Text>
                )}
                {state && (
                    <Text>
                        <strong>State/Region:</strong> {state}
                    </Text>
                )}
                {postalCode && (
                    <Text>
                        <strong>Postal Code:</strong> {postalCode}
                    </Text>
                )}
                {country && (
                    <Text>
                        <strong>Country:</strong> {country}
                    </Text>
                )}
            </div>
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
                    borderRadius: '8px',
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
                    borderRadius: '8px',
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
            className={headerStyles.cardContainer}
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
                    borderRight: `8px solid ${palette.neutralQuaternaryAlt}`,
                    zIndex: 1
                }}
            />

            {/* Header */}
            <div className={headerStyles.header}>
                <Text className={headerStyles.title}>
                    {placeDetails.name || 'Place Details'}
                </Text>
                <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    className={headerStyles.closeButton}
                    onClick={() => {
                        if (onClose) {
                            onClose();
                        }
                    }}
                    ariaLabel="Close place details"
                    title="Close"
                />
            </div>

            {/* Body Content with Padding */}
            <div className={headerStyles.bodyContent}>
                {/* Map Container */}
                <div
                    style={{
                        width: '100%',
                        height: `${MAP_HEIGHT}px`,
                        marginBottom: '12px',
                        border: `1px solid ${palette.neutralQuaternaryAlt}`,
                        borderRadius: '8px',
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
                    {/* Legacy address message for invalid coordinates */}
                    {mapLoaded && placeDetails && GooglePlacesUtils.getLatitude(placeDetails) === 0 && GooglePlacesUtils.getLongitude(placeDetails) === 0 && (
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
                                zIndex: 1,
                                padding: '16px',
                                boxSizing: 'border-box'
                            }}
                        >
                            <Text variant="small" style={{ textAlign: 'center', color: '#A80000', fontSize: '12px', lineHeight: '16px' }}>
                                <Icon iconName="Warning" style={{ marginRight: '4px', color: '#A80000' }} />
                                Sorry, we can't determine the address location. This may be because it's in a legacy format. Please try adding the address again.
                            </Text>
                        </div>
                    )}
                </div>

                {/* Place Details */}
                <Stack horizontalAlign="start" tokens={{ childrenGap: 8 }} style={{ flex: 1, width: '100%' }}>
                <Text variant="small" style={{ fontWeight: 500 }}>
                    <Icon iconName="MapPin" style={{ marginRight: '4px', color: '#0078d4' }} />
                    {GooglePlacesUtils.getFormattedAddress(placeDetails)}
                </Text>

                {/* Address Components */}
                {renderAddressComponents()}

                {/* Coordinates */}
                {showCoordinates && (
                    <Text variant="xSmall" style={{ color: '#605E5C' }}>
                        <strong>Coordinates:</strong> {GooglePlacesUtils.getLatitude(placeDetails).toFixed(6)}, {GooglePlacesUtils.getLongitude(placeDetails).toFixed(6)}
                    </Text>
                )}

                {/* Rating */}
                {showRatings && placeDetails.rating && (
                    <Text variant="small">
                        <Icon iconName="FavoriteStarFill" style={{ marginRight: '4px', color: '#FFB900' }} />
                        <strong>Rating:</strong> {placeDetails.rating}/5
                        {placeDetails.userRatingsTotal && ` (${placeDetails.userRatingsTotal} reviews)`}
                    </Text>
                )}
            </Stack>

            {/* Footer Section - External Links and Expand */}
            <div style={{
                borderTop: '1px solid #e1e1e1',
                paddingTop: '12px',
                marginTop: '12px',
                width: '100%',
                boxSizing: 'border-box'
            }}>
                <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="space-between">
                    {placeDetails.url && (
                        <DefaultButton
                            text="View on Maps"
                            iconProps={{ iconName: 'NavigateExternalInline' }}
                            onClick={() => window.open(placeDetails.url, '_blank')}
                            styles={{
                                root: {
                                    backgroundColor: 'transparent',
                                    border: '1px solid #0078d4',
                                    color: '#0078d4',
                                    minWidth: '120px',
                                    height: '28px',
                                    borderRadius: '14px'
                                },
                                rootHovered: {
                                    backgroundColor: '#f3f2f1',
                                    border: '1px solid #0078d4',
                                    color: '#0078d4',
                                    borderRadius: '14px'
                                },
                                rootPressed: {
                                    backgroundColor: '#edebe9',
                                    border: '1px solid #0078d4',
                                    color: '#0078d4',
                                    borderRadius: '14px'
                                },
                                label: {
                                    fontSize: '12px',
                                    fontWeight: 400
                                },
                                icon: {
                                    fontSize: '12px'
                                }
                            }}
                        />
                    )}

                    <DefaultButton
                        text="Show Details"
                        iconProps={{ iconName: 'FullScreen' }}
                        onClick={() => setIsDialogOpen(true)}
                        styles={{
                            root: {
                                backgroundColor: 'transparent',
                                border: '1px solid #0078d4',
                                color: '#0078d4',
                                minWidth: '120px',
                                height: '28px',
                                borderRadius: '14px'
                            },
                            rootHovered: {
                                backgroundColor: '#f3f2f1',
                                border: '1px solid #0078d4',
                                color: '#0078d4',
                                borderRadius: '14px'
                            },
                            rootPressed: {
                                backgroundColor: '#edebe9',
                                border: '1px solid #0078d4',
                                color: '#0078d4',
                                borderRadius: '14px'
                            },
                            label: {
                                fontSize: '12px',
                                fontWeight: 400
                            },
                            icon: {
                                fontSize: '12px'
                            }
                        }}
                    />
                </Stack>
            </div>
            </div> {/* Close Body Content */}

            {/* Place Details Dialog */}
            {placeDetails && (
                <PlaceDetailsDialog
                    placeDetails={placeDetails}
                    isOpen={isDialogOpen}
                    onDismiss={() => setIsDialogOpen(false)}
                    onSelect={onSelect}
                />
            )}
        </Stack>
    );
};
