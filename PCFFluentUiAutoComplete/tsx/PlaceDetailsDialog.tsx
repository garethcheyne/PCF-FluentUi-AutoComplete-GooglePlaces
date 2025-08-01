import * as React from 'react';
import { PlaceResult, GooglePlacesUtils } from '../types';
import { Stack, IStackTokens } from '@fluentui/react/lib/Stack';
import { Text } from '@fluentui/react/lib/Text';
import { Icon } from '@fluentui/react/lib/Icon';
import { Dialog, DialogType, DialogFooter } from '@fluentui/react/lib/Dialog';
import { PrimaryButton, DefaultButton } from '@fluentui/react/lib/Button';
import { Pivot, PivotItem } from '@fluentui/react/lib/Pivot';

/// <reference types="google.maps" />

// Dialog dimensions
const DIALOG_MAP_HEIGHT = 500; // Larger map for dialog
const DIALOG_MAP_WIDTH = 800; // Width for dialog map
const STREETVIEW_HEIGHT = 400; // Height for Street View

interface IPlaceDetailsDialogProps {
    placeDetails: PlaceResult;
    isOpen: boolean;
    onDismiss: () => void;
    onSelect?: (placeDetails: PlaceResult) => void;
}

export const PlaceDetailsDialog: React.FC<IPlaceDetailsDialogProps> = ({
    placeDetails,
    isOpen,
    onDismiss,
    onSelect
}) => {
    const [streetViewLoaded, setStreetViewLoaded] = React.useState(false);
    const [selectedTab, setSelectedTab] = React.useState<string>('map');
    const dialogMapRef = React.useRef<HTMLDivElement>(null);
    const streetViewRef = React.useRef<HTMLDivElement>(null);
    const dialogMapInstanceRef = React.useRef<google.maps.Map | null>(null);
    const streetViewInstanceRef = React.useRef<google.maps.StreetViewPanorama | null>(null);

    // Initialize dialog map and street view based on selected tab
    const initDialogMap = React.useCallback(async () => {
        if (!placeDetails || !isOpen) {
            return;
        }

        const lat = GooglePlacesUtils.getLatitude(placeDetails);
        const lng = GooglePlacesUtils.getLongitude(placeDetails);

        if (lat === 0 && lng === 0) {
            return;
        }

        if (!window.google?.maps) {
            return;
        }

        try {
            if (selectedTab === 'map') {
                // Wait for ref to become available with retry mechanism
                let retryCount = 0;
                const maxRetries = 20;

                while (!dialogMapRef.current && retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retryCount++;
                }

                if (dialogMapRef.current && !dialogMapInstanceRef.current) {
                    // Initialize main map
                    const mapOptions: google.maps.MapOptions = {
                        center: { lat, lng },
                        zoom: 16,
                        mapTypeId: google.maps.MapTypeId.ROADMAP,
                        disableDefaultUI: false,
                        zoomControl: true,
                        scrollwheel: true,
                        draggable: true,
                        streetViewControl: true,
                        mapTypeControl: true,
                        fullscreenControl: true
                    };

                    const dialogMap = new google.maps.Map(dialogMapRef.current, mapOptions);
                    dialogMapInstanceRef.current = dialogMap;

                    // Add marker
                    const marker = new google.maps.Marker({
                        position: { lat, lng },
                        map: dialogMap,
                        title: placeDetails.name || placeDetails.formattedAddress,
                        animation: google.maps.Animation.DROP
                    });
                }
            }

            if (selectedTab === 'streetview') {
                // Wait for ref to become available with retry mechanism
                let retryCount = 0;
                const maxRetries = 20;

                while (!streetViewRef.current && retryCount < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    retryCount++;
                }

                if (streetViewRef.current && !streetViewInstanceRef.current) {
                    // Initialize Street View
                    const streetViewOptions: google.maps.StreetViewPanoramaOptions = {
                        position: { lat, lng },
                        pov: { heading: 0, pitch: 0 },
                        zoom: 1,
                        visible: true
                    };

                    const streetView = new google.maps.StreetViewPanorama(streetViewRef.current, streetViewOptions);
                    streetViewInstanceRef.current = streetView;

                    // Check if Street View is available at this location
                    const streetViewService = new google.maps.StreetViewService();
                    streetViewService.getPanorama({
                        location: { lat, lng },
                        radius: 50
                    }, (data, status) => {
                        if (status === google.maps.StreetViewStatus.OK) {
                            setStreetViewLoaded(true);
                        } else {
                            setStreetViewLoaded(false);
                        }
                    });
                }
            }

        } catch (error) {
            // Error handled silently
        }
    }, [placeDetails, isOpen, selectedTab]);

    // Initialize dialog map when dialog opens or tab changes
    React.useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => {
                initDialogMap();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isOpen, selectedTab, initDialogMap]);

    // Also initialize when the dialog becomes visible and refs are available
    React.useEffect(() => {
        if (isOpen && selectedTab === 'map' && dialogMapRef.current && !dialogMapInstanceRef.current) {
            setTimeout(() => initDialogMap(), 50);
        }
        if (isOpen && selectedTab === 'streetview' && streetViewRef.current && !streetViewInstanceRef.current) {
            setTimeout(() => initDialogMap(), 50);
        }
    }, [isOpen, selectedTab, dialogMapRef.current, streetViewRef.current, initDialogMap]);

    const handleDismiss = React.useCallback(() => {
        // Clean up dialog maps when closing
        if (dialogMapInstanceRef.current) {
            google.maps.event.clearInstanceListeners(dialogMapInstanceRef.current);
            dialogMapInstanceRef.current = null;
        }
        if (streetViewInstanceRef.current) {
            google.maps.event.clearInstanceListeners(streetViewInstanceRef.current);
            streetViewInstanceRef.current = null;
        }
        setStreetViewLoaded(false);
        onDismiss();
    }, [onDismiss]);

    const handleSelect = React.useCallback(() => {
        if (onSelect && placeDetails) {
            onSelect(placeDetails);
        }
        handleDismiss(); // Close dialog after selection
    }, [onSelect, placeDetails, handleDismiss]);

    const handleTabChange = (item: any) => {
        if (item) {
            const newTab = item.props.itemKey || 'map';
            setSelectedTab(newTab);
            // Clean up previous tab's instances when switching
            if (newTab === 'streetview' && dialogMapInstanceRef.current) {
                google.maps.event.clearInstanceListeners(dialogMapInstanceRef.current);
                dialogMapInstanceRef.current = null;
            } else if (newTab === 'map' && streetViewInstanceRef.current) {
                google.maps.event.clearInstanceListeners(streetViewInstanceRef.current);
                streetViewInstanceRef.current = null;
                setStreetViewLoaded(false);
            }
        }
    };

    const dialogContentProps = {
        type: DialogType.normal,
        title: placeDetails.name || 'Place Details',
        subText: GooglePlacesUtils.getFormattedAddress(placeDetails)
    };

    const modalProps = React.useMemo(() => ({
        isBlocking: true
    }), []);

    return (
        <Dialog
            minWidth={DIALOG_MAP_WIDTH}
            hidden={!isOpen}
            onDismiss={handleDismiss}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
            <div style={{ height: '600px', overflow: 'auto', padding: '0 4px' }}>
                <Pivot
                    selectedKey={selectedTab}
                    onLinkClick={handleTabChange}
                    headersOnly={false}
                    styles={{ root: { marginBottom: '16px' } }}
                >
                    <PivotItem headerText="Map View" itemKey="map" itemIcon="MapPin">
                        <div style={{ padding: '8px 0' }}>
                            <div
                                ref={dialogMapRef}
                                style={{
                                    width: '100%',
                                    height: `${DIALOG_MAP_HEIGHT}px`,
                                    border: '1px solid #e1e1e1',
                                    borderRadius: '4px',
                                    marginBottom: '16px',
                                    backgroundColor: '#f8f8f8'
                                }}
                            />
                        </div>
                    </PivotItem>

                    <PivotItem headerText="Street View" itemKey="streetview" itemIcon="Camera">
                        <div style={{ padding: '8px 0' }}>
                            <div
                                ref={streetViewRef}
                                style={{
                                    width: '100%',
                                    height: `${STREETVIEW_HEIGHT}px`,
                                    border: '1px solid #e1e1e1',
                                    borderRadius: '4px',
                                    marginBottom: '16px',
                                    backgroundColor: '#f8f8f8'
                                }}
                            />
                            {!streetViewLoaded && selectedTab === 'streetview' && (
                                <Text variant="small" style={{ color: '#666', fontStyle: 'italic', textAlign: 'center', display: 'block' }}>
                                    {!streetViewInstanceRef.current ? 'Loading Street View...' : 'Street View may not be available for this location'}
                                </Text>
                            )}
                        </div>
                    </PivotItem>

                    <PivotItem headerText="Details" itemKey="details" itemIcon="Info">
                        <div style={{ padding: '8px 0' }}>
                            <Stack tokens={{ childrenGap: 12 }}>
                                {/* Basic Location Information */}
                                <Stack tokens={{ childrenGap: 8 }}>
                                    <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#323130' }}>
                                        Location Information
                                    </Text>

                                    <Text variant="small">
                                        <Icon iconName="MapPin" style={{ marginRight: '8px', color: '#0078d4' }} />
                                        <strong>Address:</strong> {GooglePlacesUtils.getFormattedAddress(placeDetails)}
                                    </Text>

                                    <Text variant="small">
                                        <Icon iconName="World" style={{ marginRight: '8px', color: '#0078d4' }} />
                                        <strong>Coordinates:</strong> {GooglePlacesUtils.getLatitude(placeDetails).toFixed(6)}, {GooglePlacesUtils.getLongitude(placeDetails).toFixed(6)}
                                    </Text>

                                    {placeDetails.placeId && (
                                        <Text variant="small">
                                            <Icon iconName="Code" style={{ marginRight: '8px', color: '#0078d4' }} />
                                            <strong>Google Place ID:</strong> {placeDetails.placeId}
                                        </Text>
                                    )}

                                    {placeDetails.vicinity && (
                                        <Text variant="small">
                                            <Icon iconName="MapLayers" style={{ marginRight: '8px', color: '#0078d4' }} />
                                            <strong>Area:</strong> {placeDetails.vicinity}
                                        </Text>
                                    )}
                                </Stack>

                                {/* Place Types */}
                                {placeDetails.types && placeDetails.types.length > 0 && (
                                    <Stack tokens={{ childrenGap: 6 }}>
                                        <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#323130' }}>
                                            <Icon iconName="Tag" style={{ marginRight: '8px', color: '#0078d4' }} />
                                            Place Types
                                        </Text>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                            {placeDetails.types.slice(0, 8).map((type, index) => (
                                                <Text key={index} variant="xSmall" style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#f3f2f1',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    color: '#323130',
                                                    border: '1px solid #e1dfdd'
                                                }}>
                                                    {type.replace(/_/g, ' ').toLowerCase()}
                                                </Text>
                                            ))}
                                            {placeDetails.types.length > 8 && (
                                                <Text variant="xSmall" style={{
                                                    padding: '4px 8px',
                                                    color: '#605e5c',
                                                    fontStyle: 'italic'
                                                }}>
                                                    +{placeDetails.types.length - 8} more
                                                </Text>
                                            )}
                                        </div>
                                    </Stack>
                                )}

                                {/* Rating and Business Info */}
                                {(placeDetails.rating || placeDetails.businessStatus) && (
                                    <Stack tokens={{ childrenGap: 6 }}>
                                        <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#323130' }}>
                                            Business Information
                                        </Text>

                                        {placeDetails.rating && (
                                            <Text variant="small">
                                                <Icon iconName="FavoriteStarFill" style={{ marginRight: '8px', color: '#FFB900' }} />
                                                <strong>Rating:</strong> {placeDetails.rating.toFixed(1)}/5
                                                {placeDetails.userRatingsTotal && (
                                                    <span style={{ color: '#605e5c', marginLeft: '4px' }}>
                                                        ({placeDetails.userRatingsTotal.toLocaleString()} reviews)
                                                    </span>
                                                )}
                                            </Text>
                                        )}

                                        {placeDetails.businessStatus && (
                                            <Text variant="small">
                                                <Icon iconName="BusinessHoursSign" style={{ marginRight: '8px', color: '#0078d4' }} />
                                                <strong>Status:</strong> {placeDetails.businessStatus.replace(/_/g, ' ').toLowerCase()}
                                            </Text>
                                        )}
                                    </Stack>
                                )}

                                {/* Plus Codes */}
                                {placeDetails.plusCode && (placeDetails.plusCode.globalCode || placeDetails.plusCode.compoundCode) && (
                                    <Stack tokens={{ childrenGap: 6 }}>
                                        <Text variant="mediumPlus" style={{ fontWeight: 600, color: '#323130' }}>
                                            <Icon iconName="Code" style={{ marginRight: '8px', color: '#0078d4' }} />
                                            Plus Codes
                                        </Text>
                                        {placeDetails.plusCode.globalCode && (
                                            <Text variant="small">
                                                <strong>Global:</strong> {placeDetails.plusCode.globalCode}
                                            </Text>
                                        )}
                                        {placeDetails.plusCode.compoundCode && (
                                            <Text variant="small">
                                                <strong>Compound:</strong> {placeDetails.plusCode.compoundCode}
                                            </Text>
                                        )}
                                    </Stack>
                                )}
                            </Stack>
                        </div>
                    </PivotItem>
                </Pivot>
            </div>

            <DialogFooter>
                <PrimaryButton onClick={handleSelect} text="Select" iconProps={{ iconName: 'CheckMark' }} />
                <DefaultButton onClick={handleDismiss} text="Close" />
                {placeDetails.url && (
                    <DefaultButton
                        onClick={() => window.open(placeDetails.url, '_blank')}
                        text="Open in Google Maps"
                        iconProps={{ iconName: 'NavigateExternalInline' }}
                    />
                )}
            </DialogFooter>
        </Dialog>
    );
};
