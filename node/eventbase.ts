///<reference path='node.d.ts'/>

var events = require('events');

class BaseEventEmitter implements EventEmitter {
	private emitter = new events.EventEmitter();

	addListener(event: string, listener: Function): EventEmitter {
		return this.emitter.addListener(event, listener);
	}

	on(event: string, listener: Function): EventEmitter {
		return this.emitter.on(event, listener);
	}

	once(event: string, listener: Function): EventEmitter {
		return this.emitter.once(event, listener);
	}

	removeAllListeners(event?: string): EventEmitter {
		return this.emitter.removeAllListeners(event);
	}

	removeListener(event: string, listener: Function): EventEmitter {
		return this.emitter.removeListener(event, listener);
	}

	setMaxListeners(n: number): void {
		this.emitter.setMaxListeners(n);
	}

	listeners(event: string): Function[] {
		return this.emitter.listeners();
	}

	emit(event: string, arg1?: any, arg2?: any): boolean {
		return this.emitter.emit.apply(this.emitter, Array.prototype.slice.apply(arguments));
	}
}

export = BaseEventEmitter;