/* global jasmine, describe, beforeAll, it, expect, spyOn */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
/* eslint-disable camelcase */
'use strict';

const Promise = require('bluebird');
const provider = require('../');

const assets = {
	results: [
		{
			title: 'VIDEO_1',
			external_id: 'VIDEO_1'
		},
		{
			title: 'VIDEO_2',
			external_id: 'VIDEO_2'
		}
	]
};

describe('similarHandler', function () {
	function noop() {}

	const notFoundAsset = {
		title: 'none',
		external_id: 'not-found'
	};

	describe('when Ooyala similar not found', function () {
		let result = null;
		let error = null;
		let similarErrorEvent = null;
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-ooyala-discovery-similar-not-found',
			asset: notFoundAsset
		};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			bus.observe({level: 'error'}, function (payload) {
				similarErrorEvent = payload;
			});

			const client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getSimilarRelated').and.returnValue(Promise.resolve(null));

			const similarHandler = provider.createSimilarHandler(bus, getChannel, client, noop);

			return similarHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
					// beforeAll was finishing before event could be observed
					setTimeout(function () {
						done();
					}, 10);
				});
		});

		it('does not have a result', function (done) {
			expect(result).toBe(null);
			done();
		});

		it('has an error', function (done) {
			expect(error.code).toBe('SIMILAR_NOT_FOUND');
			done();
		});

		it('has an error event', function (done) {
			expect(similarErrorEvent.code).toBe('SIMILAR_NOT_FOUND');
			expect(similarErrorEvent.message).toBe('similar not found');
			expect(similarErrorEvent.error.code).toBe('SIMILAR_NOT_FOUND');
			done();
		});
	});

	describe('with assets', function () {
		let client;
		let setItemSpec;
		let transform;
		let result;
		let error = null;
		const foundAsset = {
			title: 'Found!',
			external_id: 'found'
		};
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-ooyala-discovery-similar-found',
			asset: foundAsset
		};
		const collection = {title: 'COLLECTION'};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			// Mock the Oddworks setItemSpec command for the related assets (videos).
			setItemSpec = jasmine
				.createSpy('setItemSpec')
				.and.returnValues(
					Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
					Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
				);

			bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

			// Mock the Ooyala client methods.
			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getSimilarRelated').and.returnValue(Promise.resolve(assets));

			transform = jasmine.createSpy('transform').and.returnValue(collection);

			const similarHandler = provider.createSimilarHandler(bus, getChannel, client, transform);

			return similarHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.title).toBe('COLLECTION');
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});

		it('sends setItemSpec commands', function () {
			expect(setItemSpec).toHaveBeenCalledTimes(2);
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'ooyala-asset-provider',
				id: 'spec-ooyala-VIDEO_1',
				asset: assets.results[0]
			});
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'ooyala-asset-provider',
				id: 'spec-ooyala-VIDEO_2',
				asset: assets.results[1]
			});
		});
	});

	describe('with channel secrets', function () {
		let client;
		let setItemSpec;
		let transform;
		let result;
		let error = null;
		const foundAsset = {
			title: 'Found!',
			external_id: 'found'
		};
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-ooyala-discovery-similar-found',
			asset: foundAsset
		};
		const collection = {title: 'COLLECTION'};

		function getChannel() {
			return Promise.resolve({
				id: 'abc',
				secrets: {
					ooyala: {
						backlotApiKey: 'api-key-foo',
						backlotSecretKey: 'api-secret-bar'
					}
				}
			});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			// Mock the Oddworks setItemSpec command for the related assets (videos).
			setItemSpec = jasmine
				.createSpy('setItemSpec')
				.and.returnValues(
					Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
					Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
				);

			bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

			// Mock the Ooyala client methods.
			client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getSimilarRelated').and.returnValue(Promise.resolve(assets));

			transform = jasmine.createSpy('transform').and.returnValue(collection);

			const similarHandler = provider.createSimilarHandler(bus, getChannel, client, transform);

			return similarHandler({spec})
				.then(res => {
					result = res;
				})
				.catch(err => {
					error = err;
				})
				.then(done);
		});

		it('has a result', function () {
			expect(result.title).toBe('COLLECTION');
		});

		it('does not have an error', function () {
			expect(error).toBe(null);
		});

		it('sends setItemSpec commands', function () {
			expect(setItemSpec).toHaveBeenCalledTimes(2);
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'ooyala-asset-provider',
				id: 'spec-ooyala-VIDEO_1',
				asset: assets.results[0]
			});
			expect(setItemSpec).toHaveBeenCalledWith({
				channel: 'abc',
				type: 'videoSpec',
				source: 'ooyala-asset-provider',
				id: 'spec-ooyala-VIDEO_2',
				asset: assets.results[1]
			});
		});

		it('calls client.getSimilarRelated)', function () {
			expect(client.getSimilarRelated).toHaveBeenCalledTimes(1);
			const expected = Object.create(null);
			expected.apiKey = 'api-key-foo';
			expected.secretKey = 'api-secret-bar';
			expected.assetId = 'found';
			expect(client.getSimilarRelated).toHaveBeenCalledWith({
				apiKey: 'api-key-foo',
				secretKey: 'api-secret-bar',
				assetId: 'found'
			});
		});
	});
});
