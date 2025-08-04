import * as React from 'react';
import { Callout, DirectionalHint } from '@fluentui/react/lib/Callout';
import { getTheme, mergeStyleSets } from '@fluentui/react/lib/Styling';
import { HoverCard } from './HoverCard';
import { AddressItem, PlaceResult } from '../types/EntityDetailTypes';

const theme = getTheme();
const { palette } = theme;

const styles = mergeStyleSets({
    callout: {
        backgroundColor: palette.neutralTertiary,
        borderRadius: '8px',
        padding: '0px',
    }
});

interface PlaceDetailsCalloutProps {
    hoveredItem: AddressItem | null;
    calloutTarget: HTMLElement | null;
    apiToken: string;
    onDismiss: () => void;
    onSelect: (placeDetails: PlaceResult) => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    // Additional lookup data for when placeId is not available
    initialAddressData?: {
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        fullAddress?: string;
        latitude?: number;
        longitude?: number;
    };
}

export const PlaceDetailsCallout: React.FC<PlaceDetailsCalloutProps> = ({
    hoveredItem,
    calloutTarget,
    apiToken,
    onDismiss,
    onSelect,
    onMouseEnter,
    onMouseLeave,
    initialAddressData
}) => {
    if (!hoveredItem || !calloutTarget) {
        return null;
    }

    return (
        <Callout
            styles={{
                calloutMain: {
                    backgroundColor: 'transparent', // Let HoverCard handle background
                    borderRadius: '8px',
                    border: 'none', // Remove border - let HoverCard handle it
                    boxShadow: 'none' // Remove shadow - let HoverCard handle it
                },
                root: {
                    zIndex: 1000000,
                    borderRadius: '8px'
                },
                beakCurtain: {
                    borderRadius: '8px'
                },
                beak: {
                    backgroundColor: palette.white,
                    borderColor: palette.neutralQuaternaryAlt,
                }
            }}
            target={calloutTarget}
            onDismiss={onDismiss}
            className={styles.callout}
            directionalHint={DirectionalHint.rightCenter}
            isBeakVisible={true}
            gapSpace={10}
            calloutMaxHeight={500}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <HoverCard
                placeId={hoveredItem.placeId}
                apiKey={apiToken}
                addressComponents={initialAddressData ? {
                    street: initialAddressData.street,
                    city: initialAddressData.city,
                    state: initialAddressData.state,
                    country: initialAddressData.country,
                    fullAddress: initialAddressData.fullAddress
                } : undefined}
                coordinates={initialAddressData && initialAddressData.latitude && initialAddressData.longitude ? {
                    latitude: initialAddressData.latitude,
                    longitude: initialAddressData.longitude
                } : undefined}
                onSelect={onSelect}
                onClose={onDismiss}
            />
        </Callout>
    );
};
