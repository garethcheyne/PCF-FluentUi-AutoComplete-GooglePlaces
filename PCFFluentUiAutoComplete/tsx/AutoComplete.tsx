import * as React from 'react'
import { useDebounce } from 'usehooks-ts'
import { IInputs } from '../generated/ManifestTypes'
import { PlacePrediction, AddressItem, GooglePlacesUtils, ParsedAddress } from '../types'
import { fetchAddressSuggestions, fetchPlaceDetails } from './Queries'
import { EntityHoverCard } from './EntityHoverCard'
import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { FocusZone, FocusZoneDirection } from '@fluentui/react/lib/FocusZone'
import { ITooltipHostStyles, } from '@fluentui/react/lib/Tooltip'
import { IIconProps } from '@fluentui/react/lib/Icon'
import { mergeStyleSets, getTheme, getFocusStyle, ITheme } from '@fluentui/react/lib/Styling'
import { ActionButton } from '@fluentui/react/lib/Button'
import { ThemeProvider } from '@fluentui/react/lib/Theme'
import { SearchBox } from '@fluentui/react/lib/SearchBox'
import { Stack, IStackTokens } from '@fluentui/react/lib/Stack'
import { FontWeights } from '@fluentui/react/lib/Styling'
import { Label } from '@fluentui/react/lib/Label'
import { Toggle } from '@fluentui/react/lib/Toggle'
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
        marginTop: '2px !important',
        border: `1px solid ${semanticColors.bodyDivider}`,
        boxShadow: '2px 2px 8px rgb(245, 245, 245)',
        borderRadius: '4px',
        flexGrow: 1,
        zIndex: 999999,
        backgroundColor: '#fff'
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
    focusZoneHeaderContentError: {
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
        color: '#A80000'
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
    },
    hoverCardContainer: {
        position: 'absolute',
        zIndex: 1000000,
        pointerEvents: 'auto',
        // Default positioning that will be overridden by transform
        left: 0,
        top: 0
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
    const [hoveredItem, setHoveredItem] = useState<AddressItem | null>(null);
    const [hoveredItemIndex, setHoveredItemIndex] = useState<number>(-1);
    const [hoveredItemPosition, setHoveredItemPosition] = useState<{ top: number; height: number } | null>(null);
    const [hasUserInteracted, setHasUserInteracted] = useState<boolean>(false);
    const [countryRestrictionEnabled, setCountryRestrictionEnabled] = useState<boolean>(Boolean(props.countryRestriction && props.countryRestriction.trim()));
    
    // Use refs for loading and selection state like the working example
    const isLoading = useRef<boolean>(false);
    const isSelected = useRef<boolean>(Boolean(props.value && props.value.trim()));
    const searchboxRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hoverTimeoutRef = useRef<number | null>(null);
    const debouncedValue = useDebounce<string>(value, DEBOUNCE_DELAY);

    const handleSearch = (evt: ChangeEvent<HTMLInputElement> | undefined) => {
        if (evt !== undefined) {
            const newValue = evt.target.value;
            // Only trigger search if the value actually changed
            if (newValue !== value) {
                isLoading.current = true;
                isSelected.current = false;
                setHasUserInteracted(true);
                setValue(newValue);
            }
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
                    isLoading.current = false;
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
                    console.log('AutoComplete - Setting suggestions, count:', addressItems.length);

                    isLoading.current = false;
                    setSuggestions(addressItems);

                    console.log('AutoComplete - Suggestions set, dropdown should show for', addressItems.length, 'items');
                } else {
                    console.error('AutoComplete - Google Places API Error:', response.status);
                    isLoading.current = false;
                    setSuggestions([]);
                }
            } catch (error) {
                console.error('AutoComplete - Error fetching address suggestions:', error);
                isLoading.current = false;
                setSuggestions([]);
            }
        }

        if (hasUserInteracted && !isSelected.current && debouncedValue.length > MIN_SEARCH_LENGTH) {
            console.log('AutoComplete - Fetching address suggestions for:', debouncedValue);
            isLoading.current = true;
            setSuggestions([]);
            fetchSuggestions();
        } else {
            console.log('AutoComplete - Not fetching - hasUserInteracted:', hasUserInteracted, 'isSelected:', isSelected.current, 'length:', debouncedValue.length);
            isLoading.current = false;
            setSuggestions([]);
        }

        // Debug logging for dropdown visibility
        console.log('AutoComplete - Dropdown state:', {
            suggestionsLength: suggestions.length,
            isLoading: isLoading.current,
            debouncedValueLength: debouncedValue.length,
            hasUserInteracted,
            isSelected: isSelected.current,
            focusWidth
        });

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

        const handleScroll = () => {
            // Position will be recalculated automatically with relative positioning
        };

        const handleResize = () => {
            getInputWidth(); // Recalculate width on resize
        };

        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleResize);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const onClear = () => {
        setValue('');
        setSuggestions([]);
        setHasUserInteracted(false); // Reset interaction state when clearing
        isSelected.current = false;
        const emptyAddress: ParsedAddress = {
            fullAddress: '',
            street: '',
            suburb: '',
            city: '',
            state: '',
            country: '',
            latitude: undefined,
            longitude: undefined,
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
                        latitude: undefined,
                        longitude: undefined,
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
                    latitude: undefined,
                    longitude: undefined,
                    building: '',
                    postcode: ''
                };
                props.updateValue(basicAddress);
            }
        }
    };

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
            latitude: undefined,
            longitude: undefined,
            building: '',
            postcode: ''
        };
        props.updateValue(basicAddress);
    };

    return (
        <div>
            <div ref={searchboxRef}>
                <ThemeProvider theme={theme}>
                    <Stack className={style.stackContainer} tokens={stackTokens}>
                        <SearchBox
                            className={style.searchBox}
                            placeholder="Search for an address..."
                            value={value}
                            onChange={handleSearch}
                            onClear={onClear}
                            iconProps={searchIcon}
                            disabled={props.isDisabled}
                        />
                    </Stack>
                </ThemeProvider>
            </div>

            {/* FocusZone Section/Dropdown */}
            {suggestions.length > 0 && (
                <FocusZone
                    direction={FocusZoneDirection.vertical}
                    className={style.focusZoneContainer}
                    style={{ width: focusWidth }}
                >
                    {console.log('AutoComplete - Rendering dropdown with', suggestions.length, 'suggestions')}
                    <div className={style.focusZoneContent}>
                        {suggestions.map((item, index) => renderDropdown(item, index))}
                    </div>

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
                                                isLoading.current = true;
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
                </FocusZone>
            )}

            {/* Loading indicator */}
            {isLoading.current && suggestions.length === 0 && hasUserInteracted && debouncedValue.length > MIN_SEARCH_LENGTH && (
                <FocusZone
                    direction={FocusZoneDirection.vertical}
                    className={style.focusZoneContainer}
                    style={{ width: focusWidth }}
                >
                    <div className={style.focusZoneHeader}>
                        <div className={style.focusZoneHeaderContent}>
                            <Spinner size={SpinnerSize.small} labelPosition="right" label="Searching..." />
                        </div>
                    </div>
                </FocusZone>
            )}

            {/* No results found */}
            {!isLoading.current && suggestions.length === 0 && debouncedValue.length > MIN_SEARCH_LENGTH && hasUserInteracted && (
                <FocusZone
                    direction={FocusZoneDirection.vertical}
                    className={style.focusZoneContainer}
                    style={{ width: focusWidth }}
                >
                    <div className={style.focusZoneHeader}>
                        <div className={style.focusZoneHeaderContentError}>
                            No results found
                        </div>
                    </div>
                </FocusZone>
            )}

            {/* EntityHoverCard for showing place details */}
            {hoveredItem && hoveredItemPosition && (
                <div
                    className={style.hoverCardContainer}
                    ref={(element) => {
                        if (element) {
                            element.style.transform = `translate(${focusWidth + 10}px, ${hoveredItemPosition.top - 24}px)`;
                        }
                    }}
                    onMouseEnter={() => {
                        // Clear any existing timeout when hovering over the card
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                        }
                    }}
                    onMouseLeave={() => {
                        // Hide the card when leaving it
                        if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                        }
                        hoverTimeoutRef.current = window.setTimeout(() => {
                            setHoveredItem(null);
                            setHoveredItemIndex(-1);
                            setHoveredItemPosition(null);
                        }, 100);
                    }}
                >
                    <EntityHoverCard
                        placeId={hoveredItem.placeId}
                        apiKey={props.apiToken || ''}
                        arrowPosition={hoveredItemPosition.height / 2}
                    />
                </div>
            )}
        </div>
    );
};
