/*
 * ServerStatus.js
 * Copyright (C) 2021 Callum McColl <Callum McColl@callum.local>
 *
 * Distributed under terms of the MIT license.
 */

'use strict';

module.exports = class ServerStatus {

    constructor(ip, serverStatus, userStatus, favicon, players) {
        this.ip = ip;
        this.serverStatus = serverStatus;
        this.userStatus = userStatus;
        this.favicon = favicon;
        this.players = players;
    }

    online() {
        return this.statusType == 'PLAYING';
    }

    offline() {
        return !this.online();
    }

    ping(err, res) {
        const lastServerStatus = this.serverStatus;
        const lastStatusType = this.statusType;
        const lastUserStatus = this.userStatus;
        if (!(typeof err === 'undefined' || err === null)) {
            // Server is offline.
            this.serverStatus = '🚫' + this.ip;
            this.statusType = 'WATCHING';
            this.userStatus = 'dnd';
            this.players = [];
        } else if (res.players && (typeof res.players.online !== 'undefined') && (typeof res.players.max !== 'undefined')) {
            // Server is running.
            this.serverStatus = res.players.online + ' / ' + res.players.max + ' - ' + this.ip;
            this.statusType = 'PLAYING';
            this.userStatus = res.players.online == 0 ? 'idle' : 'online';
            if (res.players.sample && (typeof res.players.sample !== 'undefined')) {
                this.players = res.players.sample.map(player => player.name).sort();
            } else {
                this.players = [];
            }
        } else {
            // Server is still launching.
            this.serverStatus = '🚀' + this.ip;
            this.statusType = 'WATCHING';
            this.userStatus = 'idle';
            this.players = [];
        }
        if (res) {
            this.favicon = res.favicon;
        }
        return lastServerStatus != this.serverStatus
            || lastStatusType != this.statusType
            || lastUserStatus != this.userStatus;
    }

}
