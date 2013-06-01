
/* 
Special Events:
	connect
	connecting(transport_type)
	connect_failed
	message(message)
	close
	disconnect
	reconnect(transport_type, reconnection_attempts)
	reconnecting(reconnection_delay, reconnection_attempts)
	reconnect_failed
*/

interface SocketWrapper {
	ackPackets: number;
	acks;
	flags;
	json;
	name: string;
	socket: Socket;

	addListener(event: string, callback: Function);
	disconnect();
	emit(event: string, data?: any);
	on(event: string, callback: Function);
	once(event: string, callback: Function);
	removeListener(event: string, callback: Function);
	send(message: string);
}

interface Socket {
	options: ConnectionOptions;
	connected: bool;
	connecting: bool;
	reconnecting: bool;
	transport;

	addListener(event: string, callback: Function);
	connect(callback?: Function);
	disconnect();
	emit(event: string, data?: any);
	on(event: string, callback: Function);
	once(event: string, callback: Function);
	removeListener(event: string, callback: Function);
	send(message: string);
}

interface ConnectionOptions {
	resource?;
	transports?: string[];
	//'connect timeout'?: number;
	//'try multiple transports'?: bool;
	reconnect?: bool;
	//'reconnection delay'?: number;
	//'max reconnection attempts'?: number;

}

declare module io {
	export function connect(uri: string, options?: ConnectionOptions): SocketWrapper;
}