var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jsdc = require('../jsdc')
var clock = require('../clock')
var field = require('./field')
var TimedEvent = clock.TimedEvent;
var NumSources = 4;
var NumBatteries = 2;
var TerritoryHoldTime = 10 * 1000;
var ControlPointHoldTime = 10 * 1000;
var grid = [
    [
        1, 
        9, 
        9, 
        10, 
        10, 
        0, 
        11, 
        11, 
        12, 
        12, 
        2
    ], 
    [
        13, 
        14, 
        14, 
        0, 
        15, 
        16, 
        17, 
        0, 
        18, 
        19, 
        20
    ], 
    [
        13, 
        21, 
        21, 
        22, 
        23, 
        6, 
        24, 
        25, 
        18, 
        19, 
        20
    ], 
    [
        26, 
        0, 
        27, 
        61, 
        62, 
        62, 
        63, 
        63, 
        28, 
        0, 
        29
    ], 
    [
        26, 
        30, 
        31, 
        61, 
        64, 
        65, 
        66, 
        67, 
        32, 
        33, 
        29
    ], 
    [
        0, 
        34, 
        5, 
        68, 
        69, 
        0, 
        70, 
        67, 
        7, 
        35, 
        0
    ], 
    [
        36, 
        37, 
        38, 
        68, 
        71, 
        72, 
        73, 
        74, 
        39, 
        40, 
        41
    ], 
    [
        36, 
        0, 
        42, 
        75, 
        75, 
        76, 
        76, 
        74, 
        43, 
        0, 
        41
    ], 
    [
        44, 
        45, 
        46, 
        47, 
        48, 
        8, 
        49, 
        50, 
        51, 
        51, 
        52
    ], 
    [
        44, 
        45, 
        46, 
        0, 
        53, 
        54, 
        55, 
        0, 
        56, 
        56, 
        52
    ], 
    [
        4, 
        57, 
        57, 
        58, 
        58, 
        0, 
        59, 
        59, 
        60, 
        60, 
        3
    ], 
    
];
var styles = [
    [
        's', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        'j', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        's'
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        'o', 
        ' ', 
        ' ', 
        ' ', 
        'o', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        'p', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        ' ', 
        'o', 
        ' ', 
        '^', 
        '-', 
        '-', 
        '-', 
        '>', 
        ' ', 
        'o', 
        ' '
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        '-', 
        '-', 
        '-', 
        '-', 
        '-', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        'o', 
        ' ', 
        'p', 
        '-', 
        '-', 
        '*', 
        '-', 
        '-', 
        'p', 
        ' ', 
        'a'
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        '-', 
        '-', 
        '-', 
        '-', 
        '-', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        ' ', 
        'o', 
        ' ', 
        '<', 
        '-', 
        '-', 
        '-', 
        'v', 
        ' ', 
        'o', 
        ' '
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        'p', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        ' ', 
        ' ', 
        ' ', 
        'o', 
        ' ', 
        ' ', 
        ' ', 
        'o', 
        ' ', 
        ' ', 
        ' '
    ], 
    [
        's', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        'o', 
        ' ', 
        ' ', 
        ' ', 
        ' ', 
        's'
    ], 
    
];
var GameRules = (function (_super) {
    __extends(GameRules, _super);
    function GameRules(game, api, cue) {
        _super.call(this, game, api, cue);
        game.config.duration = 7 * 60;
        game.config.events = [
            new TimedEvent(0, this.sendCue, 'no spin'), 
            new TimedEvent(60, this.sendCue, 'spin'), 
            new TimedEvent(3.5 * 60, this.sendCue, 'no spin'), 
            new TimedEvent(3.5 * 60, this.audio.play, 'alarm'), 
            new TimedEvent(4 * 60, this.sendCue, 'spin'), 
            new TimedEvent(game.config.duration - 60, this.audio.play, 'oneminute'), 
            new TimedEvent(game.config.duration - 30, this.sendCue, 'no spin'), 
            new TimedEvent(game.config.duration - 30, this.audio.play, 'alarm'), 
            
        ];
        this.cues = {
            'field reset': 1,
            'spin': 20,
            'no spin': 20.1,
            'emergency': 911,
            'wall up': {
                5: 10.5,
                6: 10.6,
                7: 10.7,
                8: 10.8
            },
            'wall down': {
                5: 11.5,
                6: 11.6,
                7: 11.7,
                8: 11.8
            },
            'reset control points': 110,
            'control point': {
                5: {
                    1: 105.1,
                    2: 105.2,
                    3: 105.3,
                    4: 105.4
                },
                6: {
                    1: 106.1,
                    2: 106.2,
                    3: 106.3,
                    4: 106.4
                },
                7: {
                    1: 107.1,
                    2: 107.2,
                    3: 107.3,
                    4: 107.4
                },
                8: {
                    1: 108.1,
                    2: 108.2,
                    3: 108.3,
                    4: 108.4
                }
            }
        };
        this.actions = {
            'action': 1,
            'hold territory': 2,
            'hold control point': 3,
            'take control point': 4,
            'gameover territory': 5,
            'hold upper territory': 6
        };
        this.audio.add({
            start: 'start_bell.ogg',
            stop: 'buzzer.ogg',
            alarm: 'red_alert.ogg',
            endperiod: 'transfer_complete.ogg',
            oneminute: 'one_minute.ogg',
            emergency: 'emergency.ogg'
        });
    }
    GameRules.prototype.initializeGame = function () {
        var _this = this;
        this.field = new field.Field(grid);
        this.field.holdPowerChecks();
        this.field.addListener('team changed', this._onTerritoryUpdate);
        this.field.addListener('team changed', this._onControlPointTaken);
        this.field.addListener('source changed', this._onBatteryUpdate);
        this.field.addListener('power changed', this._onTerritoryUpdate);
        this.field.addListener('power changed', this._onPowerChanged);
        this.field.addListener('held', this._onTerritoryScored);
        this.field.addListener('warning', this._onTerritoryWarning);
        this.sources = [];
        this.batteries = [];
        this.sources[0] = new field.PowerSource(this.field.getTerritory(1), false);
        this.sources[1] = new field.PowerSource(this.field.getTerritory(2), false);
        this.sources[2] = new field.PowerSource(this.field.getTerritory(3), false);
        this.sources[3] = new field.PowerSource(this.field.getTerritory(4), false);
        this.batteries[0] = new field.PowerSource(this.field.getTerritory(34), true);
        this.batteries[1] = new field.PowerSource(this.field.getTerritory(35), true);
        new BatteryBox(this.batteries[0], this, '192.168.1.120');
        new BatteryBox(this.batteries[1], this, '192.168.1.121');
        this.field.territories.forEach(function (node) {
            if(node.id <= 4) {
                node.holdTime = -1;
            } else if(node.id <= 8) {
                node.holdTime = ControlPointHoldTime;
            } else {
                node.holdTime = TerritoryHoldTime;
            }
        });
        this.field.getTerritory(1).ownerTeam = 0;
        this.field.getTerritory(2).ownerTeam = 0;
        this.field.getTerritory(3).ownerTeam = 0;
        this.field.getTerritory(4).ownerTeam = 0;
        this.homeTerritories = {
            'red': this.field.getTerritory(3),
            'yellow': this.field.getTerritory(4),
            'blue': this.field.getTerritory(2),
            'green': this.field.getTerritory(1)
        };
        this._teams = {
        };
        this.game.teams.forEach(function (team, i) {
            var initBatteries = [];
            for(var i = 0; i < _this.batteries.length; i++) {
                initBatteries.push(false);
            }
            _this.homeTerritories[_this.getColor(team.colorId)].ownerTeam = team.teamId;
            _this.setTeamStatus(team.teamId, {
                team: team,
                territories: 0,
                controlPoints: 0,
                batteries: initBatteries
            });
        });
        this.field.addPowerSource(this.sources[0], this.sources[1], this.sources[2], this.sources[3], this.batteries[0], this.batteries[1]);
        this.field.resumePowerChecks();
        this.controlPointsOwned = {
        };
        for(var i = 5; i <= 8; i++) {
            this.controlPointsOwned[i.toString()] = false;
        }
    };
    GameRules.prototype.getTeamStatus = function (team) {
        return this._teams[team.toString()];
    };
    GameRules.prototype.setTeamStatus = function (team, status) {
        this._teams[team.toString()] = status;
    };
    GameRules.prototype.getBatteryId = function (battery) {
        for(var i = 0; i < this.batteries.length; i++) {
            if(battery === this.batteries[i]) {
                return i;
            }
        }
        return -1;
    };
    GameRules.prototype.getTerritoryStatus = function (territory) {
        return {
            id: territory.id,
            owner: territory.ownerTeam,
            powered: territory.powered
        };
    };
    GameRules.prototype.getTeamStatusArray = function () {
        var teams = [];
        for(var key in this._teams) {
            if(this._teams.hasOwnProperty(key)) {
                teams.push(this._teams[key]);
            }
        }
        return teams;
    };
    GameRules.prototype.getFieldStatusArray = function () {
        return this.field.territories.map(this.getTerritoryStatus).filter(function (territory) {
            return territory.id != 0;
        });
    };
    GameRules.prototype.getBatteryStatusArray = function () {
        return this.batteries.map(function (bat, i) {
            return {
                id: i,
                owner: bat.territory ? bat.territory.ownerTeam : 0,
                territory: bat.territory ? bat.territory.id : 0
            };
        });
    };
    GameRules.prototype.getStatus = function () {
        return {
            teams: this.getTeamStatusArray(),
            field: this.getFieldStatusArray(),
            batteries: this.getBatteryStatusArray()
        };
    };
    GameRules.prototype._onTerritoryUpdate = function (node) {
        this.sendEvent('territory update', this.getTerritoryStatus(node));
    };
    GameRules.prototype._onBatteryUpdate = function () {
        this.sendEvent('battery update', this.getBatteryStatusArray());
    };
    GameRules.prototype._onTerritoryScored = function (node) {
        this.sendEvent('territory scored', 'field', node.id);
        var action = (node.id <= 8) ? 'hold control point' : ((node.id > 60) ? 'hold upper territory' : 'hold territory');
        this.sendScore(action, node.ownerTeam, function (err) {
            if(err) {
                console.log('Failed to score territory ' + node.id + ' for team ' + node.ownerTeam + ': ' + err);
            }
        });
    };
    GameRules.prototype._onTerritoryWarning = function (node) {
        this.sendEvent('territory warning', 'field', node.id);
    };
    GameRules.prototype._onControlPointTaken = function (node) {
        if(node.id >= 5 && node.id <= 8) {
            if(node.ownerTeam && !this.controlPointsOwned[node.id.toString()]) {
                this.controlPointsOwned[node.id.toString()] = true;
                this.sendScore('take control point', node.ownerTeam, function (err, id) {
                    if(err) {
                        console.log('Failed to score first capture of control point ' + node.id + ' for team ' + node.ownerTeam + ': ' + err);
                    }
                });
            }
            this.sendCue('control point.' + node.id + '.' + this.getTeamStatus(node.ownerTeam).team.colorId);
        }
    };
    GameRules.prototype._onPowerChanged = function (node) {
    };
    GameRules.prototype.onMatchChanged = function () {
        if(this.rulesLoaded) {
            this.initializeGame();
        } else {
            setTimeout(this.onMatchChanged, 100);
        }
    };
    GameRules.prototype.onStart = function () {
        this.audio.play('start');
        this.field.startScoringTimers();
        this.sendCue('reset control points');
    };
    GameRules.prototype.onPause = function () {
        this.field.stopScoringTimers();
    };
    GameRules.prototype.onResume = function () {
        this.audio.play('start');
        this.field.startScoringTimers();
    };
    GameRules.prototype.onStop = function () {
        this.audio.play('stop');
        this.field.stopScoringTimers();
        this.sendCue('no spin');
    };
    GameRules.prototype.onGameover = function () {
        var _this = this;
        this.field.territories.forEach(function (territory) {
            if(territory.powered && territory.ownerTeam && territory.id > 4) {
                _this.sendScore('gameover territory', territory.ownerTeam, function (err) {
                    if(err) {
                        console.log('Failed to score territory ' + territory.id + ' for team ' + territory.ownerTeam + ' at match end.');
                    }
                });
            }
        });
    };
    GameRules.prototype.onAbort = function () {
    };
    GameRules.prototype.onReset = function () {
        this.sendCue('field reset');
    };
    GameRules.prototype.onEmergency = function () {
        this.sendCue('emergency');
    };
    GameRules.prototype.onGameTakeTerritory = function (data) {
        console.log('take territory ', data.team, data.territory);
        var team = data.team;
        var territory = this.field.getTerritory(data.territory);
        var neighbors = territory.neighbors;
        var canTake = false;
        if(!this.game.running) {
            console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but match was not running.');
            return;
        }
        if(!territory || territory.id <= 4) {
            console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but it cannot be taken.');
            return;
        }
        if(territory.ownerTeam === team) {
            console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but already owned it.');
            return;
        }
        for(var i = 0; i < neighbors.length; i++) {
            var neighbor = neighbors[i];
            if(neighbor.ownerTeam === team && neighbor.powered) {
                canTake = true;
                break;
            }
        }
        if(!canTake) {
            console.log('Team ' + team + ' attempted to take territory ' + territory.id + ' but was not allowed.');
            return;
        }
        var oldOwner = territory.ownerTeam;
        territory.ownerTeam = team;
        if(territory.id <= 8) {
            this.getTeamStatus(team).controlPoints += 1;
            if(oldOwner) {
                this.getTeamStatus(oldOwner).controlPoints -= 1;
            }
        } else {
            this.getTeamStatus(team).territories += 1;
            if(oldOwner) {
                this.getTeamStatus(oldOwner).territories -= 1;
            }
        }
        if(territory.powerSource) {
            var batteryId = this.getBatteryId(territory.powerSource);
            this.getTeamStatus(team).batteries[batteryId] = true;
            if(oldOwner) {
                this.getTeamStatus(oldOwner).batteries[batteryId] = false;
            }
            console.log('battery taken');
            this._onBatteryUpdate();
        }
    };
    GameRules.prototype.onGamePlaceBattery = function (data) {
        console.log('place battery', data.team, data.battery, data.territory);
        var team = data.team;
        var batteryId = data.battery;
        var battery = this.batteries[batteryId];
        var territory = this.field.getTerritory(data.territory);
        if(battery.territory && battery.territory.ownerTeam !== team) {
            console.log('Team ' + team + ' attempted to move a battery but did not own it.');
            return;
        }
        if(territory && territory.id <= 4) {
            console.log('Team ' + team + ' attempted to place a battery on territory ' + territory.id + ' but it cannot be placed there.');
            return;
        }
        if(territory && territory.powerSource) {
            console.log('Team ' + team + ' attempted to place a battery on territory ' + territory.id + ' but it already had a battery.');
            return;
        }
        var oldTerritory = battery.territory;
        if(!territory) {
            battery.territory = null;
            if(oldTerritory && oldTerritory.ownerTeam) {
                this.getTeamStatus(oldTerritory.ownerTeam).batteries[batteryId] = false;
            }
        } else {
            var oldOwner = territory.ownerTeam;
            territory.ownerTeam = team;
            battery.territory = territory;
            if(team !== oldOwner) {
                territory.resetScoringTimer();
            }
            this.getTeamStatus(territory.ownerTeam).batteries[batteryId] = true;
        }
    };
    GameRules.prototype.onGameGetField = function () {
        var neighbors = {
        };
        this.field.territories.forEach(function (territory) {
            neighbors[territory.id] = territory.neighbors.map(function (neighbor) {
                return neighbor.id;
            });
        });
        var data = {
            grid: grid,
            neighbors: neighbors,
            styles: styles
        };
        this.sendEvent('field', data);
    };
    return GameRules;
})(jsdc.GameRules);
exports.GameRules = GameRules;
var BatteryBox = (function () {
    function BatteryBox(battery, game, address) {
        jsdc.bindMemberFunctions(this);
        this.battery = battery;
        this.game = game;
        this.address = address;
        this.battery.on('territory changed', this.onMove);
        this.game.field.on('team changed', this.onMove);
        this.changeColor('neutral');
    }
    BatteryBox.colors = {
        'red': [
            1023, 
            50, 
            0
        ],
        'blue': [
            0, 
            0, 
            1023
        ],
        'green': [
            0, 
            1023, 
            0
        ],
        'yellow': [
            1023, 
            280, 
            0
        ],
        'neutral': [
            1023, 
            0, 
            400
        ]
    };
    BatteryBox.prototype.onMove = function () {
        var newTeam;
        if(this.battery.territory) {
            newTeam = this.battery.territory.ownerTeam;
        } else {
            newTeam = 0;
        }
        if(newTeam != this.ownerTeam) {
            var color;
            this.ownerTeam = newTeam;
            if(newTeam) {
                color = this.game.getColor(this.game.getTeamStatus(newTeam).team.colorId);
            } else {
                color = 'neutral';
            }
            this.changeColor(color);
        }
    };
    BatteryBox.prototype.changeColor = function (color) {
        var rgb;
        if(arguments.length == 3) {
            rgb = Array.prototype.slice.apply(arguments);
        } else {
            rgb = BatteryBox.colors[color];
        }
        jsdc.ResponseHandler.get(this.address, '?' + jsdc.serialize({
            cmd: 'set',
            r: rgb[0],
            g: rgb[1],
            b: rgb[2]
        }));
    };
    BatteryBox.prototype.enable = function () {
        jsdc.ResponseHandler.get(this.address, '?cmd=on');
    };
    BatteryBox.prototype.disable = function () {
        jsdc.ResponseHandler.get(this.address, '?cmd=off');
    };
    return BatteryBox;
})();
