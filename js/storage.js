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
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.x.x/firebase-app.js');
            const { getDatabase } = await import('https://www.gstatic.com/firebasejs/9.x.x/firebase-database.js');
            
            const firebaseConfig = {
                apiKey: "AIzaSyBIBiFTvXuPSQc-RsUgBl39CCn_WkxzQnE",
                authDomain: "rzv-de-quiz.firebaseapp.com",
                projectId: "rzv-de-quiz",
                storageBucket: "rzv-de-quiz.firebasestorage.app",
                messagingSenderId: "410993032742",
                appId: "1:410993032742:web:83fa6d2d4e30e6419df0e7",
            };

            const app = initializeApp(firebaseConfig);
            const database = getDatabase(app);
            return new FirebaseStorage(app, database);
        }
    }
}

// Экспорт единственного экземпляра хранилища
export const storage = await StorageFactory.create(); 