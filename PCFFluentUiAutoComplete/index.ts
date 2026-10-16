import * as React from 'react';
import { webLightTheme, Theme } from '@fluentui/react-components';
import { formatPlaceAddress } from 'fluentui-extended/address-lookup';
import type { PlaceAddress } from 'fluentui-extended/address-lookup';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import { GoogleAddressField } from './tsx/GoogleAddressField';

// Free-text and cleared addresses carry 0,0 rather than coordinates
const hasCoordinates = (address: PlaceAddress | null): address is PlaceAddress =>
	!!address && (address.latitude !== 0 || address.longitude !== 0);

/**
 * Google address search for a set of address columns.
 *
 * A virtual control: React and Fluent v9 come from the platform rather than the
 * bundle, and the host's theme is passed down so the field matches the form.
 */
export class PCFFluentUiAutoCompleteGooglePlaces implements ComponentFramework.ReactControl<IInputs, IOutputs> {
	private notifyOutputChanged: () => void;
	private outputs: IOutputs = {};

	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void): void {
		this.notifyOutputChanged = notifyOutputChanged;
	}

	public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
		const { parameters } = context;

		return React.createElement(GoogleAddressField, {
			apiKey: parameters.apiToken.raw ?? '',
			address: this.storedAddress(context),
			countryRestriction: parameters.countryRestriction.raw ?? '',
			stateShortName: parameters.stateReturnShortName.raw ?? false,
			countryShortName: parameters.countryReturnShortName.raw ?? false,
			// Dynamics shows a locked field at full contrast, so this is read-only rather than disabled
			readOnly: context.mode.isControlDisabled || parameters.street.security?.editable === false,
			theme: (context.fluentDesignLanguage?.tokenTheme as Theme | undefined) ?? webLightTheme,
			onChange: this.handleChange,
		});
	}

	public getOutputs(): IOutputs {
		return this.outputs;
	}

	public destroy(): void {
		// Nothing to release - React and the Google Maps script belong to the host page
	}

	/** The record's columns as an address, or null when the record holds none. */
	private storedAddress(context: ComponentFramework.Context<IInputs>): PlaceAddress | null {
		const { parameters } = context;
		const address: PlaceAddress = {
			placeId: parameters.googlePlaceId.raw ?? '',
			formattedAddress: '',
			building: parameters.building.raw ?? '',
			street: parameters.street.raw ?? '',
			suburb: parameters.suburb.raw ?? '',
			city: parameters.city.raw ?? '',
			state: parameters.state.raw ?? '',
			postcode: parameters.postcode.raw ?? '',
			country: parameters.country.raw ?? '',
			latitude: parameters.latitude.raw ?? 0,
			longitude: parameters.longitude.raw ?? 0,
		};

		const hasText = address.placeId.trim() !== '' || formatPlaceAddress(address) !== '';

		return hasText || hasCoordinates(address) ? address : null;
	}

	private handleChange = (address: PlaceAddress | null): void => {
		// Free text and cleared addresses have no coordinates; null clears the
		// column, where undefined would leave the old coordinates in place
		const located = hasCoordinates(address);
		const clearedNumber = null as unknown as number;

		this.outputs = {
			street: address?.street ?? '',
			suburb: address?.suburb ?? '',
			city: address?.city ?? '',
			state: address?.state ?? '',
			country: address?.country ?? '',
			building: address?.building ?? '',
			postcode: address?.postcode ?? '',
			googlePlaceId: address?.placeId ?? '',
			latitude: located ? address.latitude : clearedNumber,
			longitude: located ? address.longitude : clearedNumber,
		};

		this.notifyOutputChanged();
	};
}
