import { IInputs, IOutputs } from "./generated/ManifestTypes";
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { FluentUIAutoComplete, FluentUIAutoCompleteProps } from './tsx/AutoComplete';
import { ParsedAddress } from './types';

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
	public _country: string | undefined;
	public _latitude: number | undefined;
	public _longitude: number | undefined;
	public _building: string | undefined;
	public _postcode: string | undefined;
	private _googleMapsScript: HTMLScriptElement | null = null;
	private _isGoogleMapsLoaded: boolean = false;

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

		console.debug("PCF FluentUI AutoComplete - index.ts init")
		this._notifyOutputChanged = notifyOutputChanged;
		this._container = container;
		this._context = context;

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
				console.log('PCF FluentUI AutoComplete - Google Maps API already loaded');
				this._isGoogleMapsLoaded = true;
				resolve();
				return;
			}

			// Check if script is already being loaded
			const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
			if (existingScript) {
				console.log('PCF FluentUI AutoComplete - Google Maps API script already exists, waiting for load');
				existingScript.addEventListener('load', () => {
					this._isGoogleMapsLoaded = true;
					resolve();
				});
				existingScript.addEventListener('error', reject);
				return;
			}

			console.log('PCF FluentUI AutoComplete - Loading Google Maps API');
			const script = document.createElement('script');
			script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
			script.async = true;
			script.defer = true;

			script.onload = () => {
				console.log('PCF FluentUI AutoComplete - Google Maps API loaded successfully');
				this._isGoogleMapsLoaded = true;
				resolve();
			};

			script.onerror = (error) => {
				console.error('PCF FluentUI AutoComplete - Failed to load Google Maps API:', error);
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

		this._props.context = context;
		this._props.isDisabled = context.mode.isControlDisabled;
		this._props.apiToken = context.parameters.apiToken.raw || "";
		this._props.value = context.parameters.street.raw || "";
		this._props.countryRestriction = context.parameters.countryRestriction.raw || "";
		this._props.stateReturnShortName = context.parameters.stateReturnShortName.raw || false;
		this._props.countryReturnShortName = context.parameters.countryReturnShortName.raw || false;

		console.debug("PCF FluentUI AutoComplete - index.ts updateView")

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
		console.debug("PCF FluentUI AutoComplete - index.ts getOutputs street: ", this._street)
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
		};
	}

	private updateValue(parsedAddress: ParsedAddress) {
		console.debug("PCF FluentUI AutoComplete - index.ts updateValue", parsedAddress)

		if (parsedAddress && parsedAddress.street && parsedAddress.street.trim() !== "") {
			this._street = parsedAddress.street || '';
			this._suburb = parsedAddress.suburb || '';
			this._city = parsedAddress.city || '';
			this._state = parsedAddress.state || '';
			this._country = parsedAddress.country || '';
			this._latitude = parsedAddress.latitude;
			this._longitude = parsedAddress.longitude;
			this._building = parsedAddress.building || '';
			this._postcode = parsedAddress.postcode || '';
		}
		else {
			this._street = "";
			this._suburb = "";
			this._city = "";
			this._state = "";
			this._country = "";
			this._latitude = undefined;
			this._longitude = undefined;
			this._building = "";
			this._postcode = "";
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
			console.log('PCF FluentUI AutoComplete - Removing Google Maps script');
			this._googleMapsScript.parentNode.removeChild(this._googleMapsScript);
			this._googleMapsScript = null;
		}

		this._isGoogleMapsLoaded = false;
	}
}
