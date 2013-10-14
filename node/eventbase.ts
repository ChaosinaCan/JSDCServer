///<reference path='node.d.ts'/>

var events = require('events');

class BaseEventEmitter implements EventEmitter {
	private emitter = new events.EventEmitter();

	addListener(event: string, listener: Function) {
		return this.emitter.addListener(event, listener);
	}

	on(event: string, listener: Function) {
		return this.emitter.on(event, listener);
	}

	once(event: string, listener: Function): void {
		this.emitter.once(event, listener);
	}
	
	removeAllListeners(event?: string): void {
		this.emitter.removeAllListeners(event);
	}

	removeListener(event: string, listener: Function): void {
		this.emitter.removeListener(event, listener);
	}

	removeAllListener(event: string): void {
		this.emitter.removeAll(event);
	}

	setMaxListeners(n: number): void {
		this.emitter.setMaxListeners(n);
	}

	listeners(event: string): Function[] {
		return this.emitter.listeners();
	}

	emit(event: string, arg1?: any, arg2?: any): void {
		this.emitter.emit.apply(this.emitter, Array.prototype.slice.apply(arguments));
	}
}

export = BaseEventEmitter;