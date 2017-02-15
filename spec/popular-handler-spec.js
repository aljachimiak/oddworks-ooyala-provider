/* global describe, beforeAll, it, expect, spyOn */
/* eslint prefer-arrow-callback: 0 */
/* eslint-disable max-nested-callbacks */
'use strict';

const Promise = require('bluebird');
const provider = require('../');

describe('popularHandler', function () {
	function noop() {}

	describe('when Ooyala popular not found', function () {
		let result = null;
		let error = null;
		let popularErrorEvent = null;
		const spec = {
			channel: 'abc',
			type: 'collectionSpec',
			id: 'spec-ooyala-discovery-popular'
		};

		function getChannel() {
			return Promise.resolve({id: 'abc'});
		}

		beforeAll(function (done) {
			const bus = this.createBus();

			bus.observe({level: 'error'}, function (payload) {
				popularErrorEvent = payload;
			});

			const client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
			spyOn(client, 'getPopularRelated').and.returnValue(Promise.resolve(null));

			const popularHandler = provider.createPopularHandler(bus, getChannel, client, noop);

			return popularHandler({spec})
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
			expect(error.code).toBe('POPULAR_NOT_FOUND');
			done();
		});

		it('has an error event', function (done) {
			expect(popularErrorEvent.code).toBe('POPULAR_NOT_FOUND');
			expect(popularErrorEvent.message).toBe('popular not found');
			expect(popularErrorEvent.error.code).toBe('POPULAR_NOT_FOUND');
			done();
		});
	});

	// describe('with assets', function () {
	// 	let client;
	// 	let setItemSpec;
	// 	let transform;
	// 	let result;
	// 	let error = null;
	// 	const spec = {
	// 		channel: 'abc',
	// 		type: 'collectionSpec',
	// 		id: 'spec-ooyala-discovery-popular'
	// 	};
	// 	const assets = [{title: 'VIDEO_1'}, {title: 'VIDEO_2'}];
	// 	const collection = {title: 'COLLECTION'};

	// 	function getChannel() {
	// 		return Promise.resolve({id: 'abc'});
	// 	}

	// 	beforeAll(function (done) {
	// 		const bus = this.createBus();

	// 		// Mock the Oddworks setItemSpec command for the related assets (videos).
	// 		setItemSpec = jasmine
	// 			.createSpy('setItemSpec')
	// 			.and.returnValues(
	// 				Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
	// 				Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
	// 			);

	// 		bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

	// 		// Mock the Ooyala client methods.
	// 		client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
	// 		spyOn(client, 'getPopularRelated').and.returnValue(Promise.resolve(assets));

	// 		transform = jasmine.createSpy('transform').and.returnValue(collection);

	// 		const popularHandler = provider.createPopularHandler(bus, getChannel, client, transform);

	// 		return popularHandler({spec})
	// 			.then(res => {
	// 				result = res;
	// 			})
	// 			.catch(err => {
	// 				error = err;
	// 			})
	// 			.then(done);
	// 	});

	// 	it('has a result', function () {
	// 		expect(result.title).toBe('COLLECTION');
	// 	});

	// 	it('does not have an error', function () {
	// 		expect(error).toBe(null);
	// 	});

	// 	it('sends setItemSpec commands', function () {
	// 		expect(setItemSpec).toHaveBeenCalledTimes(2);
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'videoSpec',
	// 			source: 'ooyala-asset-provider',
	// 			asset: assets[0]
	// 		});
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'videoSpec',
	// 			source: 'ooyala-asset-provider',
	// 			asset: assets[1]
	// 		});
	// 	});

	// 	// it('calls client.getLabel()', function () {
	// 	// 	expect(client.getLabel).toHaveBeenCalledTimes(1);
	// 	// 	expect(client.getLabel).toHaveBeenCalledWith({labelId: 'foo'});
	// 	// });

	// 	// it('calls client.getAssetsByLabel()', function () {
	// 	// 	expect(client.getAssetsByLabel).toHaveBeenCalledTimes(1);
	// 	// 	expect(client.getAssetsByLabel).toHaveBeenCalledWith({labelId: 'foo'});
	// 	// });

	// 	// it('calls client.getChildLabels()', function () {
	// 	// 	expect(client.getChildLabels).toHaveBeenCalledTimes(1);
	// 	// 	expect(client.getChildLabels).toHaveBeenCalledWith({labelId: 'foo'});
	// 	// });
	// });

	// describe('with child labels', function () {
	// 	let client;
	// 	let setItemSpec;
	// 	let transform;
	// 	let result;
	// 	let error = null;
	// 	const label = {id: 'foo', name: 'LABEL'};
	// 	const spec = {
	// 		channel: 'abc',
	// 		type: 'collectionSpec',
	// 		id: 'spec-123',
	// 		label
	// 	};
	// 	const assets = [];
	// 	const labels = [
	// 		{id: 'label-1', name: 'LABEL_1'},
	// 		{id: 'label-2', name: 'LABEL_2'}
	// 	];
	// 	const collection = {title: 'COLLECTION'};

	// 	function getChannel() {
	// 		return Promise.resolve({id: 'abc'});
	// 	}

	// 	beforeAll(function (done) {
	// 		const bus = this.createBus();

	// 		// Mock the Oddworks setItemSpec command for the related assets (videos).
	// 		setItemSpec = jasmine
	// 			.createSpy('setItemSpec')
	// 			.and.returnValues(
	// 				Promise.resolve({type: 'collectionSpec', resource: 'foo-123'}),
	// 				Promise.resolve({type: 'collectionSpec', resource: 'bar-123'})
	// 			);

	// 		bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

	// 		// Mock the Ooyala client methods.
	// 		client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
	// 		spyOn(client, 'getLabel').and.returnValue(Promise.resolve(label));
	// 		spyOn(client, 'getAssetsByLabel').and.returnValue(Promise.resolve(assets));
	// 		spyOn(client, 'getChildLabels').and.returnValue(Promise.resolve(labels));

	// 		transform = jasmine.createSpy('transform').and.returnValue(collection);

	// 		const labelHandler = provider.createLabelHandler(bus, getChannel, client, transform);

	// 		return labelHandler({spec})
	// 			.then(res => {
	// 				result = res;
	// 			})
	// 			.catch(err => {
	// 				error = err;
	// 			})
	// 			.then(done);
	// 	});

	// 	it('has a result', function () {
	// 		expect(result.title).toBe('COLLECTION');
	// 	});

	// 	it('does not have an error', function () {
	// 		expect(error).toBe(null);
	// 	});

	// 	it('sends setItemSpec commands', function () {
	// 		expect(setItemSpec).toHaveBeenCalledTimes(2);
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'collectionSpec',
	// 			id: 'spec-ooyala-label-label-1',
	// 			source: 'ooyala-label-provider',
	// 			label: labels[0]
	// 		});
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'collectionSpec',
	// 			id: 'spec-ooyala-label-label-2',
	// 			source: 'ooyala-label-provider',
	// 			label: labels[1]
	// 		});
	// 	});

	// 	it('calls client.getLabel()', function () {
	// 		expect(client.getLabel).toHaveBeenCalledTimes(1);
	// 		expect(client.getLabel).toHaveBeenCalledWith({labelId: 'foo'});
	// 	});

	// 	it('calls client.getAssetsByLabel()', function () {
	// 		expect(client.getAssetsByLabel).toHaveBeenCalledTimes(1);
	// 		expect(client.getAssetsByLabel).toHaveBeenCalledWith({labelId: 'foo'});
	// 	});

	// 	it('calls client.getChildLabels()', function () {
	// 		expect(client.getChildLabels).toHaveBeenCalledTimes(1);
	// 		expect(client.getChildLabels).toHaveBeenCalledWith({labelId: 'foo'});
	// 	});
	// });

	// describe('with channel secrets', function () {
	// 	let client;
	// 	let setItemSpec;
	// 	let transform;
	// 	let result;
	// 	let error = null;
	// 	const label = {id: 'foo', name: 'LABEL'};
	// 	const spec = {
	// 		channel: 'abc',
	// 		type: 'collectionSpec',
	// 		id: 'spec-123',
	// 		label
	// 	};
	// 	const assets = [{title: 'VIDEO_1'}, {title: 'VIDEO_2'}];
	// 	const labels = [];
	// 	const collection = {title: 'COLLECTION'};

	// 	function getChannel() {
	// 		return Promise.resolve({
	// 			id: 'abc',
	// 			secrets: {
	// 				backlotApiKey: 'api-key-foo',
	// 				backlotSecretKey: 'api-secret-bar'
	// 			}
	// 		});
	// 	}

	// 	beforeAll(function (done) {
	// 		const bus = this.createBus();

	// 		// Mock the Oddworks setItemSpec command for the related assets (videos).
	// 		setItemSpec = jasmine
	// 			.createSpy('setItemSpec')
	// 			.and.returnValues(
	// 				Promise.resolve({type: 'videoSpec', resource: 'foo-123'}),
	// 				Promise.resolve({type: 'videoSpec', resource: 'bar-123'})
	// 			);

	// 		bus.commandHandler({role: 'catalog', cmd: 'setItemSpec'}, setItemSpec);

	// 		// Mock the Ooyala client methods.
	// 		client = provider.createClient({apiKey: 'foo', secretKey: 'bar'});
	// 		spyOn(client, 'getLabel').and.returnValue(Promise.resolve(label));
	// 		spyOn(client, 'getAssetsByLabel').and.returnValue(Promise.resolve(assets));
	// 		spyOn(client, 'getChildLabels').and.returnValue(Promise.resolve(labels));

	// 		transform = jasmine.createSpy('transform').and.returnValue(collection);

	// 		const labelHandler = provider.createLabelHandler(bus, getChannel, client, transform);

	// 		return labelHandler({spec})
	// 			.then(res => {
	// 				result = res;
	// 			})
	// 			.catch(err => {
	// 				error = err;
	// 			})
	// 			.then(done);
	// 	});

	// 	it('has a result', function () {
	// 		expect(result.title).toBe('COLLECTION');
	// 	});

	// 	it('does not have an error', function () {
	// 		expect(error).toBe(null);
	// 	});

	// 	it('sends setItemSpec commands', function () {
	// 		expect(setItemSpec).toHaveBeenCalledTimes(2);
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'videoSpec',
	// 			source: 'ooyala-asset-provider',
	// 			asset: assets[0]
	// 		});
	// 		expect(setItemSpec).toHaveBeenCalledWith({
	// 			channel: 'abc',
	// 			type: 'videoSpec',
	// 			source: 'ooyala-asset-provider',
	// 			asset: assets[1]
	// 		});
	// 	});

	// 	it('calls client.getLabel()', function () {
	// 		expect(client.getLabel).toHaveBeenCalledTimes(1);
	// 		expect(client.getLabel).toHaveBeenCalledWith({
	// 			labelId: 'foo',
	// 			apiKey: 'api-key-foo',
	// 			secretKey: 'api-secret-bar'
	// 		});
	// 	});

	// 	it('calls client.getAssetsByLabel()', function () {
	// 		expect(client.getAssetsByLabel).toHaveBeenCalledTimes(1);
	// 		expect(client.getAssetsByLabel).toHaveBeenCalledWith({
	// 			labelId: 'foo',
	// 			apiKey: 'api-key-foo',
	// 			secretKey: 'api-secret-bar'
	// 		});
	// 	});

	// 	it('calls client.getChildLabels()', function () {
	// 		expect(client.getChildLabels).toHaveBeenCalledTimes(1);
	// 		expect(client.getChildLabels).toHaveBeenCalledWith({
	// 			labelId: 'foo',
	// 			apiKey: 'api-key-foo',
	// 			secretKey: 'api-secret-bar'
	// 		});
	// 	});
	// });
});
