/// <reference path="base.ts" />

/** Determines how to generate a tournament bracket when there are not enough
 *  teams to fill the entire bracket.
 */
enum TournamentGenerationStrategry {
	/** Try to minimize the total number of matches */
	MinimizeMatches,
	/** Balance empty slots among initial matches */
	BalanceMatches,
}

interface INodeDepth {
	getDepth(): number;
}

class Tournament {
	public root: TournamentNode;
	public teamCount: number;

	public paddingX = 40;
	public paddingY = 10;
	public matchSize = 20;
	public finalMatchSize = 30;
	public lineSeparation = 5;
	public textPadding = 5;

	public lineColor = 'black';
	public lineWidth = 2;
	public font = '20px arial';
	public textColor = '#000';
	public matchColor = '#060';

	private teamsPerMatch: number;
	private teamsProgressPerMatch: number;

	constructor(teams: Team[], teamsPerMatch: number, teamsProgressPerMatch: number, strategy: TournamentGenerationStrategry = TournamentGenerationStrategry.BalanceMatches) {
		teams = clone(teams);
		this.teamCount = teams.length;
		this.teamsPerMatch = teamsPerMatch;
		this.teamsProgressPerMatch = teamsProgressPerMatch;

		if (this.teamsPerMatch % this.teamsProgressPerMatch !== 0) {
			throw new Error('teamsPerMatch must be a multiple of teamsProgressPerMatch.');
		}

		// Ratio of teams per match over teams that progress
		var progressRatio = this.teamsPerMatch / this.teamsProgressPerMatch;

		// number of levels in the tree
		var depth = Math.ceil(Math.log(teams.length / this.teamsPerMatch) / Math.log(progressRatio));

		// maximum number of teams that fit in this tree
		var totalSlots = Math.pow(progressRatio, depth) * this.teamsPerMatch;

		// Make a complete tree of team slots
		this.root = new TournamentNode(this.teamsPerMatch, this.teamsProgressPerMatch);
		this.fillNodeWithSlots(this.root, depth);

		// Remove slots as necessary to get the right number of slots
		var slotsToRemove = totalSlots - teams.length;

		// If we're trying to remove matches first, remove as many matches as possible.
		if (strategy == TournamentGenerationStrategry.MinimizeMatches) {
			// removing a match promotes (this.teamsProgressPerMatch) teams one level up, removing
			// (this.teamsPerMatch - this.teamsProgressPerMatch) team slots.
			var teamsPerRemoval = this.teamsPerMatch - this.teamsProgressPerMatch;
			var matchesToRemove = Math.floor(slotsToRemove / teamsPerRemoval);
			for (var i = 0; i < matchesToRemove; i++) {
				if (this.root.removeMatch()) {
					slotsToRemove -= teamsPerRemoval;
				}
			}
		}

		// Remove the remaining teams slots.
		for (var i = 0; i < slotsToRemove; i++) {
			this.root.removeTeamSlot();
		}

		// Remove any matches which are leaf nodes and have this.teamsProgressPerMatch or less teams
		while (this.root.removeUnnecessaryMatches()) {
			// Do nothing.
		}

		// Sort so that team slots appear before matches
		this.root.sortSlots();

		// Sort the teams into the team slots
		this.fillSlotsWithTeams(this.root, teams);
	}

	public render(canvas: HTMLCanvasElement, bothDirs: boolean) {
		var g = canvas.getContext('2d');
		var depth = this.root.getDepth();

		var width = canvas.width;
		var height = canvas.height;

		if (bothDirs) {
			// start from center and move in "depth" steps to the sides
			var cx = width / 2;
			var dx = (width / 2 - this.paddingX) / depth;
		} else {
			// start from the right and move in "depth" steps to the left
			var cx = width - this.paddingX;
			var dx = (width - 2 * this.paddingX) / depth;
		}

		// Initial node is centered vertically and takes up entire height
		var yspan = height - 2 * this.paddingY;
		var cy = height / 2;

		this.renderRootNode(g, this.root, dx, yspan, cx, cy, bothDirs);
	}

	private fillNodeWithSlots(node: TournamentNode, levelsLeft: number) {
		if (levelsLeft > 0) {
			var children = node.fillWithMatches();
			children.forEach((child) => {
				this.fillNodeWithSlots(child, levelsLeft - 1);
			});
		} else {
			node.fillWithTeamSlots();
		}
	}

	private fillSlotsWithTeams(node: TournamentNode, teams: Team[]) {
		// Divide matches up by depth
		var levels: TournamentNode[][] = [];

		function _fillLevels(_node: TournamentNode, _currentLevel: number) {
			if (_node instanceof TournamentNode) {
				if (!levels[_currentLevel]) {
					levels[_currentLevel] = [];
				}

				levels[_currentLevel].push(_node);

				_node.children.forEach((_child) => {
					_fillLevels(_child, _currentLevel + 1);
				});
			}
		}

		_fillLevels(node, 0);

		// sort each level so that higher ranked seeds get put into smaller matches
		levels.forEach((level) => {
			level.sort((a, b) => b.children.length - a.children.length);
		});

		var seed = 1;

		// Start from the shallowest depth and work down
		while (levels.length > 0) {
			var level = levels.shift();
			// cycle through all the matches in this level
			while (level.length > 0) {
				var currentNode = level.pop();

				// fill one slot on this match
				var nextSlot = currentNode.getNextTeamSlot();
				if (nextSlot) {
					nextSlot.seed = seed++;
					nextSlot.team = teams.shift();

					// put the match back into the cycle since it
					// might have more slots to fill.
					level.unshift(currentNode);
				}
			}
		}
	}

	private renderRootNode(g: CanvasRenderingContext2D, node: TournamentNode, dx: number, yspan: number, x: number, y: number, bothDirs: boolean) {
		// Start drawing to the left
		var dir = -1;

		// If drawing in both directions, each direction can have a different number of children,
		// starting Y position, and spacing between children.
		var childCount: number[] = [];
		var childY: number[] = [];
		var dy: number[] = [];

		if (bothDirs) {
			// If the number of children is odd, place more children on the left
			childCount[0] = Math.ceil(node.children.length / 2);
			childCount[1] = node.children.length - childCount[0];
		} else {
			// All the children go to the left
			childCount[0] = node.children.length;
		}

		for (var i = 0; i < childCount.length; i++) {
			// Find the fraction of yspan up from y where the first child should be drawn
			var yStart = (childCount[i] > 1) ? 1 - (1 / childCount[i]) : 1;
			// Find the spacing between children
			dy[i] = (childCount[i] > 1) ? yspan / (childCount[i] - 1) * yStart : 0;
			// Find the first child's position
			childY[i] = y - ((childCount[i] > 1) ? (yspan / 2 * yStart) : 0);
		}

		// Draw each child
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			var childX = x + (dir * dx);
			var d = i % childCount.length;
			var shift = this.lineSeparation * ((childCount[d] / 2) - 0.5 - (bothDirs ? Math.floor(i / 2): i));

			if (child instanceof TournamentNode) {
				this.renderProgressLines(g, childX, childY[d], x, y - shift, this.teamsProgressPerMatch);
				this.renderNode(g, child, dx, yspan / childCount[d], childX, childY[d], x, y);
			} else {
				this.renderProgressLines(g, childX, childY[d], x, y - shift, 1);
				this.renderSeedNumber(g, child.seed, childX, childY[d], dir);
			}

			childY[d] += dy[d];

			// Toggle directions
			if (bothDirs) {
				dir *= -1;
			}
		}

		// Draw a filled circle to indicate the match
		g.fillStyle = this.matchColor;
		g.strokeStyle = this.lineColor;
		g.lineWidth = this.lineWidth;
		g.beginPath();
		g.arc(x, y, this.finalMatchSize / 2, 0, 360);
		g.fill();
		g.stroke();
	}

	private renderNode(g: CanvasRenderingContext2D, node: TournamentNode, dx: number, yspan: number, x: number, y: number, parentX: number, parentY) {
		var dir = (x - parentX > 0) ? 1 : -1;
		// Find the fraction of yspan up from y where the first child should be drawn
		var yStart = (node.children.length > 1) ? 1 - (1 / node.children.length) : 1;
		// Find the spacing between children
		var dy = (node.children.length > 1) ? yspan / (node.children.length - 1) * yStart : 0;
		// Find the first child's position
		var childX = x + (dir * dx);
		var childY = y - ((node.children.length > 1) ? (yspan / 2 * yStart) : 0);

		// Draw each child
		for (var i = 0; i < node.children.length; i++) {
			var child = node.children[i];
			var shift = this.lineSeparation * ((node.children.length / 2) - 0.5 - i);

			if (child instanceof TournamentNode) {
				this.renderProgressLines(g, childX, childY, x, y - shift, this.teamsProgressPerMatch);
				this.renderNode(g, child, dx, yspan / node.children.length, childX, childY, x, y);
			} else {
				this.renderProgressLines(g, childX, childY, x, y - shift, 1);
				this.renderSeedNumber(g, child.seed, childX, childY, dir);
			}

			childY += dy;
		}

		// Draw a filled circle to indicate the match
		g.fillStyle = this.matchColor;
		g.strokeStyle = this.lineColor;
		g.lineWidth = this.lineWidth;
		g.beginPath();
		g.arc(x, y, this.matchSize / 2, 0, 360);
		g.fill();
		g.stroke();
	}

	private renderProgressLines(g: CanvasRenderingContext2D, sx: number, sy: number, ex: number, ey: number, count: number) {
		// center the lines vertically around sy and ey
		var dy = ey - sy;
		var shift = this.lineSeparation * ((count / 2) - 0.5);
		sy -= shift;

		// Find the center horizontal position for bezier curve control points
		var cx = (ex + sx) / 2;

		// Draw the array of curves
		g.strokeStyle = this.lineColor;
		g.lineWidth = this.lineWidth;
		g.beginPath();

		for (var i = 0; i < count; i++) {
			g.moveTo(sx, sy);
			g.bezierCurveTo(cx, sy, cx, sy + dy, ex, sy + dy);

			sy += this.lineSeparation;
		}

		g.stroke();
	}

	private renderSeedNumber(g: CanvasRenderingContext2D, seed: number, x: number, y: number, dir: number) {
		// Align and pad the text
		x += this.textPadding * dir;
		g.textAlign = (dir > 0) ? 'left' : 'right';

		// Draw the text
		g.font = this.font;
		g.fillStyle = this.textColor;
		g.textBaseline = 'middle';
		g.fillText(seed.toString(), x, y);
	}
}

class TournamentTeamSlot implements INodeDepth {
	public seed: number;
	public team: Team;

	constructor() {
		this.seed = 0;
		this.team = null;
	}

	public getDepth(): number {
		return 0;
	}

	public toString(): string {
		return this.seed.toString();
	}
}

class TournamentNode implements INodeDepth {
	public children: any[];

	private maxTeams: number;
	private teamsProgress: number;
	private nextTeamSlot: number;

	constructor(maxTeams: number, teamsProgress: number) {
		this.children = [];

		this.nextTeamSlot = 0;
		this.maxTeams = maxTeams;
		this.teamsProgress = teamsProgress;
	}

	public getDepth(): number {
		var depth = 0;
		this.children.forEach((node: INodeDepth) => {
			depth = Math.max(depth, node.getDepth());
		});

		return depth + 1;
	}

	public fillWithMatches(): TournamentNode[] {
		var newMatches: TournamentNode[] = [];

		// Fill children with as many matches as will fit
		for (var teams = 0; teams < this.maxTeams; teams += this.teamsProgress) {
			var newMatch = new TournamentNode(this.maxTeams, this.teamsProgress);
			this.children.push(newMatch);
			newMatches.push(newMatch);
		}

		return newMatches;
	}

	public fillWithTeamSlots() {
		// Fill children with as many team slots as will fit
		for (var teams = 0; teams < this.maxTeams; teams++) {
			this.children.push(new TournamentTeamSlot());
		}
	}

	public getNextTeamSlot(): TournamentTeamSlot {
		while (this.nextTeamSlot < this.children.length) {
			if (this.children[this.nextTeamSlot] instanceof TournamentTeamSlot) {
				return this.children[this.nextTeamSlot++];
			} else {
				this.nextTeamSlot++;
			}
		}

		return null;
	}

	public isLeafMatch() {
		// If any children are matches, this is not a leaf node
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentNode) {
				return false;
			}
		}

		return true;
	}

	public removeMatch(): boolean {
		if (this.isLeafMatch()) {
			// This match doesn't have any child matches to remove.
			return false;
		}

		// Try to remove a match as deeply as possible in the tree first
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentNode) {
				var child = <TournamentNode>this.children[i];

				if (child.removeMatch()) {
					// If we removed a match from this child, shuffle it to the end of
					// the children list so another match will be checked first next time.
					this.children.push(this.children.shift());
					return true;
				}
			}
		}

		// If we couldn't remove a match from any deeper in the tree, check
		// if any of the child matches can be removed.
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentNode) {
				var child = <TournamentNode>this.children[i];
				
				// If the child is a leaf node, it can be removed.
				if (child.isLeafMatch()) {
					// Replace this match with (this.teamsProgress) team slots
					this.children.splice(i, 1);

					for (var j = 0; j < this.teamsProgress; j++) {
						this.children.push(new TournamentTeamSlot());
					}
					return true;
				}
			}
		}

		// We couldn't find a match to remove
		return false;
	}

	public removeTeamSlot(): boolean {
		if (this.isLeafMatch() && this.children.length > 0) {
			// This match contains only removable matches
			this.children.pop();
			return true;
		}

		// Check to see if this match contains both team slots and child matches.
		// Remove team slots first.
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentTeamSlot) {
				this.children.splice(i, 1);
				return true;
			}
		}

		// Try removing from child matches.
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentNode) {
				var child = <TournamentNode>this.children[i];

				if (child.removeTeamSlot()) {
					// If we removed a slot from this child, shuffle it to the end of
					// the children list so another match will be checked first next time.
					this.children.push(this.children.shift());
					return true;
				}
			}
		}

		// We couldn't find a slot to remove
		return false;
	}

	public removeUnnecessaryMatches(): boolean {
		var removed = false;
		// Search for children that are leaf nodes and all teams in the match
		// will progress regardless of the outcome of the match.
		for (var i = 0; i < this.children.length; i++) {
			if (this.children[i] instanceof TournamentNode) {
				var child: TournamentNode = this.children[i];
				if (child.isLeafMatch()) {
					// Does the result of this match matter?
					if (child.children.length <= this.teamsProgress) {
						// Replace this match with its team slots
						this.children.splice(i, 1);

						for (var j = 0; j < child.children.length; j++) {
							this.children.push(new TournamentTeamSlot());
						}
						
						i -= 1;
						removed = true;
					}
				} else {
					// If the match is not a leaf node, see if it contains any
					// matches to remove.
					if (child.removeUnnecessaryMatches()) {
						removed = true;
					}
				}
			}
		}
		return removed;
	}

	public sortSlots() {
		// Sort team slots before matches
		this.children.sort((a, b) => {
			if (a instanceof TournamentNode && b instanceof TournamentTeamSlot) {
				return 1;
			} else if (a instanceof TournamentTeamSlot && b instanceof TournamentNode) {
				return -1;
			} else {
				return 0;
			}
		});

		// Sort all child matches
		this.children.forEach((child) => {
			if (child instanceof TournamentNode) {
				child.sortSlots();
			}
		});
	}

	public toString(): string {
		return '[' + this.children.map((child) => child.toString()).join(', ') + ']';
	}
}