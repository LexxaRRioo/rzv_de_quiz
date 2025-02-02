const LocalStorage = {
    saveResult: function(result) {
        let results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        const topic = result.topic; // Получаем топик
        if (!results[topic]) {
            results[topic] = [];
        }
        results[topic].push({
            nickname: result.nickname,
            score: result.score,
            percentage: result.percentage,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('quizResults', JSON.stringify(results));
    },

    getLeaderboard: function(topic) {
        let results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        return results[topic] ? results[topic].sort((a, b) => b.score - a.score).slice(0, 10) : [];
    }
}; 