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
        borderRadius: '16px',
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
}

export const PlaceDetailsCallout: React.FC<PlaceDetailsCalloutProps> = ({
    hoveredItem,
    calloutTarget,
    apiToken,
    onDismiss,
    onSelect,
    onMouseEnter,
    onMouseLeave
}) => {
    if (!hoveredItem || !calloutTarget) {
        return null;
    }

    return (
        <Callout
            styles={{
                calloutMain: {
                    backgroundColor: palette.white,
                    borderRadius: '16px',
                    border: `1px solid ${palette.neutralQuaternaryAlt}`,
                    boxShadow: theme.effects.elevation8
                },
                root: {
                    zIndex: 1000000,
                    borderRadius: '16px'
                },
                beakCurtain: {
                    borderRadius: '16px'
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
                onSelect={onSelect}
                onClose={onDismiss}
            />
        </Callout>
    );
};
