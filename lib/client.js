'use strict';

const crypto = require('crypto');
const Promise = require('bluebird');
const request = require('request');
const Boom = require('boom');

const PATH_PREFIX = '/v2';

class Client {
	// spec.bus *optional
	// spec.baseUrl *required
	// spec.apiKey *required
	// spec.secretKey *required
	constructor(spec) {
		// The bus is optional, so you need to check for it before
		// using it.
		this.bus = spec.bus || null;

		this.baseUrl = spec.baseUrl;
		this.apiKey = spec.apiKey;
		this.secretKey = spec.secretKey;

		this.getLabels = this.getLabels.bind(this);
		this.getLabel = this.getLabel.bind(this);
		this.getChildLabels = this.getChildLabels.bind(this);
		this.getAssetsByLabel = this.getAssetsByLabel.bind(this);
	}

	getLabels() {
		const path = `${PATH_PREFIX}/labels`;
		return this.makeRequeset({path}).then(body => {
			return body.items;
		});
	}

	// args.labelId
	getLabel(args) {
		const id = args.labelId;
		if (!id || typeof id !== 'string') {
			throw new Error('getLabel() labelId is required');
		}
		const path = `${PATH_PREFIX}/labels/${id}`;
		return this.makeRequeset({path});
	}

	// args.labelId
	getChildLabels(args) {
		const id = args.labelId;
		if (!id || typeof id !== 'string') {
			throw new Error('getChildLabels() labelId is required');
		}
		const path = `${PATH_PREFIX}/labels/${id}/children`;
		return this.makeRequeset({path}).then(body => {
			return body.items;
		});
	}

	// args.labelId
	getAssetsByLabel(args) {
		const id = args.labelId;
		if (!id || typeof id !== 'string') {
			throw new Error('getAssetsByLabel() labelId is required');
		}
		const path = `${PATH_PREFIX}/labels/${id}/assets`;
		return this.makeRequeset({path}).then(body => {
			return body.items;
		});
	}

	// args.assetId
	getAsset(args) {
		const id = args.assetId;
		if (!id || typeof id !== 'string') {
			throw new Error('getAsset() assetId is required');
		}
		const path = `${PATH_PREFIX}/assets/${id}`;
		return this.makeRequeset({path});
	}

	// args.path
	makeRequeset(args) {
		const method = 'GET';
		const path = args.path;
		const query = {
			api_key: this.apiKey, // eslint-disable-line camelcase
			expires: (60 + Math.floor(Date.now() / 1000)).toString()
		};

		const signature = Client.generateSignature({
			secretKey: this.secretKey,
			method, path,
			query
		});

		const qs = Object.assign({}, query, {signature});
		const url = `${this.baseUrl}${path}`;

		return Client.request({method, url, qs});
	}

	static request(params) {
		return new Promise((resolve, reject) => {
			request(params, (err, res, body) => {
				if (err) {
					return reject(err);
				}

				if (res.statusCode === 404) {
					return resolve(null);
				}

				const isJson = /^application\/json/.test(res.headers['content-type']);

				let data = {};
				if (isJson && typeof body === 'string') {
					try {
						data = resolve(JSON.parse(body));
					} catch (err) {
						return reject(new Error(
							`Ooyala client JSON parsing error: ${err.message}`
						));
					}
				} else if (isJson) {
					return reject(new Error(
						'Ooyala client received an empty application/json body'
					));
				} else {
					return reject(new Error(
						'Ooyala client expects content-type to be application/json'
					));
				}

				if (res.statusCode !== 200) {
					return reject(Boom.create(res.statusCode, res.statusMessage, data));
				}

				return resolve(data);
			});
		});
	}

	// params.secretKey
	// params.method
	// params.path
	// params.query
	static generateSignature(params) {
		const secretKey = params.secretKey;
		const method = params.method;
		const path = params.path;
		const query = Client.concatQueryParameters(params.query);
		const sha = crypto.createHash('sha256');
		sha.update(`${secretKey}${method}${path}${query}`);
		return sha.digest('base64').slice(0, 43).replace(/[=]+$/, '');
	}

	static concatQueryParameters(params) {
		return Object.keys(params || {})
			.map(k => {
				return [k, params[k]];
			})
			.sort()
			.reduce((str, query) => {
				return `${str}${query.join('=')}`;
			}, '');
	}
}

module.exports = Client;