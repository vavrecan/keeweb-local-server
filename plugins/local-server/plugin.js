/**
 * KeeWeb plugin: local-server
 * @author Marek Vavrecan
 * @license MIT
 */

const BaseLocale = require('locales/base');
const Storage = require('storage/index').Storage;
const StorageBase = require('storage/storage-base').StorageBase;
const OpenView = require('views/open-view').OpenView;
const Alerts = require('comp/ui/alerts').Alerts;

class LocalServerStorage extends StorageBase {
    name = 'localServerStorage';
    icon = 'lock';
    enabled = true;
    uipos = 100;
    scriptPath = '/server.php';

    needShowOpenConfig() {
        return !!this.appSettings.serverRequirePassword;
    }

    getOpenConfig() {
        return {
            fields: [
                {
                    id: 'serverPassword',
                    title: 'serverPassword',
                    desc: 'serverAccessPrompt',
                    value: this.appSettings.serverPassword ? this.appSettings.serverPassword : '',
                    type: 'password'
                }
            ]
        };
    }

    getSettingsConfig() {
        return this.getOpenConfig();
    }

    applySetting(key, value) {
        this.appSettings[key] = value;
    }

    applyConfig(config, callback) {
        this.appSettings["serverPassword"] = config.serverPassword;
        this.appSettings["serverRequirePassword"] = false;
        this.appSettings.save();
        callback();
    }

    stat(path, opts, callback) {
        this._request({
            op: 'Stat',
            method: 'GET',
            params: {
                stat: path ? path : ''
            },
            password: this.appSettings.serverPassword ? this.appSettings.serverPassword : ''
        }, callback ? (err, xhr, stat) => {
            if (err && path) {
                this._showAlertAccess();
            }

            callback(err, stat);
        } : null);
    }

    list(dir, callback) {
        this._request({
            op: 'List',
            method: 'GET',
            nostat: true,
            params: {
                path: '.'
            },
            password: this.appSettings.serverPassword ? this.appSettings.serverPassword : ''
        }, callback ? (err, data) => {
            callback(err, data);
        } : null);
    }

    load(path, opts, callback) {
        this._request({
            op: 'Load',
            method: 'GET',
            responseType: 'arraybuffer',
            params: {
                file: path
            },
            password: this.appSettings.serverPassword ? this.appSettings.serverPassword : ''
        }, callback ? (err, data, stat) => {
            callback(err, data, stat);
        } : null);
    }

    save(path, opts, data, callback, rev) {
        this._request({
            op: 'Save', method: 'POST',
            params: {
                save: path,
                rev: rev
            },
            data: data,
            password: this.appSettings.serverPassword ? this.appSettings.serverPassword : ''
        }, callback ? (err, xhr, stat) => {
            if (err) {
                this._showAlertAccess();
            }

            callback(err, stat);
        } : null);
    }

    _serverRequiresPassword() {
        this.appSettings["serverPassword"] = null;
        this.appSettings["serverRequirePassword"] = true;
        this.appSettings.save();
    }

    _showAlertAccess() {
        // its considered good practice to show some warning to user
        this.alert = Alerts.alert({
            icon: 'ban',
            header: 'Unable to save changes',
            body: 'Check server password in settings',
            buttons: [
                Alerts.buttons.ok
            ],
            success: (result) => {
                this.alert = null;
            }
        });
    }

    _request(config, callback) {
        let scriptPath = this.scriptPath;

        if (this.appSettings.localServerStorageScriptPath) {
            scriptPath = this.appSettings.localServerStorageScriptPath;
        }

        this.logger.debug(config.op, scriptPath);

        const ts = this.logger.ts();
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('load', () => {
            if ([200, 201, 204].indexOf(xhr.status) < 0) {
                this.logger.debug(config.op + ' error', scriptPath, xhr.status, this.logger.ts(ts));
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
                    this._serverRequiresPassword();
                    if (callback) { callback('Not Authorized'); }
                } else {
                    if (callback) { callback(err, xhr.response); }
                }
                return;
            }
            const rev = xhr.getResponseHeader('Last-Modified');
            if (!rev && !config.nostat) {
                this.logger.debug(config.op + ' error', scriptPath, 'no headers', this.logger.ts(ts));
                if (callback) { callback('No Last-Modified header'); }
                return;
            }
            const completedOpName = config.op + (config.op.charAt(config.op.length - 1) === 'e' ? 'd' : 'ed');
            this.logger.debug(completedOpName, scriptPath, rev, this.logger.ts(ts));
            if (callback) { callback(null, xhr.response, rev ? { rev: rev } : null); }
        });
        xhr.addEventListener('error', () => {
            this.logger.debug(config.op + ' error', scriptPath, this.logger.ts(ts));
            if (callback) { callback('network error'); }
        });
        xhr.addEventListener('abort', () => {
            this.logger.debug(config.op + ' error', scriptPath, 'aborted', this.logger.ts(ts));
            if (callback) { callback('aborted'); }
        });

        let params = '';
        if (config.params) {
            params = '?' + Object.keys(config.params).map((key) => {
                return key + '=' + encodeURIComponent(config.params[key]);
            }).join('&');
        }

        xhr.open(config.method, scriptPath + params);
        xhr.responseType = config.responseType || 'json';
        xhr.setRequestHeader("Authorization", config.password);

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
}

BaseLocale.localServerStorage = 'Local Server Storage';
BaseLocale.serverAccessPrompt = 'Enter password for the server file access';
BaseLocale.serverPassword = 'Server password';

Storage.localServerStorage = new LocalServerStorage();

const openViewGetOpenFile = OpenView.prototype.openFile;
OpenView.prototype.openFile = function() {
    if (this.model.settings['localServerStorage']) {
        this.openFileFromLocalServer();
        return;
    }
    openViewGetOpenFile.apply(this);
};

// open key file from local pc
// const openViewOpenKeyFile = OpenView.prototype.openKeyFile;
// OpenView.prototype.openKeyFile = function(e) {
//    if (this.model.settings['localServerStorage']) {
//        this.openFileFromLocalServer();
//        return;
//    }
//    openViewOpenKeyFile.apply(this);
// };

OpenView.prototype.openFileFromLocalServer = function() {
    const icon = this.$el.find('.open__icon-storage[data-storage=localServerStorage]');
    icon.trigger('click');
};

module.exports.uninstall = function() {
    delete BaseLocale.localServerStorage;
    delete Storage.localServerStorage;
    // restore hooks
    OpenView.prototype.openFile = openViewGetOpenFile;

    // open key file from storage
    // OpenView.prototype.openKeyFile = openViewOpenKeyFile;
};

