var __extends = this.__extends || function (d, b) {
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var jsdc = require('../jsdc')
var events = require('../events')
var PowerSource = (function (_super) {
    __extends(PowerSource, _super);
    function PowerSource(territory, moveable) {
        _super.call(this);
        this.territory = territory;
        this._moveable = !!(moveable || false);
    }
    Object.defineProperty(PowerSource.prototype, "territory", {
        get: function () {
            return this._territory;
        },
        set: function (value) {
            if(this._territory === value) {
                return;
            }
            if(value && value.powerSource) {
                throw new Error('Territory ' + value.id + ' already has a power source');
            }
            var oldTerritory = this._territory;
            this._territory = value;
            if(oldTerritory) {
                oldTerritory.powerSource = null;
            }
            if(this._territory) {
                this._territory.powerSource = this;
            }
            this.emit('territory changed', this);
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(PowerSource.prototype, "moveable", {
        get: function () {
            return this._moveable;
        },
        enumerable: true,
        configurable: true
    });
    return PowerSource;
})(events.BaseEventEmitter);
exports.PowerSource = PowerSource;
var Territory = (function (_super) {
    __extends(Territory, _super);
    function Territory(field, id, x, y, width, height) {
        _super.call(this);
        this.warningTime = 3000;
        jsdc.bindMemberFunctions(this);
        this.field = field;
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width || 1;
        this.height = height || 1;
        this.holdTime = 10;
        this.ownerTeam = 0;
        this.neighbors = [];
        this._invalidated = true;
        this._powered = false;
        this._scoringTimer = null;
        this._warningTimer = null;
        this._lastScoringTime = -1;
        this._elapsedScoringTime = 0;
    }
    Object.defineProperty(Territory.prototype, "ownerTeam", {
        get: function () {
            return this._ownerTeam;
        },
        set: function (id) {
            if(id != this.ownerTeam) {
                this._ownerTeam = id;
                this._sendTeamChanged();
                this.checkPower();
                this.resetScoringTimer();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Territory.prototype, "powerSource", {
        get: function () {
            return this._powerSource;
        },
        set: function (value) {
            if(value != this.powerSource) {
                console.log('source changed for', this.id);
                this._powerSource = value;
                this.emit('source changed', this);
                this.checkPower();
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Territory.prototype, "powered", {
        get: function () {
            if(this._invalidated) {
                this.checkPower();
            }
            return this._powered;
        },
        set: function (value) {
            this._invalidated = false;
            if(value !== this.powered) {
                this._powered = value;
                if(!this._holdEvents) {
                    this._sendPowerChanged();
                    if(value === false) {
                        this.resetScoringTimer();
                    }
                }
            }
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Territory.prototype, "isTimerRunning", {
        get: function () {
            return this._scoringTimer !== null;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(Territory.prototype, "timeUntilScore", {
        get: function () {
            if(this.isTimerRunning) {
                return this.holdTime - (this._lastScoringTime - Date.now()) / 1000;
            } else {
                return this.holdTime - this._elapsedScoringTime;
            }
        },
        enumerable: true,
        configurable: true
    });
    Territory.prototype.holdEvents = function () {
        if(!this._holdEvents) {
            var invalid = this._invalidated;
            this._holdEvents = true;
            this._invalidated = false;
            this._heldPower = this.powered;
            this._invalidated = invalid;
        }
    };
    Territory.prototype.resumeEvents = function () {
        if(this._holdEvents) {
            this._holdEvents = false;
            if(this._heldPower !== this.powered) {
                console.log('changed', this.id, this.powered);
                this._sendPowerChanged();
            }
        }
    };
    Territory.prototype.addNeighbor = function (territory) {
        if(!territory || territory === this) {
            return;
        }
        if(this.neighbors.indexOf(territory) < 0) {
            this.neighbors.push(territory);
        }
        if(territory.neighbors.indexOf(this) < 0) {
            territory.neighbors.push(this);
        }
        this._invalidated = true;
    };
    Territory.prototype.checkPower = function () {
        this.field.checkPower();
    };
    Territory.prototype._sendPowerChanged = function () {
        this.emit('power changed', this);
    };
    Territory.prototype._sendTeamChanged = function () {
        this.emit('team changed', this);
    };
    Territory.prototype._sendTerritoryWarning = function () {
        this.emit('warning', this);
    };
    Territory.prototype._sendTerritoryHeld = function () {
        this._elapsedScoringTime = 0;
        this.startScoringTimer();
        this.emit('held', this);
    };
    Territory.prototype._sendTimerSync = function () {
        this.emit('sync', this);
    };
    Territory.prototype.resetScoringTimer = function () {
        this.stopScoringTimer();
        this._elapsedScoringTime = 0;
        this.startScoringTimer();
    };
    Territory.prototype.startScoringTimer = function () {
        if(this.powered && this.holdTime > 0) {
            this._lastScoringTime = Date.now();
            this._scoringTimer = setTimeout(this._sendTerritoryHeld, this.holdTime - this._elapsedScoringTime);
            if(this.holdTime - this._elapsedScoringTime > this.warningTime) {
                this._warningTimer = setTimeout(this._sendTerritoryWarning, this.holdTime - this._elapsedScoringTime - this.warningTime);
            }
            this._sendTimerSync();
        }
    };
    Territory.prototype.stopScoringTimer = function () {
        this._elapsedScoringTime = Date.now() - this._lastScoringTime;
        clearTimeout(this._scoringTimer);
        clearTimeout(this._warningTimer);
        this._scoringTimer = null;
        this._sendTimerSync();
    };
    return Territory;
})(events.BaseEventEmitter);
exports.Territory = Territory;
var Field = (function (_super) {
    __extends(Field, _super);
    function Field(ids) {
        _super.call(this);
        jsdc.bindMemberFunctions(this);
        this.height = ids.length;
        this.width = ids[0].length;
        this._territories = [];
        this._grid = [];
        this.sources = [];
        this.holdPowerChecks();
        for(var x = 0; x < this.width; x++) {
            this._grid[x] = [];
        }
        for(var y = 0; y < this.height; y++) {
            for(var x = 0; x < this.width; x++) {
                var id = ids[y][x];
                if(id === 0) {
                    this._grid[x][y] = null;
                    continue;
                }
                var node = this.getTerritory(id) || new Territory(this, id, x, y);
                this._territories[id] = node;
                this._grid[x][y] = node;
                if(x > node.x) {
                    node.width = (x - node.x) + 1;
                }
                if(y > node.y) {
                    node.height = (y - node.y) + 1;
                }
                if(x > 0) {
                    node.addNeighbor(this.atPosition(x - 1, y));
                }
                if(y > 0) {
                    node.addNeighbor(this.atPosition(x, y - 1));
                }
            }
        }
        this.attachEventListeners();
        this.resumePowerChecks();
    }
    Object.defineProperty(Field.prototype, "territories", {
        get: function () {
            return this._territories;
        },
        enumerable: true,
        configurable: true
    });
    Field.prototype.attachEventListeners = function () {
        var _this = this;
        this._territories.forEach(function (territory) {
            territory.on('source changed', function (node) {
                return _this.emit('source changed', node);
            });
            territory.on('power changed', function (node) {
                return _this.emit('power changed', node);
            });
            territory.on('team changed', function (node) {
                return _this.emit('team changed', node);
            });
            territory.on('warning', function (node) {
                return _this.emit('warning', node);
            });
            territory.on('held', function (node) {
                return _this.emit('held', node);
            });
            territory.on('sync', function (node) {
                return _this.emit('sync', node);
            });
        });
    };
    Field.prototype.addPowerSource = function () {
        var sources = [];
        for (var _i = 0; _i < (arguments.length - 0); _i++) {
            sources[_i] = arguments[_i + 0];
        }
        this.sources = this.sources.concat(sources);
        this.checkPower();
    };
    Field.prototype.getTerritory = function (id) {
        return this.territories[id] || null;
    };
    Field.prototype.atPosition = function (x, y) {
        return this._grid[x][y] || null;
    };
    Field.prototype.holdPowerChecks = function () {
        this._holdChecks = true;
    };
    Field.prototype.resumePowerChecks = function () {
        this._holdChecks = false;
        this.checkPower();
    };
    Field.prototype.checkPower = function () {
        if(this._holdChecks) {
            return;
        }
        console.log('checking power');
        this.territories.forEach(function (node) {
            node.holdEvents();
            node.powered = false;
        });
        var checked = [];
        var stack = this.sources.map(function (source) {
            return source.territory;
        }).filter(function (source) {
            return !!source;
        });
        while(stack.length !== 0) {
            var node = stack.pop();
            if(checked.indexOf(node.id) >= 0) {
                continue;
            }
            if(node.ownerTeam === 0) {
                continue;
            }
            node.powered = true;
            checked.push(node.id);
            node.neighbors.forEach(function (neighbor) {
                if(neighbor.ownerTeam === node.ownerTeam && checked.indexOf(neighbor.id) < 0) {
                    stack.push(neighbor);
                }
            });
        }
        this.territories.forEach(function (node) {
            return node.resumeEvents();
        });
    };
    Field.prototype.reset = function () {
        this.territories.forEach(function (node) {
            node.ownerTeam = 0;
            node.powered = false;
            node.resetScoringTimer();
        });
    };
    Field.prototype.resetScoringTimers = function () {
        this.territories.forEach(function (node) {
            return node.resetScoringTimer();
        });
    };
    Field.prototype.startScoringTimers = function () {
        this.territories.forEach(function (node) {
            return node.startScoringTimer();
        });
    };
    Field.prototype.stopScoringTimers = function () {
        this.territories.forEach(function (node) {
            return node.stopScoringTimer();
        });
    };
    return Field;
})(events.BaseEventEmitter);
exports.Field = Field;
