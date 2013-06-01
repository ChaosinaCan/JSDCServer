
interface APIError {
	status: number;
	statusText: string;
	message: string;
}



interface Action {
	actionId: number;
	fromValue: number;
	onValue: number;
	name: string;
}

interface ActionCreateParams {
	name: string;
	fromvalue: number;
	onvalue: number;
}

interface ActionUpdateParams {
	id: number;
	newid?: number;
	name?: string;
	fromvalue?: number;
	onvalue?: number;
}



interface Color {
	colorId: number;
	name: string;
}

interface ColorUpdateParams {
	id: number;
	newid?: number;
	name?: string;
}



interface Foul {
	foulId: number;
	name: string;
	value: number;
}

interface FoulCreateParams {
	name: string;
	value: number;
}

interface FoulUpdateParams {
	id: number;
	newid?: number;
	name?: string;
	value?: number;
}



interface Match {
	matchId: number;
	open: bool;
	status: string;
	roundNum: number;
	matchNum: number;
	teams?: Team[];
}

interface MatchQuery {
	all?: bool;
	current?: bool;
	id?: number;
	open?: bool;
	status?: string;
	round?: number;
	match?: number;
}

interface MatchCreateTeamParams {
	teamId: number;
	colorId: number;
}

interface MatchCreateParams {
	open?: bool;
	status?: string;
	round: number;
	match: number;
	teams: MatchCreateTeamParams[];
}

interface MatchUpdateParams {
	id: number;
	open?: bool;
	status?: string;
	round?: number;
	match?: number;
	teams?: MatchCreateTeamParams[];
}



interface MatchResult {
	id: number;
	teamId: number;
	matchId: number;
	score: number;
	fouls: number;
	disabled: bool;
	disqualified: bool;
}

interface MatchResultQuery {
	all?: bool;
	current?: bool;
	match?: number;
	team?: number;
}

interface MatchResultUpdateParams {
	match?: number;
	team?: number;
}



interface Score {
	id: number;
	matchId: number;
	fromTeamId: number;
	onTeamId: number;
	actionId: number;
	foulId: number;
	disabled: bool;
	disqualified: bool;
	apiId: number;
	dateTime?: string;
}

interface ScoreQuery {
	all?: bool;
	current?: bool;
	match?: number;
	team?: number;
}

interface ScoreCreateParams {
	match: number;
	from: number;
	on: number;
	action?: number;
	foul?: number;
	disqualified?: bool;
	disabled?: bool;
	apikey?: string;
}

interface ScoreUpdateParams {
	id: number;
	match?: number;
	from?: number;
	on?: number;
	action?: number;
	foul?: number;
	datetime?: string;
	disabled?: bool;
	disqualified?: bool;
}



interface Team {
	teamId: number;
	colorId?: number;
	name: string;
	university: string;
	bio?: string;
	imageName: string;
	registrationDate?: string;
}

interface TeamCreateParams {
	name: string;
	bio: string;
	university: string;
	imagename?: string;
	imagedata?: string;
}

interface TeamUpdateParams {
	id: number;
	
}


interface User {
	userId: number;
	username: string;
	password: string;
	email: string;
	fullname: string;
	ip?: string;
	pId: number;
}




interface ColorMap {
	[key: string]: Color;
}

interface ActionMap {
	[key: string]: Action;
}

interface FoulMap {
	[key: string]: Foul;
}

interface TeamMap {
	[key: string]: Team;
}
