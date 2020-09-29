/**
 * KeeWeb plugin: local-server
 * @author Marek Vavrecan
 * @license MIT
 */

const Storage = require('storage/index');
const BaseLocale = require('locales/base');
const StorageBase = require('storage/storage-base');
const ModalView = require('views/modal-view');
const Alerts = require('comp/ui/alerts');
const Locale = require('util/locale');
const OpenView = require('views/open-view');

const LocalServerStorage = StorageBase.extend({
    name: 'localServerStorage',
    icon: 'lock',
    enabled: true,
    uipos: 100,
    basePath: '/server.php',

    _prompPassword: function(callback) {
        const config = {
            icon: 'lock',
            header: Locale.serverAccessPrompt,
            body: '<input required class="input-base storage__server-password" style="width:100%" type="password" />',
            buttons: [
                Alerts.buttons.cancel,
                Alerts.buttons.ok
            ]
        };

        const that = this;
        const view = new ModalView({ model: config });
        view.render();
        view.on('result', (res, check) => {
            const save = Alerts.buttons.ok.result === res;
            if (save) {
                const password = view.$el.find('.storage__server-password')[0].value;
                that.appSettings.set('serverPassword', password);
            }

            if (callback) {
                callback(save);
            }
        });
    },

    list: function(dir, callback) {
        this._request({
            op: 'List',
            method: 'GET',
            nostat: true,
            params: {
                path: '.'
            }
        }, callback ? (err, xhr, stat) => {
            callback(err, xhr.response, stat);
        } : null);
    },

    load: function(path, opts, callback) {
        this._request({
            op: 'Load',
            method: 'GET',
            responseType: 'arraybuffer',
            params: {
                file: path
            }
        }, callback ? (err, xhr, stat) => {
            callback(err, xhr.response, stat);
        } : null);
    },

    stat: function(path, opts, callback) {
        this._request({
            op: 'Stat',
            method: 'GET',
            params: {
                stat: path
            }
        }, callback ? (err, xhr, stat) => {
            callback(err, stat);
        } : null);
    },

    save: function(path, opts, data, callback, rev) {
        const cb = function(err, xhr, stat) {
            if (callback) {
                callback(err, stat);
                callback = null;
            }
        };

        this._request({
            op: 'Save', method: 'POST',
            params: {
                save: path,
                rev: rev
            },
            data: data
        }, (err, xhr, stat) => {
            cb(err, xhr, stat);
        });
    },

    fileOptsToStoreOpts: function(opts, file) {
        const result = {user: opts.user, encpass: opts.encpass};
        if (opts.password) {
            const fileId = file.get('uuid');
            const password = opts.password;
            let encpass = '';
            for (let i = 0; i < password.length; i++) {
                encpass += String.fromCharCode(password.charCodeAt(i) ^ fileId.charCodeAt(i % fileId.length));
            }
            result.encpass = btoa(encpass);
        }
        return result;
    },

    storeOptsToFileOpts: function(opts, file) {
        const result = {user: opts.user, password: opts.password};
        if (opts.encpass) {
            const fileId = file.get('uuid');
            const encpass = atob(opts.encpass);
            let password = '';
            for (let i = 0; i < encpass.length; i++) {
                password += String.fromCharCode(encpass.charCodeAt(i) ^ fileId.charCodeAt(i % fileId.length));
            }
            result.password = password;
        }
        return result;
    },

    _request: function(config, callback) {
        const that = this;
        that.logger.debug(config.op, this.basePath);

        const ts = that.logger.ts();
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if ([200, 201, 204].indexOf(xhr.status) < 0) {
                that.logger.debug(config.op + ' error', this.basePath, xhr.status, that.logger.ts(ts));
                let err;
                switch (xhr.status) {
                    case 404:
                        err = { notFound: true };
                        break;
                    case 412:
                        err = { revConflict: true };
                        break;
                    case 401:
                        err = { unauthorized: true };
                        break;
                    default:
                        err = 'HTTP status ' + xhr.status;
                        break;
                }

                // try authorizing
                if (err && err.unauthorized) {
                    this._prompPassword((retry) => {
                        if (retry) {
                            that._request(config, callback);
                        } else {
                            if (callback) { callback('Not Authorized', xhr); callback = null; }
                        }
                    });
                } else {
                    if (callback) { callback(err, xhr); callback = null; }
                }
                return;
            }
            const rev = xhr.getResponseHeader('Last-Modified');
            if (!rev && !config.nostat) {
                that.logger.debug(config.op + ' error', this.basePath, 'no headers', that.logger.ts(ts));
                if (callback) { callback('No Last-Modified header', xhr); callback = null; }
                return;
            }
            const completedOpName = config.op + (config.op.charAt(config.op.length - 1) === 'e' ? 'd' : 'ed');
            that.logger.debug(completedOpName, this.basePath, rev, that.logger.ts(ts));
            if (callback) { callback(null, xhr, rev ? { rev: rev } : null); callback = null; }
        });
        xhr.addEventListener('error', () => {
            that.logger.debug(config.op + ' error', this.basePath, that.logger.ts(ts));
            if (callback) { callback('network error', xhr); callback = null; }
        });
        xhr.addEventListener('abort', () => {
            that.logger.debug(config.op + ' error', this.basePath, 'aborted', that.logger.ts(ts));
            if (callback) { callback('aborted', xhr); callback = null; }
        });

        let params = '?password=' + that.appSettings.get('serverPassword') || '';
        if (config.params) {
            params += '&' + Object.keys(config.params).map((key) => {
                return key + '=' + encodeURIComponent(config.params[key]);
            }).join('&');
        }
        xhr.open(config.method, this.basePath + params);
        xhr.responseType = config.responseType || 'json';
        //  = 'arraybuffer';

        if (config.headers) {
            _.forEach(config.headers, (value, header) => {
                xhr.setRequestHeader(header, value);
            });
        }
        if (['GET', 'HEAD'].indexOf(config.method) >= 0) {
            xhr.setRequestHeader('Cache-Control', 'no-cache');
        }
        if (config.data) {
            const blob = new Blob([config.data], {type: 'application/octet-stream'});
            xhr.send(blob);
        } else {
            xhr.send();
        }
    }
});


BaseLocale.localServerStorage = 'Local Server Storage';
BaseLocale.serverAccessPrompt = 'Enter password for the server file access';
BaseLocale.serverPassword = 'Server Password';

Storage.localServerStorage = new LocalServerStorage();

const openViewGetDisplayedPath = OpenView.prototype.getDisplayedPath;
OpenView.prototype.getDisplayedPath = function(fileInfo) {
    const storage = fileInfo.get('storage');
    if (storage === 'localServerStorage') {
        return fileInfo.get('path');
    }
    return openViewGetDisplayedPath.apply(this);
};

const openViewGetOpenFile = OpenView.prototype.openFile;
OpenView.prototype.openFile = function() {
    if (this.model.settings.get('localServerStorage')) {
        this.openKeyFileFromLocalServer();
        return;
    }
    openViewGetOpenFile.apply(this);
};

const openViewOpenKeyFile = OpenView.prototype.openKeyFile;
OpenView.prototype.openKeyFile = function(e) {
    if (this.model.settings.get('localServerStorage')) {
        this.openKeyFileFromLocalServer();
        return;
    }
    openViewOpenKeyFile.apply(this);
};

OpenView.prototype.openKeyFileFromLocalServer = function() {
    const icon = this.$el.find('.open__icon-storage[data-storage=localServerStorage]');
    icon.trigger('click');
};

module.exports.uninstall = function() {
    delete BaseLocale.localServerStorage;
    delete Storage.localServerStorage;
    DetailsView.prototype.getDisplayedPath = openViewGetDisplayedPath;
    DetailsView.prototype.openFile = openViewGetOpenFile;
    DetailsView.prototype.openKeyFile = openViewOpenKeyFile;
};

