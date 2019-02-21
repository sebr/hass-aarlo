
import { LitElement, html } from 'https://unpkg.com/@polymer/lit-element@^0.5.2/lit-element.js?module';

class AarloGlance extends LitElement {

	static get properties() {
		return {
			_hass: Object,
			_config: Object,
			_img: String,
			_video: String,
		}
	}

	static get outerStyleTemplate() {
		return html`
		<style>
			ha-card {
				position: relative;
				min-height: 48px;
				overflow: hidden;
			}
			hui-image.clickable {
				cursor: pointer;
			}
			.box {
				white-space: var(--paper-font-common-nowrap_-_white-space); overflow: var(--paper-font-common-nowrap_-_overflow); text-overflow: var(--paper-font-common-nowrap_-_text-overflow);
					position: absolute;
					left: 0;
					right: 0;
					bottom: 0;
					background-color: rgba(0, 0, 0, 0.4);
					padding: 4px 8px;
					font-size: 16px;
					line-height: 40px;
					color: white;
					display: flex;
					justify-content: space-between;
			}
			.middle {
				left: 10%;
				right: 10%;
				bottom: 35%;
			}
			.box .title {
				font-weight: 500;
				margin-left: 4px;
			}
			.box .status {
				font-weight: 500;
				margin-right: 4px;
				text-transform: capitalize;
			}
			ha-icon {
				cursor: pointer;
				padding: 2px;
				color: #a9a9a9;
			}
			ha-icon.state-update {
				color: #cccccc;
			}
			ha-icon.state-on {
				color: white;
			}
			ha-icon.state-warn {
				color: orange;
			}
			ha-icon.state-error {
				color: red;
			}
		</style>
		`;
	}

	static get innerStyleTemplate() {
		return html`
			<style>
				img {
					display: block;
					height: auto;
					transition: filter 0.2s linear;
					width: 100%;
				}
				video {
					display: block;
					height: auto;
					width: 100%;
				}
				.error {
					text-align: center;
				}
				.hidden {
					display: none;
				}
				.ratio {
					position: relative;
					width: 100%;
					height: 0;
				}
				.ratio img,
				.ratio div {
					position: absolute;
					top: 0;
					left: 0;
					width: 100%;
					height: 100%;
				}
				#brokenImage {
					background: grey url("/static/images/image-broken.svg") center/36px
					no-repeat;
				}
			</style>
		`;
	}

	safe_state( _hass,_id,def='' ) {
		return _id in _hass.states ? _hass.states[_id] : { 'state':def,'attributes':{ 'friendly_name':'unknown' } };
	}

	_render( { _hass,_config,_img,_video } ) {

		const camera = this.safe_state(_hass,this._cameraId,'unknown')
		const cameraName = _config.name ? _config.name : camera.attributes.friendly_name;

		if( _video ) {
			var imageHidden = 'hidden';
			var brokeHidden = 'hidden';
			var videoHidden = '';
			var videoUrl = _video;
		} else {
			// do we have a valid image?
			var imageHidden = _img != null ? '':'hidden';
			var brokeHidden = _img == null ? '':'hidden';
			var videoHidden = 'hidden';
			var videoUrl = 'not-used';
		}

		var awrap = document.getElementById( 'aarlo-wrapper' );
		var aimg = document.getElementById( 'aarlo-image' );

		// what are we showing?
		var show = _config.show || [];
		var batteryHidden  = show.includes('battery') || show.includes('battery_level') ? '' : 'hidden';
		var signalHidden   = show.includes('signal_strength') ? '' : 'hidden';
		var motionHidden   = show.includes('motion') ? '' : 'hidden';
		var soundHidden    = show.includes('sound') ? '' : 'hidden';
		var capturedHidden = show.includes('captured') || show.includes('captured_today') ? '' : 'hidden';
		var snapshotHidden = show.includes('snapshot') ? '' : 'hidden';

		if( batteryHidden == '' ) {
			var battery      = this.safe_state(_hass,this._batteryId,0);
			var batteryText  = 'Battery Strength: ' + battery.state +'%';
			var batteryIcon  = battery.state < 10 ? 'battery-outline' :
								( battery.state > 90 ? 'battery' : 'battery-' + Math.round(battery.state/10) +'0' );
			var batteryState = battery.state < 25 ? 'state-warn' :
								( battery.state < 15 ? 'state-error' : 'state-update' );
		} else {
			var batteryText  = 'not-used';
			var batteryIcon  = 'not-used';
			var batteryState = 'state-update';
		}

		if( signalHidden == '' ) {
			var signal      = this.safe_state(_hass,this._signalId,0);
			var signal_text = 'Signal Strength: ' + signal.state;
			var signalIcon  = signal.state == 0 ? 'mdi:wifi-outline' : 'mdi:wifi-strength-' + signal.state;
		} else {
			var signal_text = 'not-used';
			var signalIcon  = 'mdi:wifi-strength-4';
		}

		if( motionHidden == '' ) {
			var motionOn   = this.safe_state(_hass,this._motionId,'off').state == 'on' ? 'state-on' : '';
			var motionText = 'Motion: ' + (motionOn != '' ? 'detected' : 'clear');
		} else {
			var motionOn   = 'not-used';
			var motionText = 'not-used';
		}

		if( soundHidden == '' ) {
			var soundOn    = this.safe_state(_hass,this._soundId,'off').state == 'on' ? 'state-on' : '';
			var soundText  = 'Sound: ' + (soundOn != '' ? 'detected' : 'clear');
		} else {
			var soundOn    = 'not-used'
			var soundText  = 'not-used'
		}

		if( capturedHidden == '' ) {
			var captured     = this.safe_state(_hass,this._captureId,0).state;
			var last         = this.safe_state(_hass,this._lastId,0).state;
			var capturedText = 'Captured: ' + ( captured == 0 ? 'nothing today' :
												captured + ' clips today, last at ' + last )
			var capturedIcon = _video ? 'mdi:stop' : 'mdi:file-video'
			var capturedOn   = captured != 0 ? 'state-update' : ''
		} else {
			var capturedText = 'not-used';
			var capturedOn   = ''
			var capturedIcon = 'mdi:file-video'
		}

		if( snapshotHidden == '' ) {
			var snapshotOn    = '';
			var snapshotText  = 'click to update image'
			var snapshotIcon  = 'mdi:camera'
		} else {
			var snapshotOn    = 'not-used'
			var snapshotText  = 'not-used'
			var snapshotIcon  = 'mdi:camera'
		}

		var img = html`
			${AarloGlance.innerStyleTemplate}
			<div id="aarlo-wrapper">
				<video class$="${videoHidden}" src="${videoUrl}"
							type="video/mp4" width="${this.clientWidth}" height="${this.clientHeight}"
							autoplay playsinline controls poster="${_img}"
							onended="${(e) => { this.stopVideo(this._cameraId); }}"
							on-click="${(e) => { this.stopVideo(this._cameraId); }}">
					Your browser does not support the video tag.
				</video>
				<img class$="${imageHidden}" id="aarlo-image" on-click="${(e) => { this.startVideo(this._cameraId); }}" src="${_img}" />
				<div class$="${brokeHidden}" style="height: 100px" id="brokenImage"></div>
			</div>
		`;

		var state = html`
			<div class$="box ${imageHidden}">
				<div class="title">
				${cameraName} 
				</div>
				<div>
					<ha-icon on-click="${(e) => { this.moreInfo(this._motionId); }}" class$="${motionOn} ${motionHidden}" icon="mdi:run-fast" title="${motionText}"></ha-icon>
					<ha-icon on-click="${(e) => { this.moreInfo(this._soundId); }}" class$="${soundOn} ${soundHidden}" icon="mdi:ear-hearing" title="${soundText}"></ha-icon>
					<ha-icon on-click="${(e) => { this.startVideo(this._cameraId); }}" class$="${capturedOn} ${capturedHidden}" icon="${capturedIcon}" title="${capturedText}"></ha-icon>
					<ha-icon on-click="${(e) => { this.updateSnapshot(this._cameraId); }}" class$="${snapshotOn} ${snapshotHidden}" icon="${snapshotIcon}" title="${snapshotText}"></ha-icon>
					<ha-icon on-click="${(e) => { this.moreInfo(this._batteryId); }}" class$="${batteryState} ${batteryHidden}" icon="mdi:${batteryIcon}" title="${batteryText}"></ha-icon>
					<ha-icon on-click="${(e) => { this.moreInfo(this._signalId); }}" class$="state-update ${signalHidden}" icon="${signalIcon}" title="${signal_text}"></ha-icon>
				</div>
				<div class="status">
					${camera.state}
				</div>
			</div>
		`;

		return html`
			${AarloGlance.outerStyleTemplate}
			<ha-card>
			${img}
			${state}
			</ha-card>
		`;
	}

	set hass( hass ) {
		this._hass = hass
		this._updateCameraImageSrc()
	}

    setConfig(config) {

        var camera = undefined;
        if( config.entity ) {
            camera = config.entity.replace( 'camera.aarlo_','' );
        }
        if( config.camera ) {
            camera = config.camera;
        }
        if ( camera == undefined ) {
            throw new Error( 'missing a camera definition' );
        }

        if( !config.show ) {
            throw new Error( 'missing show components' );
        }

        this._config = config;
		this._cameraId  = 'camera.aarlo_' + camera;
		this._motionId  = 'binary_sensor.aarlo_motion_' + camera;
		this._soundId   = 'binary_sensor.aarlo_sound_' + camera;
		this._batteryId = 'sensor.aarlo_battery_level_' + camera;
		this._signalId  = 'sensor.aarlo_signal_strength_' + camera;
		this._captureId = 'sensor.aarlo_captured_today_' + camera;
		this._lastId    = 'sensor.aarlo_last_' + camera;

		if ( this._hass && this._hass.states[this._cameraId] == undefined ) {
			throw new Error( 'unknown camera' );
		}

		this._updateCameraImageSrc()
    }

	moreInfo( id ) {
        const event = new Event('hass-more-info', {
          bubbles: true,
          cancelable: false,
          composed: true,
        });
        event.detail = { entityId: id };
        this.shadowRoot.dispatchEvent(event);
        return event;
	}

	async startVideo( id ) {
		try {
			const video = await this._hass.callWS({
				type: "aarlo_video_url",
				entity_id: this._cameraId,
				index: 0,
			});
			this._video = video.url
		} catch (err) {
			this._video = null
		}
	}

	stopVideo( id ) {
		this._video = null
	}

	updateSnapshot( id ) {
		this._hass.callService( 'camera','aarlo_request_snapshot', { entity_id:id } )
	}

	async _updateCameraImageSrc() {
		try {
			const { content_type: contentType, content } = await this._hass.callWS({
				type: "camera_thumbnail",
				entity_id: this._cameraId,
			});
			this._img = `data:${contentType};base64, ${content}`;
		} catch (err) {
			this._img = null
		}
	}

    getCardSize() {
        return 3;
    }
}

customElements.define('aarlo-glance', AarloGlance);

