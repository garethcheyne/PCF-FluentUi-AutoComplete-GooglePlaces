import * as React from 'react';
import { Callout, DirectionalHint } from '@fluentui/react/lib/Callout';
import { IconButton } from '@fluentui/react/lib/Button';
import { Stack, IStackTokens } from '@fluentui/react/lib/Stack';
import { Label } from '@fluentui/react/lib/Label';
import { Toggle } from '@fluentui/react/lib/Toggle';
import { Dropdown, IDropdownOption } from '@fluentui/react/lib/Dropdown';
import { Text } from '@fluentui/react/lib/Text';
import { getTheme, mergeStyleSets } from '@fluentui/react/lib/Styling';

const theme = getTheme();
const { palette, fonts } = theme;

const stackTokens: IStackTokens = {
    childrenGap: 12,
    padding: 16
};

const styles = mergeStyleSets({
    callout: {
        backgroundColor: palette.white,
        borderRadius: '8px',
        border: `1px solid ${palette.neutralQuaternaryAlt}`,
        boxShadow: theme.effects.elevation8,
        minWidth: 280,
        maxWidth: 320,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: `1px solid ${palette.neutralQuaternaryAlt}`,
        padding: '12px 16px',
        backgroundColor: palette.neutralLighterAlt,
        borderRadius: '8px 8px 0 0',
    },
    title: {
        fontSize: fonts.medium.fontSize,
        fontWeight: '600',
        color: palette.neutralPrimary,
        margin: 0,
    },
    closeButton: {
        color: palette.neutralSecondary,
        selectors: {
            '&:hover': {
                backgroundColor: palette.neutralQuaternary,
                color: palette.neutralPrimary,
            }
        }
    },
    content: {
        padding: '16px',
    },
    sectionLabel: {
        fontSize: fonts.small.fontSize,
        fontWeight: '600',
        color: palette.neutralPrimary,
        marginBottom: 8,
    },
    description: {
        fontSize: fonts.xSmall.fontSize,
        color: palette.neutralSecondary,
        marginBottom: 8,
    }
});

interface SettingsCalloutProps {
    target: HTMLElement | null;
    isVisible: boolean;
    onDismiss: () => void;
    countryRestriction?: string;
    countryRestrictionEnabled: boolean;
    onCountryRestrictionChange: (enabled: boolean) => void;
    searchTypes?: string[];
    onSearchTypesChange?: (types: string[]) => void;
}

export const SettingsCallout: React.FC<SettingsCalloutProps> = ({
    target,
    isVisible,
    onDismiss,
    countryRestriction,
    countryRestrictionEnabled,
    onCountryRestrictionChange,
    searchTypes = [],
    onSearchTypesChange
}) => {
    // Define search type options
    const searchTypeOptions: IDropdownOption[] = [
        { key: 'address', text: 'Addresses', data: { description: 'Street addresses and building numbers' } },
        { key: 'establishment', text: 'Establishments', data: { description: 'Businesses and points of interest' } },
        { key: 'geocode', text: 'Geocoding', data: { description: 'Geographic locations and areas' } },
        { key: 'cities', text: 'Cities', data: { description: 'Cities and administrative areas' } },
        { key: 'regions', text: 'Regions', data: { description: 'States, provinces, and regions' } }
    ];

    const handleSearchTypeChange = (event: React.FormEvent<HTMLDivElement>, item?: IDropdownOption) => {
        if (item && onSearchTypesChange) {
            const selectedTypes = item.selected
                ? [...searchTypes, item.key as string]
                : searchTypes.filter(type => type !== item.key);
            onSearchTypesChange(selectedTypes);
        }
    };

    if (!isVisible || !target) {
        return null;
    }

    return (
        <Callout
            styles={{
                calloutMain: {
                    backgroundColor: palette.white,
                    borderRadius: '8px',
                    border: `1px solid ${palette.neutralQuaternaryAlt}`,
                    boxShadow: theme.effects.elevation8,
                    minWidth: 280,
                    maxWidth: 320,
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
            target={target}
            onDismiss={onDismiss}
            directionalHint={DirectionalHint.topCenter}
            isBeakVisible={true}
            gapSpace={8}
            beakWidth={16}
            preventDismissOnEvent={(ev: Event | React.FocusEvent | React.KeyboardEvent | React.MouseEvent) => {
                // Prevent dismissal when clicking inside the callout
                const targetElement = ev.target as HTMLElement;
                return target?.contains(targetElement) || false;
            }}
        >
            <div className={styles.header}>
                <Text className={styles.title}>Search Settings</Text>
                <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    className={styles.closeButton}
                    onClick={onDismiss}
                    ariaLabel="Close settings"
                />
            </div>

            <div className={styles.content}>
                <Stack tokens={stackTokens}>
                    {/* Country Restriction Section */}
                    {countryRestriction && countryRestriction.trim() && (
                        <Stack tokens={{ childrenGap: 8 }}>
                            <Label className={styles.sectionLabel}>Geographic Restrictions</Label>
                            <Text className={styles.description}>
                                Limit search results to specific countries or search worldwide.
                            </Text>
                            <Toggle
                                checked={countryRestrictionEnabled}
                                onChange={(event, checked) => onCountryRestrictionChange(!!checked)}
                                inlineLabel
                                onText={`Restrict to ${countryRestriction.toUpperCase()}`}
                                offText="Search Worldwide"
                                styles={{
                                    root: { marginBottom: 0 },
                                    label: { fontSize: fonts.small.fontSize },
                                    text: { fontSize: fonts.small.fontSize }
                                }}
                            />
                        </Stack>
                    )}

                    {/* Search Types Section */}
                    <Stack tokens={{ childrenGap: 8 }}>
                        <Label className={styles.sectionLabel}>Search Types</Label>
                        <Text className={styles.description}>
                            Select what types of places to include in search results.
                        </Text>
                        <Dropdown
                            placeholder="Select search types..."
                            options={searchTypeOptions}
                            multiSelect
                            selectedKeys={searchTypes}
                            onChange={handleSearchTypeChange}
                            styles={{
                                dropdown: { fontSize: fonts.small.fontSize },
                                title: { fontSize: fonts.small.fontSize },
                                dropdownItem: { fontSize: fonts.small.fontSize }
                            }}
                        />
                        {searchTypes.length === 0 && (
                            <Text style={{
                                fontSize: fonts.xSmall.fontSize,
                                color: palette.neutralSecondary,
                                fontStyle: 'italic'
                            }}>
                                Default: All types included
                            </Text>
                        )}
                    </Stack>

                    {/* Additional Settings Section */}
                    <Stack tokens={{ childrenGap: 8 }}>
                        <Label className={styles.sectionLabel}>Search Behavior</Label>
                        <Text className={styles.description}>
                            Configure how the search component behaves.
                        </Text>
                        <Toggle
                            label="Auto-select single result"
                            inlineLabel
                            defaultChecked={false}
                            disabled={true}
                            styles={{
                                root: { marginBottom: 0 },
                                label: { fontSize: fonts.small.fontSize, color: palette.neutralSecondary },
                                text: { fontSize: fonts.small.fontSize }
                            }}
                        />
                        <Text style={{
                            fontSize: fonts.xSmall.fontSize,
                            color: palette.neutralSecondary,
                            fontStyle: 'italic'
                        }}>
                            Coming soon...
                        </Text>
                    </Stack>
                </Stack>
            </div>
        </Callout>
    );
};
