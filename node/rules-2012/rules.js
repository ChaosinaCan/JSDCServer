var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jsdc = require('../jsdc')
var clock = require('../clock')
var TimedEvent = clock.TimedEvent;
var GameRules = (function (_super) {
    __extends(GameRules, _super);
    function GameRules(game, api, cue) {
        _super.call(this, game, api, cue);
        this.cues = {
            'All Off': 1,
            'Setup': 2,
            'Reset': 2.1,
            'Match': 10,
            'Start Match': 10.1,
            'End Match': 10.2,
            'Steal Period': 11,
            'Bridge Center': 'p2 cue 100 go',
            'Bridge Left': 'p2 cue 100.1 go',
            'Bridge Right': 'p2 cue 100.2 go',
            'Enable Bridge': 'p2 cue 101 go',
            'Disable Bridge': 'p2 cue 101.1 go',
            'Emergency': 911,
            'King of the Hill': {
                1: 20.1,
                2: 20.2,
                3: 20.3,
                4: 20.4
            }
        };
        this.actions = {
            'Control Hill': 9,
            'Capture Hill': 10
        };
        this.audio.add({
            start: 'start_bell.ogg',
            stop: 'buzzer.ogg',
            alarm: 'red_alert.ogg',
            endperiod: 'transfer_complete.ogg',
            oneminute: 'one_minute.ogg',
            emergency: 'emergency.ogg'
        });
        game.config.duration = 7 * 60;
        game.config.events = [
            new TimedEvent(3 * 60, this.startStealPeriod), 
            new TimedEvent(3 * 60 + 0.5, this.resendKingCue), 
            new TimedEvent(3 * 60 + 30, this.endStealPeriod), 
            new TimedEvent(3 * 60 + 30.5, this.resendKingCue), 
            new TimedEvent(game.config.duration - 60, this.audio.play, 'oneminute'), 
            new TimedEvent(6 * 60 + 30, this.startStealPeriod), 
            new TimedEvent(6 * 60 + 30.5, this.resendKingCue)
        ];
    }
    GameRules.prototype.startStealPeriod = function () {
        this.game.emit('start period', {
            period: 'Steal Period'
        });
        this.audio.play('alarm');
        this.audio.stop('endperiod');
        this.sendCue('Steal Period');
        console.log('Steal period started');
    };
    GameRules.prototype.endStealPeriod = function () {
        this.game.emit('end period', {
            period: 'Steal Period'
        });
        this.audio.play('endperiod');
        this.audio.stop('alarm');
        this.sendCue('Match');
        console.log('Steal period ended');
    };
    GameRules.prototype.resendKingCue = function () {
        if(this.currentKing != 0) {
            this.sendCue('King of the Hill.' + this.currentKingColor);
        }
    };
    GameRules.prototype.onStart = function () {
        this.currentKing = 0;
        this.currentKingColor = 0;
        this.audio.play('start');
        this.sendCue('Start Match');
    };
    GameRules.prototype.onResume = function () {
        this.audio.play('start');
    };
    GameRules.prototype.onStop = function () {
        this.audio.play('stop');
        this.sendCue('End Match');
    };
    GameRules.prototype.onGameover = function () {
        console.log('Game Over.');
        if(this.currentKing != 0) {
            this.sendScore('Capture Hill', this.currentKing, function (err, response) {
                if(err) {
                    console.log('Failed to update king of the hill score.');
                    console.log(err);
                } else {
                    console.log('King of the hill captured by team ' + response.onTeamId);
                }
            });
        }
    };
    GameRules.prototype.onReset = function () {
        this.sendCue('Reset');
    };
    GameRules.prototype.onEmergency = function () {
        this.sendCue('Emergency');
    };
    GameRules.prototype.onDisableBridge = function () {
        console.log('Bridge disabled.');
        this.sendCue('Disable Bridge');
    };
    GameRules.prototype.onEnableBridge = function () {
        console.log('Bridge Enabled.');
        this.sendCue('Enable Bridge');
    };
    GameRules.prototype.onSwitchBridge = function (data) {
        var c = null;
        switch(data.position) {
            case 'left':
                c = 'Bridge Left';
                break;
            case 'right':
                c = 'Bridge Right';
                break;
            case 'center':
                c = 'Bridge Center';
                break;
            default:
                console.log('Bridge switching cancelled. Position "' + data.position + '" is undefined.');
                return;
        }
        this.sendCue(c);
    };
    GameRules.prototype.onKing = function (data) {
        this.sendEvent('king', data);
    };
    GameRules.prototype.onGameKing = function (data) {
        this.currentKing = data.team;
        this.currentKingColor = data.color;
        console.log('Team ' + this.currentKing + ' controls the hill');
        this.sendCue('King of the Hill.' + data.color);
    };
    return GameRules;
})(jsdc.GameRules);
exports.GameRules = GameRules;
