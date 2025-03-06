const DB_NAME = 'deepseekChat';
const DB_VERSION = 1;
const STORE_NAME = 'messages';

class ChatDatabase {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          // 创建消息存储，使用自增 ID 作为键
          const store = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          // 创建会话 ID 索引，用于按会话分组查询消息
          store.createIndex('sessionId', 'sessionId', { unique: false });
          // 创建时间戳索引，用于按时间排序
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  async saveMessage(sessionId, message) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      const messageData = {
        ...message,
        sessionId,
        timestamp: Date.now()
      };

      const request = store.add(messageData);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getSessionMessages(sessionId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');

      const request = index.getAll(IDBKeyRange.only(sessionId));

      request.onsuccess = () => {
        // 按时间戳排序
        const messages = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(messages);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAllSessions() {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        // 按会话ID分组，找到每个会话的第一条用户消息和最新时间戳
        const sessions = request.result.reduce((acc, message) => {
          if (!acc[message.sessionId]) {
            acc[message.sessionId] = {
              sessionId: message.sessionId,
              timestamp: message.timestamp,
              content: '',
              role: ''
            };
          }
          
          // 更新最新时间戳
          if (message.timestamp > acc[message.sessionId].timestamp) {
            acc[message.sessionId].timestamp = message.timestamp;
          }
          
          // 如果是用户消息，且还没有设置内容或时间更早，则更新为此消息
          if (message.role === 'user' && 
              (!acc[message.sessionId].content || 
               message.timestamp < acc[message.sessionId].timestamp)) {
            acc[message.sessionId].content = message.content;
            acc[message.sessionId].role = message.role;
          }
          
          return acc;
        }, {});

        // 如果没有用户消息，使用第一条助手消息
        Object.values(sessions).forEach(session => {
          if (!session.content) {
            const firstMessage = request.result.find(m => m.sessionId === session.sessionId);
            if (firstMessage) {
              session.content = firstMessage.content;
              session.role = firstMessage.role;
            }
          }
        });

        resolve(Object.values(sessions).sort((a, b) => b.timestamp - a.timestamp));
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteSession(sessionId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const index = store.index('sessionId');
      
      const request = index.openCursor(IDBKeyRange.only(sessionId));
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const chatDB = new ChatDatabase();