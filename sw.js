importScripts('./js/indexDB-operation.js');
const cacheName = 'gypTest-v3';
const dbName = 'gyp-db';
const tableName = 'post_cache';
const appShellFiles = [
	'./index.html',
	'./css/index.css',
	'./static/img/bg-new.png',
	'./icons/icon-168.png',
	'./static/img/下拉.svg',
	'./js/jquery.min.js',
	'./js/indexDB-operation.js',
	'./app.js',
	'./static/img/bijiao.png',
];
const store = new DBConnection(dbName, tableName); 


// 该监听函数中，可以初始化缓存并添加离线应用所需的文件
self.addEventListener('install', e => {
	console.log('Service Worker --- Install');
	// 会等到 waitUntil 里面的代码执行完毕之后才开始安装
	e.waitUntil(
		// 是一个特殊的 CacheStorage 对象，它能在 Service Worker 指定的范围内提供数据存储的能力
		caches.open(cacheName).then(cache => {
			return cache.addAll(appShellFiles);
		})
	)
})

// 缓存请求 post请求不支持存储在cacheStorage 这里采用indexDB存储
self.addEventListener('fetch', e => {
	const req = e.request;
	// console.log(self.location.origin, 'FETCH---请求', req);
	if (req.url.startsWith(self.location.origin)) { // 静态资源请求 或者是同源请求 采用缓存优先
		const method = e.request.method
		if (!['GET', 'POST'].includes(method)) {
			return;
		}
		e.respondWith(
			caches.match(e.request).then(res => {
				// console.log('Service Worker Fetch', e.request.url);
				return res || fetch(e.request).then(response => {
					return caches.open(cacheName).then(cache => {
						console.log(cache, '酷酷酷')
						cache.put(e.request, response.clone());
						return response;
					})
				})
			})
		)
	} else { // 后端请求  采用网络优先
		const method = e.request.method
		if (!['GET', 'POST'].includes(method)) {
			return;
		}
		e.respondWith(
			caches.match(e.request).then(res => {
				// console.log('Service Worker Fetch', e.request.url);
				if (method === 'GET') {
					return fetch(e.request).then(response => {
						return caches.open(cacheName).then(cache => {
							cache.put(e.request, response.clone());
							return response;
						});
					}).catch(err => {
						console.log('get出错', err);
						return res;
					})
				} else {
					return fetch(e.request).then(async response => {
						console.log(response, '工卡肯定是')
						return await store.putPostCache(e.request.url, response.clone());
					}).catch(async err => {
						console.log('出错', err);
						const result = await store.readDataToTable(e.request.url);
						console.log(result, '响应数据')
						return deSerializeResponse(result);
					})
				}
			})
		)
	}
})

// 拿到序列化之后的响应结果
function deSerializeResponse(data) {
	return Promise.resolve(new Response(data.body, data));
}

self.addEventListener('activate', e => {
	e.waitUntil(
		caches.keys().then(keyList => {
			return Promise.all(keyList.map(key => {
				// console.log(key, 'active---------------')
				if (!cacheName.includes(key)) {
					return caches.delete(key);
				}
			})).then(() => { self.clients.claim() }) // 新的sw接管页面  就缓存清除
		})
	)
})

self.addEventListener('sync', e => {
	console.log(e, e.tag)
	if (e.tag === 'sync_task') {
		const request = new Request('http://127.0.0.1:3000/sync?tag=sync_send', { method: 'GET'})
		// 将Promise对象放在e.waitUntil()内可以确保在用户离开我们的网站后，Service Worker会持续在后台运行，等待该请求完成。
		e.waitUntil(
			fetch(request).then(res => {
				return res;
			})
		)
	}
})

