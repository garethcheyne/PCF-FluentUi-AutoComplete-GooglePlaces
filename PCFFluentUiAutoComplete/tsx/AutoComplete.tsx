import * as React from 'react'
import { useDebounce } from 'usehooks-ts'
import { IInputs } from '../generated/ManifestTypes'
import { GooglePlacesAutocompleteResponse, PlacePrediction, AddressItem, GooglePlacesUtils, ParsedAddress } from '../types'
import { fetchAddressSuggestions, fetchPlaceDetails } from './Queries'
import { EntityHoverCard } from './EntityHoverCard'
import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { FocusZone, FocusZoneDirection } from '@fluentui/react/lib/FocusZone'
import { TooltipHost, ITooltipHostStyles } from '@fluentui/react/lib/Tooltip'
import { IIconProps } from '@fluentui/react/lib/Icon'
import { mergeStyleSets, getTheme, getFocusStyle, ITheme } from '@fluentui/react/lib/Styling'
import { ActionButton } from '@fluentui/react/lib/Button'
import { ThemeProvider, SearchBox, Stack, IStackTokens, Icon, FontWeights, DirectionalHint, TooltipDelay, Label, Toggle } from '@fluentui/react'
import { initializeIcons } from '@fluentui/react/lib/Icons'
import { Spinner, SpinnerSize } from '@fluentui/react/lib/Spinner'

// Initialize icons
initializeIcons()

// Constants
const DEBOUNCE_DELAY = 500;
const MIN_SEARCH_LENGTH = 3;
const MAX_DROPDOWN_HEIGHT = 420;

const stackTokens: Partial<IStackTokens> = { childrenGap: 0 }

// Icons
const searchIcon: IIconProps = {
    iconName: 'MapPin',
    styles: {
        root: { color: '#656565' }
    }
};

const dropBtnOne: IIconProps = {
    iconName: 'Globe',
    styles: {
        root: { color: '#656565' }
    }
};

const dropBtnTwo: IIconProps = {
    iconName: 'LocationDot',
    styles: {
        root: { color: '#656565' }
    }
};

const theme: ITheme = getTheme();
const { palette, semanticColors, fonts } = theme;

const style = mergeStyleSets({
    stackContainer: {
        position: 'relative'
    },
    focusZoneContainer: {
        position: 'absolute',
        marginTop: '36px !important',
        border: `1px solid ${semanticColors.bodyDivider}`,
        boxShadow: '2px 2px 8px rgb(245 ,245, 245);',
        borderRadius: '4px',
        flexGrow: 1,
        zIndex: 999,
    },
    focusZoneContent: {
        overflow: 'hidden',
        backgroundColor: '#fff',
        overflowY: 'scroll',
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
        maxHeight: MAX_DROPDOWN_HEIGHT,
        padding: '2px',
        selectors: {
            '&::-webkit-scrollbar': {
                width: '6px',
                height: '20px',
            },
            '&::-webkit-scrollbar-track': {
                background: 'rgba(0,0,0,0)',
            },
            '&::-webkit-scrollbar-thumb': {
                borderRadius: '6px',
                background: 'rgb(245 ,245, 245)',
            },
            '&::-webkit-scrollbar-thumb:hover': {
                width: '8px',
                height: '26px',
                background: 'rgb(245 ,245, 245)',
            }
        }
    },
    focusZoneHeader: {
        backgroundColor: '#FFF',
        display: 'flex',
        height: '32px',
        padding: '2px 2px',
    },
    focusZoneHeaderContent: {
        fontSize: '14px',
        textAlign: 'left',
        padding: '6px 8px',
        top: '50%',
        width: '100%',
        backgroundColor: '#fafaFA',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
    },
    focusZoneFooter: {
        backgroundColor: '#FFF',
        borderTop: `1px solid ${palette.neutralTertiary}`,
        position: 'sticky',
        display: 'flex',
        bottom: '0px',
        padding: '8px 10px',
    },
    focusZoneFooterLeft: {
        width: '50%',
        textAlign: 'left',
        paddingLeft: '4px' // Reduced padding to move "Powered by Google" further left
    },
    focusZoneFooterRight: {
        width: '50%',
        textAlign: 'right',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center'
    },
    focusZoneBtn: {
        fontSize: fonts.small.fontSize,
        borderRadius: '4px',
        padding: '8px 10px',
        color: palette.neutralDark,
        height: 24,
        selectors: {
            '&:hover': {
                backgroundColor: 'rgb(245 ,245, 245)',
                color: palette.neutralDark
            },
        },
    },
    searchBox: {
        backgroundColor: 'rgb(245 ,245, 245)',
        border: 'none',
        borderRadius: '4px',
        padding: '4px',
        transform: 'scaleX(1)',
        selectors: {
            '&::after': {
                border: 'none',
                clipPath: 'inset(calc(100% - 2px) 0px 0px)',
                borderBottom: '2px solid rgb(15, 108, 189)',
                transform: 'scaleX(1)',
                transitionDelay: '2000ms',
                transitionDuration: '2000ms',
                borderRadius: '4px',
            },
        },
    },
    focusZoneWebIcon: {
        display: 'block',
        cursor: 'pointer',
        alignSelf: 'center',
        color: palette.neutralTertiary,
        fontSize: fonts.small.fontSize,
        flexShrink: 0,
        margin: '8px'
    },
    callout: {
        width: 480,
        maxWidth: '95%',
        padding: '20px 24px',
    },
    title: {
        marginBottom: 12,
        fontWeight: FontWeights.semilight,
    },
    link: {
        display: 'block',
        marginTop: 20,
    },
    itemContainer: [
        getFocusStyle(theme, { inset: -1 }),
        {
            minHeight: 32,
            padding: 4,
            boxSizing: 'border-box',
            borderRadius: '4px',
            display: 'flex',
            selectors: {
                '&:hover': {
                    backgroundColor: palette.neutralLighter,
                    color: palette.neutralDark
                },
            },
        },
    ],
    itemContent: {
        flexGrow: 1,
        overflow: 'hidden',
        textAlign: 'left',
    },
    itemHeader: {
        fontSize: fonts.medium.fontSize,
        fontWeight: FontWeights.semibold,
        color: palette.neutralPrimary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left',
    },
    itemDetail: {
        fontSize: fonts.small.fontSize,
        color: palette.neutralSecondary,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        textAlign: 'left',
    },
    itemSection: {
        fontSize: fonts.small.fontSize,
        fontWeight: FontWeights.semibold,
        color: palette.neutralPrimary,
        margin: '4px 0 2px 0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    itemImage: {
        padding: 1,
        alignSelf: 'center',
        flexShrink: 0,
    },
    itemIconToolTip: {
        alignSelf: 'center',
        marginLeft: 10,
    }
});

const iconToolTipStyle: Partial<ITooltipHostStyles> = {
    root: {
        display: 'inline-block',
        alignSelf: 'center'
    }
};

export interface FluentUIAutoCompleteProps {
    context?: ComponentFramework.Context<IInputs>
    apiToken?: string;
    isDisabled?: boolean;
    value?: string;
    countryRestriction?: string;
    stateReturnShortName?: boolean;
    countryReturnShortName?: boolean;
    updateValue: (parsedAddress: ParsedAddress) => void;
}

export const FluentUIAutoComplete: React.FC<FluentUIAutoCompleteProps> = (props) => {
    const [focusWidth, setFocusWidth] = useState<number>(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const getInputWidth = () => {
        let w = searchboxRef?.current?.offsetWidth;
        if (typeof w === 'number') {
            w = w - 2;
            if (focusWidth !== w) {
                setFocusWidth(w);
            }
        }
    };

    const [value, setValue] = useState<string>(props.value || '');
    const [suggestions, setSuggestions] = useState<AddressItem[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [hoveredItem, setHoveredItem] = useState<AddressItem | null>(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState<number>(-1);
    const [isLoadingHover, setIsLoadingHover] = useState<boolean>(false);
    const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
    const [countryRestrictionEnabled, setCountryRestrictionEnabled] = useState<boolean>(Boolean(props.countryRestriction && props.countryRestriction.trim()));
    const isSelected = useRef<boolean>(Boolean(props.value && props.value.trim()));
    const searchboxRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    const debouncedValue = useDebounce<string>(value, DEBOUNCE_DELAY);

    const handleSearch = (evt: ChangeEvent<HTMLInputElement> | undefined) => {
        if (evt !== undefined) {
            setIsLoading(true);
            isSelected.current = false;
            setHasUserInteracted(true);
            setValue(evt.target.value);
        }
    };

    useEffect(() => {
        async function fetchSuggestions() {
            try {
                console.log('AutoComplete - Starting fetchSuggestions for:', debouncedValue);
                console.log('AutoComplete - API Token:', props.apiToken);

                // Ensure apiToken is not undefined
                if (!props.apiToken) {
                    console.error('AutoComplete - API Token is not provided');
                    setIsLoading(false);
                    setSuggestions([]);
                    return;
                }

                const response = await fetchAddressSuggestions(debouncedValue, props.apiToken, countryRestrictionEnabled ? props.countryRestriction : undefined);

                console.log('AutoComplete - Full API Response:', response);

                if (response.status === 'OK') {
                    console.log('AutoComplete - Predictions:', response.predictions);

                    const addressItems: AddressItem[] = response.predictions.map((prediction: PlacePrediction) => ({
                        placeId: prediction.placeId,
                        description: prediction.description,
                        mainText: prediction.structuredFormatting.mainText,
                        secondaryText: prediction.structuredFormatting.secondaryText,
                        types: prediction.types
                    }));

                    console.log('AutoComplete - Mapped AddressItems:', addressItems);

                    setIsLoading(false);
                    setSuggestions(addressItems);
                } else {
                    console.error('AutoComplete - Google Places API Error:', response.status);
                    setIsLoading(false);
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('AutoComplete - Error fetching address suggestions:', error);
                setIsLoading(false);
                setSuggestions([]);
            }
        }

        if (hasUserInteracted && !isSelected.current && debouncedValue.length > MIN_SEARCH_LENGTH) {
            console.log('AutoComplete - Fetching address suggestions for:', debouncedValue);
            setIsLoading(true);
            setSuggestions([]);
            fetchSuggestions();
        } else {
            console.log('AutoComplete - Not fetching - hasUserInteracted:', hasUserInteracted, 'isSelected:', isSelected.current, 'length:', debouncedValue.length);
            setIsLoading(false);
            setSuggestions([]);
        }

        getInputWidth();
    }, [debouncedValue, props.apiToken, hasUserInteracted, countryRestrictionEnabled]);

    // Handle clicks outside the component
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                // Close suggestions and hover card when clicking outside
                setSuggestions([]);
                setHoveredItem(null);
                setHoveredItemIndex(-1);
                if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const onClear = () => {
        setValue('');
        setSuggestions([]);
        const emptyAddress: ParsedAddress = {
            fullAddress: '',
            street: '',
            suburb: '',
            city: '',
            state: '',
            country: '',
            latitude: '',
            longitude: '',
            building: '',
            postcode: ''
        };
        props.updateValue(emptyAddress);
    };

    const onSelect = async (item: AddressItem) => {
        if (item !== null && item !== undefined) {
            isSelected.current = true;
            setSuggestions([]);
            setHoveredItem(null); // Close hover card
            setHoveredItemIndex(-1);

            // Clear hover timeout if exists
            if (hoverTimeoutRef.current) {
                clearTimeout(hoverTimeoutRef.current);
            }

            try {
                // Fetch detailed place information to get address components
                const placeDetailsResponse = await fetchPlaceDetails(item.placeId, props.apiToken || '');

                if (placeDetailsResponse.status === 'OK' && placeDetailsResponse.result) {
                    const parsedAddress = GooglePlacesUtils.parseAddressComponents(
                        placeDetailsResponse.result,
                        props.stateReturnShortName || false,
                        props.countryReturnShortName || false
                    );

                    // Set the input value to the street address only
                    setValue(parsedAddress.street || '');
                    props.updateValue(parsedAddress);
                } else {
                    // Fallback to basic address if place details fail
                    const basicAddress: ParsedAddress = {
                        fullAddress: item.description,
                        street: '',
                        suburb: '',
                        city: '',
                        state: '',
                        country: '',
                        latitude: '',
                        longitude: '',
                        building: '',
                        postcode: ''
                    };

                    // Set the input value to empty since we don't have street details
                    setValue('');
                    props.updateValue(basicAddress);
                }
            } catch (error) {
                console.error('Error fetching place details:', error);
                // Fallback to basic address if there's an error
                const basicAddress: ParsedAddress = {
                    fullAddress: item.description,
                    street: '',
                    suburb: '',
                    city: '',
                    state: '',
                    country: '',
                    latitude: '',
                    longitude: '',
                    building: '',
                    postcode: ''
                };
                props.updateValue(basicAddress);
            }
        }
    };

    const [hoveredItemPosition, setHoveredItemPosition] = useState<{ top: number; height: number } | null>(null);

    const onItemHover = (item: AddressItem, index: number) => {
        // Clear any existing hide timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
            hoverTimeoutRef.current = null;
        }

        // Get the actual DOM element position
        const itemElement = document.getElementById(`suggestion_${index}`);
        if (itemElement) {
            const rect = itemElement.getBoundingClientRect();
            const dropdownElement = itemElement.closest('.ms-FocusZone');
            const dropdownRect = dropdownElement?.getBoundingClientRect();

            if (dropdownRect) {
                const relativeTop = rect.top - dropdownRect.top;
                const centerY = relativeTop + (rect.height / 2);
                setHoveredItemPosition({ top: centerY, height: rect.height });
                console.log('Item position:', { relativeTop, centerY, height: rect.height });
            }
        }

        // Set the hovered item immediately (no delay)
        if (hoveredItem?.placeId !== item.placeId) {
            console.log('Setting hovered item:', item.placeId, 'at index:', index);
            setHoveredItem(item);
            setHoveredItemIndex(index);
        }
    };

    const onItemHoverLeave = () => {
        console.log('Hover leave triggered from dropdown item');
        // Clear any existing timeout
        if (hoverTimeoutRef.current) {
            clearTimeout(hoverTimeoutRef.current);
        }

        // Set a timeout to hide the card, but allow time for mouse to move to hover card
        hoverTimeoutRef.current = window.setTimeout(() => {
            console.log('Hiding hover card after item leave timeout');
            setHoveredItem(null);
            setHoveredItemIndex(-1);
            setHoveredItemPosition(null);
            setHoveredItemPosition(null);
        }, 200); // Increased delay to 200ms
    };

    const openMapsUrl = (item: AddressItem) => {
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.description)}`;
        window.open(mapsUrl, '_blank');
    };

    const renderDropdown = (item: AddressItem, index: number): React.ReactElement => {
        return (
            <div
                id={`suggestion_${index}`}
                key={`key_${index}`}
                className={style.itemContainer}
                data-is-focusable={true}
                onClick={() => onSelect(item)}
                onMouseEnter={() => onItemHover(item, index)}
                onMouseLeave={onItemHoverLeave}
            >
                <div className={style.itemContent}>
                    <div className={style.itemHeader}>{item.mainText}</div>
                    <div className={style.itemDetail}>{item.secondaryText}</div>
                </div>
            </div>
        );
    };

    const getDetail = (address: string) => {
        console.debug(`Address selected: ${address}`);
        // This function appears to be unused, but keeping for backwards compatibility
        const basicAddress: ParsedAddress = {
            fullAddress: address,
            street: '',
            suburb: '',
            city: '',
            state: '',
            country: '',
            latitude: '',
            longitude: '',
            building: '',
            postcode: ''
        };
        props.updateValue(basicAddress);
    };

    return (
        <ThemeProvider theme={theme}>
            <div ref={containerRef}>
                <Stack className={style.stackContainer} tokens={stackTokens}>
                    <div ref={searchboxRef}>
                        <SearchBox
                            className={style.searchBox}
                            placeholder="Search for an address..."
                            value={value}
                            onChange={handleSearch}
                            onClear={onClear}
                            onFocus={() => setHasUserInteracted(true)}
                            iconProps={searchIcon}
                            disabled={props.isDisabled}
                        />
                    </div>

                    {/* Loading indicator separate from dropdown */}
                    {isLoading && suggestions.length === 0 && (
                        <div className={style.focusZoneContainer} style={{ width: focusWidth }}>
                            <div className={style.focusZoneHeader}>
                                <div className={style.focusZoneHeaderContent}>
                                    <Spinner size={SpinnerSize.small} labelPosition="right" label="Searching..." />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* No results found */}
                    {!isLoading && suggestions.length === 0 && debouncedValue.length > MIN_SEARCH_LENGTH && (
                        <div className={style.focusZoneContainer} style={{ width: focusWidth }}>
                            <div className={style.focusZoneHeader}>
                                <div className={style.focusZoneHeaderContent} style={{ color: '#A80000' }}>
                                    No results found
                                </div>
                            </div>
                        </div>
                    )}

                    {suggestions.length > 0 && (
                        <div className={style.focusZoneContainer} style={{ width: focusWidth }}>
                            <FocusZone direction={FocusZoneDirection.vertical}>
                                <div className={style.focusZoneContent}>
                                    {suggestions.map((item, index) => renderDropdown(item, index))}
                                </div>
                            </FocusZone>

                            <div className={style.focusZoneFooter}>
                                <div className={style.focusZoneFooterLeft}>
                                    <Label style={{ fontSize: '12px', margin: 0, color: '#666', fontWeight: 'normal' }}>
                                        Powered by Google™
                                    </Label>
                                </div>
                                <div className={style.focusZoneFooterRight}>
                                    {props.countryRestriction && props.countryRestriction.trim() ? (
                                        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                                            <Label style={{ fontSize: '12px', margin: 0, color: '#666' }}>
                                                Search Restriction:
                                            </Label>
                                            <Toggle
                                                checked={countryRestrictionEnabled}
                                                onChange={(event, checked) => {
                                                    setCountryRestrictionEnabled(!!checked);
                                                    // Clear current suggestions to force a new search with updated restriction
                                                    if (hasUserInteracted && value.length > MIN_SEARCH_LENGTH) {
                                                        setSuggestions([]);
                                                        setIsLoading(true);
                                                    }
                                                }}
                                                inlineLabel
                                                onText={`${props.countryRestriction.toUpperCase()}`}
                                                offText="Worldwide"
                                                styles={{
                                                    root: { marginBottom: 0 },
                                                    label: { fontSize: '12px' },
                                                    text: { fontSize: '12px' }
                                                }}
                                            />
                                        </Stack>
                                    ) : (
                                        <ActionButton className={style.focusZoneBtn} iconProps={dropBtnTwo}>
                                            Worldwide Search
                                        </ActionButton>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hover Card with Bridge */}
                    {hoveredItem && props.apiToken && (
                        <>
                            {/* Invisible bridge area between dropdown and hover card */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: focusWidth,
                                    top: 36,
                                    width: '30px', // Bridge width
                                    height: '400px', // Cover the entire dropdown height
                                    zIndex: 1000, // Below the hover card but above other elements
                                    backgroundColor: 'transparent'
                                }}
                                onMouseEnter={() => {
                                    // Keep hover card visible when mouse enters bridge
                                    console.log('Mouse entered bridge area');
                                    if (hoverTimeoutRef.current) {
                                        clearTimeout(hoverTimeoutRef.current);
                                        hoverTimeoutRef.current = null;
                                    }
                                }}
                                onMouseLeave={() => {
                                    // Start hide timeout when leaving bridge
                                    console.log('Mouse left bridge area');
                                    if (hoverTimeoutRef.current) {
                                        clearTimeout(hoverTimeoutRef.current);
                                    }
                                    hoverTimeoutRef.current = window.setTimeout(() => {
                                        console.log('Hiding hover card after bridge leave timeout');
                                        setHoveredItem(null);
                                        setHoveredItemIndex(-1);
                                        setHoveredItemPosition(null);
                                    }, 100);
                                }}
                            />

                            {/* Actual hover card */}
                            <div
                                style={{
                                    position: 'absolute',
                                    left: focusWidth + 30, // Moved further away (30px gap)
                                    top: 36,
                                    zIndex: 1001
                                }}
                                onMouseEnter={() => {
                                    // Keep hover card visible when mouse enters it
                                    console.log('Mouse entered hover card');
                                    if (hoverTimeoutRef.current) {
                                        clearTimeout(hoverTimeoutRef.current);
                                        hoverTimeoutRef.current = null;
                                    }
                                }}
                                onMouseLeave={() => {
                                    // Hide hover card when mouse leaves it
                                    console.log('Mouse left hover card');
                                    if (hoverTimeoutRef.current) {
                                        clearTimeout(hoverTimeoutRef.current);
                                    }
                                    hoverTimeoutRef.current = window.setTimeout(() => {
                                        console.log('Hiding hover card after card leave timeout');
                                        setHoveredItem(null);
                                        setHoveredItemIndex(-1);
                                        setHoveredItemPosition(null);
                                    }, 100);
                                }}
                            >
                                <EntityHoverCard
                                    placeId={hoveredItem.placeId}
                                    apiKey={props.apiToken}
                                    onLoading={setIsLoadingHover}
                                    arrowPosition={hoveredItemPosition?.top || 24}
                                />
                            </div>
                        </>
                    )}
                </Stack>
            </div>
        </ThemeProvider>
    );
};
