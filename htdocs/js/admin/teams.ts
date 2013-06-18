/// <reference path="base.ts" />

module game {
	export var teams: Team[];
	export var teamsById: { [key: string]: Team; } = {};
}

module teams {

	var _template: JQuery;
	var _uploadFile: File;

	export function init(): void {
		// Make drag&drop handlers work properly
		$.event.props.push( "dataTransfer" );

		game.teams = jsdc.team.parse(game.teams);
		game.teams.forEach((team) => game.teamsById[team.teamId.toString()] = team);

		_template = $('<tr>').append(
			$('<td class=name>'),
			$('<td class=uni>'),
			$('<td class=buttons>').append(
				$('<button class=edit>').text('Edit team'),
				$('<button class=delete>').text('Delete team')
			)
		);

		buildTeamList();

		$('#new').click(() => {
			editTeam();
		});
	}

	export function buildTeamList(): void {
		var list = $('#teams tbody').empty();

		list.append(
			game.teams.sort(teamSort).map((team) => {
				var item = _template.clone();
				item.data('team', team);
				item.find('.name').text(team.name);
				item.find('.uni').text(team.university);
				item.find('button.edit').click( () => editTeam(item.data('team')) ),
				item.find('button.delete').click( () => deleteTeam(item.data('team')) );
				return item;
			})
		);
	}

	export function refreshTeamList(): void {
		console.log('refresh');
		jsdc.team.getAll((err, teams) => {
			if (err) {
				Modal.apiError(err, 'Failed to refresh teams');
			} else {
				game.teams = teams;
				buildTeamList();
			}
		});
	}

	export function editTeam(team?: Team): void {
		var isNewTeam = team === undefined;
		var image = (team ? jsdc.getTeamImage(team.imageName, true) : null) || '/img/default-team.svg';

		var body = $('<form id=team-edit enctype="multipart/form-data">').append(
			$('<div class=photo>').append(
				$('<label>').text('Robot photo'),
				$('<div class=upload>').append(
					$('<input type=file name=imagedata accept="image/gif; image/jpeg; image/png;">')
						.change(handleFileSelect)
						.bind('dragover', handleDragOver)
						.bind('drop', handleFileSelect),
					$('<img id=team-image>').attr('src', image),
					$('<button id=team-image-upload>').text('Upload Image')
				)
			),
			$('<div class=fields>').append(
				$('<label for=team-name>').text('Team name'),
				$('<input type=text id=team-name name=name maxlength=45>').val(team ? team.name : ''),
				$('<label for=university>').text('University name'),
				$('<input type=text id=university name=university maxlength=45>').val(team ? team.university : '')
			)
		);

		var buttons: Modal.ModalButton[] = [
			{ text: 'Save', action: saveTeam.bind(null, isNewTeam, team, body.get(0)) },
			{ text: 'Cancel' },
		];

		_uploadFile = null;

		Modal.dialog({
			title: isNewTeam ? 'Create new team' : 'Edit team information',
			body: body,
			buttons: buttons,
		});
	}

	function teamSort(a: Team, b: Team) {
		var uniComp = naturalSort(a.university, b.university);
		if (uniComp === 0) {
			return naturalSort(a.name, b.name);
		} else {
			return uniComp;
		}
	}

	function deleteTeam(team: Team) {
		Modal.confirm('Delete team?', 'Are you sure you want to delete team ' + team.name + '? '
			+ 'This action cannot be undone.', {
				yes: 'Delete team',
				no: 'Cancel',
			}, (result) => {
				if (result) {
					jsdc.team.remove(team.teamId, (err) => {
						if (err) {
							Modal.apiError(err, 'Failed to delete team');
						}
						refreshTeamList();
					});
				}
			});
	}

	function saveTeam(isNewTeam: bool, team: Team, form: HTMLFormElement) {
		if (isNewTeam) {
			newTeam(form);
		} else {
			updateTeam(team, form);
		}
	}

	function updateTeam(team: Team, form: HTMLFormElement) {
		var data: FormData = new FormData(form);
		data.append('id', team.teamId);
		data.append('method', 'update');

		if (_uploadFile) {
			data.append('imagedata', _uploadFile);
		}

		jsdc.handleSingleResponse(jsdc.postFormData('team', data), jsdc.team.parse, handleCallback);
	}

	function newTeam(form: HTMLFormElement) {
		var data: FormData = new FormData(form);
		data.append('method', 'create');
		
		if (_uploadFile) {
			data.append('imagedata', _uploadFile);
		}

		jsdc.handleRawResponse(jsdc.postFormData('team', data), handleCallback);
	}

	function handleCallback(err: APIError, data: any): void {
		$.modal.close();
		if (err) {
			Modal.apiError(err, 'Failed to save team data');
		}

		refreshTeamList();
	}

	
	function handleFileSelect(e: Event) {
		var files: FileList;
		_uploadFile = null;

		if ('dataTransfer' in e) {
			// drag handler
			e.stopPropagation();
			e.preventDefault();
			files = (<DragEvent>e).dataTransfer.files;
		} else {
			files = (<HTMLInputElement>e.target).files;
		}

		if (files.length == 0) {
			return;
		} else {
			var image: File = files[0];
			if (!image.type.match('image.*')) {
				return;
			}

			var reader = new FileReader();

			reader.onload = (e) => {
				$('#team-image').attr('src', e.target.result)
					.attr('title', image.name);
			}

			reader.readAsDataURL(image);
			_uploadFile = image;
		}
	}

	function handleDragOver(e: DragEvent) {
		e.stopPropagation();
		e.preventDefault();
		e.dataTransfer.dropEffect = 'copy';
	}
}

/*
 * Natural Sort algorithm for Javascript - Version 0.7 - Released under MIT license
 * Author: Jim Palmer (based on chunking idea from Dave Koelle)
 */
var naturalSort: {
	(a: any, b: any): number;
	insensitive: bool;
} = (() => {

	var _naturalSort: any = function (a, b) => {
		var re = /(^-?[0-9]+(\.?[0-9]*)[df]?e?[0-9]?$|^0x[0-9a-f]+$|[0-9]+)/gi,
			sre = /(^[ ]*|[ ]*$)/g,
			dre = /(^([\w ]+,?[\w ]+)?[\w ]+,?[\w ]+\d+:\d+(:\d+)?[\w ]?|^\d{1,4}[\/\-]\d{1,4}[\/\-]\d{1,4}|^\w+, \w+ \d+, \d{4})/,
			hre = /^0x[0-9a-f]+$/i,
			ore = /^0/,
			i = function (s) { return naturalSort.insensitive && ('' + s).toLowerCase() || '' + s },
			// convert all to strings strip whitespace
			x = i(a).replace(sre, '') || '',
			y = i(b).replace(sre, '') || '',
			// chunk/tokenize
			xN = x.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
			yN = y.replace(re, '\0$1\0').replace(/\0$/, '').replace(/^\0/, '').split('\0'),
			// numeric, hex or date detection
			xM = x.match(hre),
			yM = y.match(hre),
			xD = parseInt(xM ? xM[0] : null) || (xN.length != 1 && x.match(dre) && Date.parse(x)),
			yD = parseInt(yM ? yM[0] : null) || xD && y.match(dre) && Date.parse(y) || null,
			oFxNcL, oFyNcL;
		// first try and sort Hex codes or Dates
		if (yD)
			if (xD < yD) return -1;
			else if (xD > yD) return 1;
		// natural sorting through split numeric strings and default strings
		for (var cLoc = 0, numS = Math.max(xN.length, yN.length); cLoc < numS; cLoc++) {
			// find floats not starting with '0', string or 0 if not defined (Clint Priest)
			oFxNcL = !(xN[cLoc] || '').match(ore) && parseFloat(xN[cLoc]) || xN[cLoc] || 0;
			oFyNcL = !(yN[cLoc] || '').match(ore) && parseFloat(yN[cLoc]) || yN[cLoc] || 0;
			// handle numeric vs string comparison - number < string - (Kyle Adams)
			if (isNaN(oFxNcL) !== isNaN(oFyNcL)) { return (isNaN(oFxNcL)) ? 1 : -1; }
				// rely on string comparison if different types - i.e. '02' < 2 != '02' < '2'
			else if (typeof oFxNcL !== typeof oFyNcL) {
				oFxNcL += '';
				oFyNcL += '';
			}
			if (oFxNcL < oFyNcL) return -1;
			if (oFxNcL > oFyNcL) return 1;
		}
		return 0;
	}

	_naturalSort.insensitive = false;
	return _naturalSort;

})();

