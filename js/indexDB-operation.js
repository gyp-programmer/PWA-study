
// 序列化响应数据 保存到indexedDB
function serializeHeader(headers) {
	let serialized = {};
	for (const key of headers.entries()) {
		serialized[key[0]] = key[1]
	}
	return serialized;
}

function serializeResponse(response) {
	let serialized = {
		headers: serializeHeader(response.headers),
		status: response.status,
		statusText: response.statusText,
	};
	return response.clone().text().then(body => {
		serialized.body = body;
		return Promise.resolve(serialized);
	})
}

class DBConnection {
	constructor(dbName, tableName, version) {
		this.db = null;
		this.dbTable = null;
		this.tableName = tableName;
	    this.initDB(dbName, version);
	}
	
	initDB(dbName, version) {
		const dbconnection = indexedDB.open(dbName, version);
		dbconnection.onerror = event => this.errorConnectionError(event);
		dbconnection.onsuccess = event => this.successConnection(event);
		dbconnection.onupgradeneeded = event => this.updateConnection(event);
	}
	
	errorConnectionError(err) {
		// 处理数据库链接失败的回调
		console.log(err, '数据库打开失败');
	}
	
	successConnection(con) {
		console.log('数据库打开成功');
	}
	
	// 如果指定的版本号，大于数据库的实际版本号，就会发生数据库升级事件
	updateConnection(con) {
		this.db = con.target.result;
		console.log('数据库升级');
		if (!this.db.objectStoreNames.contains(this.tableName)) {
			// 如果没有数据表post_cache 直接新建 自动生成主键
			this.genrateTable(this.tableName, { keyPath: 'url' });
		}
	}
	
	// 新建数据表
	genrateTable(tableName, obj) {
		this.dbTable = this.db.createObjectStore(tableName, obj);
		this.dbTable.createIndex('url', 'url', { unique: true });
	}
	
	// 添加数据到表
	addDataToTable(obj) {
		// 新建事务  指定表格名称 和 操作模式
		const tranSaction = this.db.transaction([this.tableName], 'readwrite');
		const request = tranSaction.objectStore(this.tableName).add(obj);
		request.onsuccess = event => {
			console.log('写入成功');
		}
		request.onerror = event => {
			throw new Error(`数据表写入数据失败 ------- ${event}`);
		}
	}
	
	// 读数据
	readDataToTable(key) {
		const transaction = this.db.transaction([this.tableName], 'readwrite');
	    const objectStore = transaction.objectStore(this.tableName);
		console.log(objectStore, '数据表')
	    const request = objectStore.get(key);
		return new Promise((resove, reject) => {
			request.onsuccess = event => {
				console.log('读取数据成功', event.target.result);
				resove(event.target.result);
			}
			request.onerror = event => {
				throw new Error(`读取数据失败 ------- ${event}`);
				reject();
			}
		})
	}
	
	// 更新数据
	updateDataToTable(obj) {
		const tranSaction = this.db.transaction([this.tableName], 'readwrite');
		const request = tranSaction.objectStore(this.tableName).put(obj);
		request.onsuccess = event => {
			console.log('更新成功');
		}
		request.onerror = event => {
			throw new Error(`更新数据失败 ------- ${event}`);
		}
	}
	
	// 删除数据
	deleteDataToTable(key) {
		const transaction = this.db.transaction([this.tableName], 'readwrite');
		const objectStore = transaction.objectStore(this.tableName);
		const request = objectStore.delete(key);
		request.onsuccess = event => {
			console.log('数据删除成功');
		}
	}
	
	// 实际更新数据
	putPostCache(url, response) {
		return new Promise(async resolve => {
			const result = await this.readDataToTable(url);
			serializeResponse(response.clone()).then(serializeRes => {
				const data = serializeRes;
				if (!result) {
					this.addDataToTable({
						url,
						data,
						time: Date.now()
					});
				} else {
					this.updateDataToTable({
						url,
						data,
						time: Date.now()
					});
				}
				resolve(response);
			});
			
		})
	}
}