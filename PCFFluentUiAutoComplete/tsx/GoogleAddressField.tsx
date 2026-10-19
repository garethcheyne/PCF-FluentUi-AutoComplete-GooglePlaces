import * as React from 'react';
import { FluentProvider, PortalMountNodeProvider, Switch, Theme, makeStyles, tokens } from '@fluentui/react-components';
import { LocationRegular } from '@fluentui/react-icons';
import { AddressLookup } from 'fluentui-extended/address-lookup';
import type { PlaceAddress } from 'fluentui-extended/address-lookup';

export interface GoogleAddressFieldProps {
    apiKey: string;
    /** The record's stored address, or null when it holds none */
    address: PlaceAddress | null;
    /** Comma-separated ISO country codes to restrict to, e.g. "nz" or "nz,au". Empty searches worldwide. */
    countryRestriction: string;
    stateShortName: boolean;
    countryShortName: boolean;
    readOnly: boolean;
    theme: Theme;
    onChange: (address: PlaceAddress | null) => void;
}

// The field is bound to the street column; suburb, city and the rest have their own fields
const streetOnly = (address: PlaceAddress): string => address.street;

const useStyles = makeStyles({
    provider: {
        // The provider paints a background by default; the form behind should show through
        backgroundColor: 'transparent',
        width: '100%',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        columnGap: tokens.spacingHorizontalS,
        width: '100%',
    },
    title: {
        display: 'inline-flex',
        alignItems: 'center',
        columnGap: tokens.spacingHorizontalXS,
    },
});

/** The address search, with a switch to drop the country restriction for a one-off overseas address. */
const AddressField: React.FC<Omit<GoogleAddressFieldProps, 'theme'>> = ({
    apiKey,
    address,
    countryRestriction,
    stateShortName,
    countryShortName,
    readOnly,
    onChange,
}) => {
    const styles = useStyles();
    const restriction = countryRestriction.trim();
    const [restricted, setRestricted] = React.useState(restriction !== '');

    // Follow the configured restriction if it arrives or changes after the first render
    React.useEffect(() => setRestricted(restriction !== ''), [restriction]);

    // No restriction means nothing to switch, so no header at all
    const header = restriction ? (
        <span className={styles.header}>
            <span className={styles.title}>
                <LocationRegular /> Address search
            </span>
            <Switch
                label={restricted ? `Only ${restriction.toUpperCase()}` : 'Worldwide'}
                labelPosition="before"
                checked={restricted}
                onChange={(_, data) => setRestricted(data.checked)}
            />
        </span>
    ) : null;

    return (
        <AddressLookup
            apiKey={apiKey}
            value={address}
            formatValue={streetOnly}
            onSelect={onChange}
            countries={restricted ? restriction : undefined}
            stateShortName={stateShortName}
            countryShortName={countryShortName}
            readOnly={readOnly}
            allowFreeText
            // "Level 5/135 Coronation Dr" belongs on the street line the field is bound to
            unitPlacement="street"
            placeholder="Search for an address..."
            header={header}
        />
    );
};

/**
 * A body-level parent for this control's portals, with the theme's tokens set on
 * it as CSS variables.
 *
 * Fluent renders the dropdown and the map card in portals on document.body and
 * relies on a theme class to give them their tokens. On a Dynamics form that
 * class arrives empty, so a portal renders with no background, border, radius or
 * spacing. Tokens set inline here are inherited by every portal created under it,
 * whatever the theme class does.
 */
const useThemedPortalNode = (theme: Theme): HTMLElement | undefined => {
    const [node, setNode] = React.useState<HTMLElement>();

    React.useEffect(() => {
        const element = document.createElement('div');
        element.setAttribute('data-portal-host', 'google-address');
        document.body.appendChild(element);
        setNode(element);
        return () => element.remove();
    }, []);

    React.useEffect(() => {
        if (!node) return;
        Object.entries(theme).forEach(([token, value]) => node.style.setProperty(`--${token}`, String(value)));
    }, [node, theme]);

    return node;
};

export const GoogleAddressField: React.FC<GoogleAddressFieldProps> = ({ theme, ...props }) => {
    const styles = useStyles();
    const portalNode = useThemedPortalNode(theme);

    return (
        <FluentProvider theme={theme} className={styles.provider}>
            <PortalMountNodeProvider value={portalNode}>
                <AddressField {...props} />
            </PortalMountNodeProvider>
        </FluentProvider>
    );
};
