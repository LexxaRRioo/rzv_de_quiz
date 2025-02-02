const LocalStorage = {
    saveResult: function(result) {
        console.log('Saving result:', result);
        let results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        
        if (!results[result.topic]) {
            results[result.topic] = [];
        }
        
        // Добавляем дополнительную информацию
        const fullResult = {
            ...result,
            timestamp: new Date().toISOString(),
            totalQuestions: questionLimit,
            answers: userAnswers.map(answer => {
                const question = quiz.find(q => q.q === answer.question);
                return {
                    ...answer,
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
        console.log('Updated results:', JSON.parse(localStorage.getItem('quizResults')));
    },

    getLeaderboard: function(topic) {
        console.log('Getting leaderboard for topic:', topic);
        const results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        console.log('Raw results from storage:', results);
        
        if (!results[topic] || !Array.isArray(results[topic])) {
            console.log('No valid results for topic:', topic);
            return [];
        }
        
        return results[topic].sort((a, b) => b.score - a.score);
    }
};