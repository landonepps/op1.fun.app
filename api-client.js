const JsonApiDataStore = require('jsonapi-datastore').Store;
const ElectronStore = require('electron-store');
const https = require('https');

class ApiClient {
  constructor() {
    this.config = new ElectronStore();
    this.store = new JsonApiDataStore();
  }

  token() {
    return this.config.get('token');
  }

  email() {
    return this.config.get('email');
  }

  logIn(email, password, callback) {
    const me = this;
    this.config.set('email', email);
    const req = https.request({
      method: 'POST',
      host: 'api.op1.fun',
      path: '/v1/api_token',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function(res) {
      let body = '';
      res.on('data', function(d) {
        body += d;
      });
      res.on('end', function() {
        const res = JSON.parse(body);
        if (res.api_token) {
          me.config.set('token', res.api_token);
        }
        me.enableAppFeatureFlag();
        callback(res);
      });
    });
    req.write(JSON.stringify({email: email, password: password}));
    req.end();
  }

  enableAppFeatureFlag() {
    this._post('feature_flags', {flags: {app: true}}, function() {});
  }

  logOut(callback) {
    this.config.set('email', null);
    this.config.set('token', null);
    callback();
  }

  isLoggedIn() {
    return (this.email() && this.token());
  }

  getPack(path, id, callback) {
    const me = this;
    this._get(path, function() {
      const pack = me.store.find('packs', id);
      callback(pack);
    });
  }

  getPatch(path, id, callback) {
    const me = this;
    this._get(path, function() {
      const patch = me.store.find('patches', id);
      callback(patch);
    });
  }

  _get(path, callback) {
    const me = this;
    return https.get({
      host: 'api.op1.fun',
      path: '/v1/' + path,
      headers: {
        'X-User-Email': this.email(),
        'X-User-Token': this.token()
      }
    }, function(res) {
      let body = '';
      res.on('data', function(d) {
        body += d;
      });
      res.on('end', function() {
        me.store.sync(JSON.parse(body));
        callback();
      });
    });
  }

  _post(path, data, callback) {
    const req = https.request({
      method: 'POST',
      host: 'api.op1.fun',
      path: '/v1/' + path,
      headers: {
        'X-User-Email': this.email(),
        'X-User-Token': this.token(),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }, function(res) {
      let body = '';
      res.on('data', function(d) {
        body += d;
      });
      res.on('end', function() {
        callback(body);
      });
    });
    console.log(data);
    console.log(JSON.stringify(data));
    req.write(JSON.stringify(data));
    req.end();
  }
}

module.exports = ApiClient;
