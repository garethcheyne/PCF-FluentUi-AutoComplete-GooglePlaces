import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FluentUIAutoComplete, FluentUIAutoCompleteProps } from './tsx/AutoComplete';
import { ParsedAddress } from './types';
import { types } from "util";

/// <reference types="google.maps" />

export class PCFFluentUiAutoCompleteGooglePlaces implements ComponentFramework.StandardControl<IInputs, IOutputs> {
	private _container: HTMLDivElement;
	private _notifyOutputChanged: () => void;
	private _context: ComponentFramework.Context<IInputs>;
	private _props: FluentUIAutoCompleteProps = {
		updateValue: this.updateValue.bind(this),
	}
	public _street: string | undefined;
	public _suburb: string | undefined;
	public _city: string | undefined;
	public _state: string | undefined;
	public _latitude: number | undefined;
	public _longitude: number | undefined;
	public _building: string | undefined;
	public _postcode: string | undefined;
	public _country: string | undefined;
	public _googlePlaceId: string | undefined;
	private _googleMapsScript: HTMLScriptElement | null = null;
	private _isGoogleMapsLoaded: boolean = false;
	private _initialAddress: ParsedAddress | undefined;

	constructor() {

	}

	/**
	 * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
	 * Data-set values are not initialized here, use updateView.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
	 * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
	 * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
	 * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
	 */
	public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container: HTMLDivElement): void {

		this._notifyOutputChanged = notifyOutputChanged;
		this._container = container;
		this._context = context;

		this._initialAddress = {
			fullAddress: '',
			street: this._context.parameters.street.raw || '',
			suburb: this._context.parameters.suburb.raw || '',
			city: this._context.parameters.city.raw || '',
			state: this._context.parameters.state.raw || '',
			country: this._context.parameters.country.raw || '',
			latitude: this._context.parameters.latitude.raw || undefined,
			longitude: this._context.parameters.longitude.raw || undefined,
			building: this._context.parameters.building.raw || '',
			postcode: this._context.parameters.postcode.raw || '',
			googlePlaceId: this._context.parameters.googlePlaceId.raw || ''
		};

		// Load Google Maps API if we have an API key
		if (context.parameters.apiToken.raw) {
			this.loadGoogleMapsAPI(context.parameters.apiToken.raw);
		}

	}

	/**
	 * Load Google Maps API script
	 */
	private loadGoogleMapsAPI(apiKey: string): Promise<void> {
		return new Promise((resolve, reject) => {
			// Check if Google Maps is already loaded
			if (window.google && window.google.maps) {
				this._isGoogleMapsLoaded = true;
				resolve();
				return;
			}

			// Check if script is already being loaded
			const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
			if (existingScript) {
				existingScript.addEventListener('load', () => {
					this._isGoogleMapsLoaded = true;
					resolve();
				});
				existingScript.addEventListener('error', reject);
				return;
			}

			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
			script.async = true;
			script.defer = true;

			script.onload = () => {
				this._isGoogleMapsLoaded = true;
				resolve();
			};

			script.onerror = (error) => {
				reject(new Error('Failed to load Google Maps API'));
			};

			this._googleMapsScript = script;
			document.head.appendChild(script);
		});
	}

	/**
	 * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
	 * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
	 */
	public async updateView(context: ComponentFramework.Context<IInputs>) {
		// Add code to update control view

		// Update initial address with current context values
		this._initialAddress = {
			fullAddress: '',
			street: context.parameters.street.raw || '',
			suburb: context.parameters.suburb.raw || '',
			city: context.parameters.city.raw || '',
			state: context.parameters.state.raw || '',
			country: context.parameters.country.raw || '',
			latitude: context.parameters.latitude.raw || undefined,
			longitude: context.parameters.longitude.raw || undefined,
			building: context.parameters.building.raw || '',
			postcode: context.parameters.postcode.raw || '',
			googlePlaceId: context.parameters.googlePlaceId.raw || ''
		};

		this._props.context = context;
		this._props.apiToken = context.parameters.apiToken.raw || "";
		this._props.isDisabled = context.mode.isControlDisabled;
		this._props.countryRestriction = context.parameters.countryRestriction.raw || "";
		this._props.value = context.parameters.street.raw || "";
		this._props.stateReturnShortName = context.parameters.stateReturnShortName.raw || false;
		this._props.countryReturnShortName = context.parameters.countryReturnShortName.raw || false;
		this._props.initialAddress = this._initialAddress;

		ReactDOM.render(
			React.createElement(
				FluentUIAutoComplete,
				this._props
			),
			this._container
		);
	}

	/**
	 * It is called by the framework prior to a control receiving new data.
	 * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as “bound” or “output”
	 */
	public getOutputs(): IOutputs {
		return {
			street: this._street,
			suburb: this._suburb,
			city: this._city,
			state: this._state,
			country: this._country,
			latitude: this._latitude,
			longitude: this._longitude,
			building: this._building,
			postcode: this._postcode,
			googlePlaceId: this._googlePlaceId,
		};
	}

	private updateValue(parsedAddress: ParsedAddress) {
		if (parsedAddress) {
			this._street = parsedAddress.street || '';
			this._suburb = parsedAddress.suburb || '';
			this._city = parsedAddress.city || '';
			this._state = parsedAddress.state || '';
			this._country = parsedAddress.country || '';
			this._latitude = parsedAddress.latitude;
			this._longitude = parsedAddress.longitude;
			this._building = parsedAddress.building || '';
			this._postcode = parsedAddress.postcode || '';
			this._googlePlaceId = parsedAddress.googlePlaceId || '';
		} else {
			// Only clear if explicitly empty
			this._street = "";
			this._suburb = "";
			this._city = "";
			this._state = "";
			this._country = "";
			this._latitude = undefined;
			this._longitude = undefined;
			this._building = "";
			this._postcode = "";
			this._googlePlaceId = "";
		}

		this._notifyOutputChanged();
	}

	/**
	 * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
	 * i.e. cancelling any pending remote calls, removing listeners, etc.
	 */
	public destroy(): void {
		// Clean up React component
		ReactDOM.unmountComponentAtNode(this._container);

		// Clean up Google Maps script if we created it
		if (this._googleMapsScript && this._googleMapsScript.parentNode) {
			this._googleMapsScript.parentNode.removeChild(this._googleMapsScript);
			this._googleMapsScript = null;
		}

		this._isGoogleMapsLoaded = false;
	}
}
