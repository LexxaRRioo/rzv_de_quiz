const LocalStorage = {
    saveResult: function(result) {
        console.log('Saving result:', result);
        let results = JSON.parse(localStorage.getItem('quizResults') || '{}');
        console.log('Current stored results:', results);
        
        if (!results[result.topic]) {
            results[result.topic] = [];
        }
        
        // Check if user already has result
        const existingIndex = results[result.topic]
            .findIndex(entry => entry.nickname === result.nickname);
            
        if (existingIndex >= 0) {
            // Update existing result if score is better
            if (result.score > results[result.topic][existingIndex].score) {
                results[result.topic][existingIndex] = {
                    ...result,
                    timestamp: new Date().toISOString()
                };
            }
        } else {
            // Add new result
            results[result.topic].push({
                ...result,
                timestamp: new Date().toISOString()
            });
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