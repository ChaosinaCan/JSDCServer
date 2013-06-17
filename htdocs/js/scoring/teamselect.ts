/// <reference path="../admin/base.ts" />

module teamselect {
	export function onconnect(error: string) {
		if (error) {
			console.log(error);
			return;
		}

		var clock = jsdc.clock;
		clock.join('game');
		clock.on('match changed', teamselect.refresh);
	}

	export function refresh(): void {
		location.reload();
	}
}