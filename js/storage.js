// Интерфейс хранилища
class StorageInterface {
    async saveResult(result) { throw new Error('Not implemented'); }
    async getLeaderboard(topic) { throw new Error('Not implemented'); }
    async getUserResult(topic, nickname) { throw new Error('Not implemented'); }
}

// Реализация для localStorage
class LocalStorage extends StorageInterface {
    async saveResult(result) {
        console.log('Saving to localStorage:', result);
        let results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        
        if (!results[result.topic]) {
            results[result.topic] = [];
        }
        
        const fullResult = {
            ...result,
            timestamp: new Date().toISOString(),
            totalQuestions: questionLimit,
            answers: userAnswers.map(answer => {
                const question = quiz.find(q => q.q === answer.question);
                return {
                    question: answer.question,
                    selected: answer.selected,
                    isCorrect: Array.isArray(question.answer) 
                        ? JSON.stringify(answer.selected.sort()) === JSON.stringify(question.answer.sort())
                        : answer.selected[0] === question.answer
                };
            })
        };
        
        const existingIndex = results[result.topic]
            .findIndex(entry => entry.nickname === result.nickname);
            
        if (existingIndex >= 0) {
            results[result.topic][existingIndex] = fullResult;
        } else {
            results[result.topic].push(fullResult);
        }
        
        localStorage.setItem('quizResults', JSON.stringify(results));
    }

    async getLeaderboard(topic) {
        const results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        return results[topic] || [];
    }

    async getUserResult(topic, nickname) {
        const results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        if (!results[topic]) return null;
        return results[topic].find(entry => entry.nickname === nickname) || null;
    }
}

// Реализация для Firebase
class FirebaseStorage extends StorageInterface {
    constructor(app, database) {
        super();
        this.app = app;
        this.database = database;
    }

    async saveResult(result) {
        const fullResult = {
            ...result,
            timestamp: new Date().toISOString(),
            totalQuestions: questionLimit,
            answers: userAnswers.map(answer => {
                const question = quiz.find(q => q.q === answer.question);
                return {
                    question: answer.question,
                    selected: answer.selected,
                    isCorrect: Array.isArray(question.answer) 
                        ? JSON.stringify(answer.selected.sort()) === JSON.stringify(question.answer.sort())
                        : answer.selected[0] === question.answer
                };
            })
        };

        const ref = this.database.ref(`results/${result.topic}/${result.nickname}`);
        await ref.set(fullResult);
    }

    async getLeaderboard(topic) {
        const snapshot = await this.database.ref(`results/${topic}`).once('value');
        const results = snapshot.val() || {};
        return Object.values(results);
    }

    async getUserResult(topic, nickname) {
        const snapshot = await this.database.ref(`results/${topic}/${nickname}`).once('value');
        return snapshot.val();
    }
}

// Фабрика для создания нужного хранилища
class StorageFactory {
    static async create() {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Using LocalStorage');
            return new LocalStorage();
        } else {
            console.log('Using Firebase');
            await loadFirebaseScripts();
            
            const firebaseConfig = {
                apiKey: "__FIREBASE_API_KEY__",
                authDomain: "__FIREBASE_AUTH_DOMAIN__",
                projectId: "__FIREBASE_PROJECT_ID__",
                storageBucket: "__FIREBASE_STORAGE_BUCKET__",
                messagingSenderId: "__FIREBASE_MESSAGING_SENDER_ID__",
                appId: "__FIREBASE_APP_ID__",
                databaseURL: "__FIREBASE_DATABASE_URL__"
            };

            firebase.initializeApp(firebaseConfig);
            return new FirebaseStorage(firebase.app(), firebase.database());
        }
    }
}

// Функция для загрузки Firebase скриптов
async function loadFirebaseScripts() {
    return new Promise((resolve, reject) => {
        // Загружаем основной скрипт Firebase
        const firebaseApp = document.createElement('script');
        firebaseApp.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js';
        firebaseApp.onload = () => {
            // После загрузки основного скрипта загружаем Database
            const firebaseDatabase = document.createElement('script');
            firebaseDatabase.src = 'https://www.gstatic.com/firebasejs/8.10.1/firebase-database.js';
            firebaseDatabase.onload = resolve;
            firebaseDatabase.onerror = reject;
            document.head.appendChild(firebaseDatabase);
        };
        firebaseApp.onerror = reject;
        document.head.appendChild(firebaseApp);
    });
}

// Экспорт единственного экземпляра хранилища
let storageInstance = null;

export async function initStorage() {
    if (!storageInstance) {
        storageInstance = await StorageFactory.create();
    }
    return storageInstance;
} 