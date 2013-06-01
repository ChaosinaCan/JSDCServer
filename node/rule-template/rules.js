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
        game.config.duration = 7 * 60;
        game.config.events = [];
        this.cues = {
            'Emergency': 911
        };
        this.actions = {
        };
        this.audio.add({
        });
    }
    GameRules.prototype.onStart = function () {
    };
    GameRules.prototype.onPause = function () {
    };
    GameRules.prototype.onResume = function () {
    };
    GameRules.prototype.onStop = function () {
    };
    GameRules.prototype.onGameover = function () {
    };
    GameRules.prototype.onAbort = function () {
    };
    GameRules.prototype.onReset = function () {
    };
    GameRules.prototype.onEmergency = function () {
        this.sendCue('Emergency');
    };
    GameRules.prototype.onGameSpecialEvent = function (data) {
    };
    return GameRules;
})(jsdc.GameRules);
exports.GameRules = GameRules;
