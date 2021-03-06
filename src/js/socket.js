import io from "socket.io-client";

class Socket {
	constructor({ party, accessToken }){
		this.party = party;
		this.accessToken = accessToken;
		this.socket = null;
		this.started = false;
	}

	start(){
		this.socket = io(process.env.GATSBY_WS_SERVER + this.party, {
			transports: ["polling", "websocket"],
			query: {
				accessToken: this.accessToken
			}
		});

		this.socket.on("connect", () => {
			console.log("Socket connected:", this.socket.connected);
		});

		this.socket.on("disconnect", () => {
			console.log("Socket disconnected", !this.socket.connected);

			setTimeout( () => { this.socket.connect(); }, 1000 * 5);
		});

		this.socket.on("token_refreshed", data => {
			this.socket.disconnect();
			const{ accessToken } = data;

			this.accessToken = accessToken;

			setTimeout( () => { this.socket.start(); }, 1000 * 10);
		});

		this.socket.on("err", data => {
			const type = data.type;
			if(this.onError)
				this.onError(type);
		});

		this.socket.on("success", data => {
			const type = data.type;
			this.onSuccess(type);
		});

		this.socket.on("track_added", data => {
			const{ trackId, playlist } = data;
			this.onTrackAdded(trackId, playlist);
		});

		this.socket.on("track_removed", data => {
			const{ trackId, playlist } = data;
			this.onTrackRemoved(trackId, playlist);
		});

		this.socket.on("current_track", data => {
			this.onTrackUpdated(data);
		});

		this.socket.on("party_activated", () => {
			this.onPartyActivated();
		});

		this.socket.on("party_deactivated", () => {
			this.onPartyDeactivated();
		});

		this.socket.on("fallback_updated", () => {
			this.onFallbackUpdated();
		});

		// Set socket status
		this.started = true;
	}

	addTrack(data){
		this.socket.emit("add-track", data);
	}

	removeTrack(data){
		this.socket.emit("remove-track", data);
	}

	activateParty(){
		this.socket.emit("activate-party");
	}

	deactivateParty(){
		this.socket.emit("deactivate-party");
	}

	updateFallbackList(data){
		this.socket.emit("update-fallback", data);
	}

	changePlaybackDevice(id){
		this.socket.emit("change-playback-device", id);
	}
}

export default Socket;
