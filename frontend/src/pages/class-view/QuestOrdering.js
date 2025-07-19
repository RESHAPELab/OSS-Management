// Quest Ordering Functions with Console Logging

export const moveQuestUp = (questId, setQuestOrder) => {
    console.log('=== MOVE QUEST UP ===');
    console.log('Quest ID:', questId);
    setQuestOrder(prevOrder => {
        console.log('Previous order:', prevOrder.map(q => q.questTitle));
        const newOrder = [...prevOrder];
        const currentIndex = newOrder.findIndex(q => q._id === questId);
        console.log('Current index:', currentIndex);
        
        if (currentIndex > 0) {
            console.log(`Moving "${newOrder[currentIndex].questTitle}" from position ${currentIndex} to ${currentIndex - 1}`);
            const temp = newOrder[currentIndex];
            newOrder[currentIndex] = newOrder[currentIndex - 1];
            newOrder[currentIndex - 1] = temp;
            console.log('New order:', newOrder.map(q => q.questTitle));
        } else {
            console.log('Cannot move up - already at top of custom quests list');
        }
        return newOrder;
    });
};

export const moveQuestDown = (questId, setQuestOrder) => {
    console.log('=== MOVE QUEST DOWN ===');
    console.log('Quest ID:', questId);
    setQuestOrder(prevOrder => {
        console.log('Previous order:', prevOrder.map(q => q.questTitle));
        const newOrder = [...prevOrder];
        const currentIndex = newOrder.findIndex(q => q._id === questId);
        console.log('Current index:', currentIndex);
        
        if (currentIndex < newOrder.length - 1) {
            console.log(`Moving "${newOrder[currentIndex].questTitle}" from position ${currentIndex} to ${currentIndex + 1}`);
            const temp = newOrder[currentIndex];
            newOrder[currentIndex] = newOrder[currentIndex + 1];
            newOrder[currentIndex + 1] = temp;
            console.log('New order:', newOrder.map(q => q.questTitle));
        } else {
            console.log('Cannot move down - already at bottom of custom quests list');
        }
        return newOrder;
    });
};

export const moveFixedQuestUp = (questId, setFixedQuests) => {
    console.log('=== MOVE FIXED QUEST UP ===');
    console.log('Quest ID:', questId);
    setFixedQuests(prevQuests => {
        console.log('Previous fixed quests:', prevQuests.map(q => q.title));
        const newQuests = [...prevQuests];
        const currentIndex = newQuests.findIndex(q => q.id === questId);
        console.log('Current index:', currentIndex);
        
        if (currentIndex > 0) {
            console.log(`Moving "${newQuests[currentIndex].title}" from position ${currentIndex} to ${currentIndex - 1}`);
            const temp = newQuests[currentIndex];
            newQuests[currentIndex] = newQuests[currentIndex - 1];
            newQuests[currentIndex - 1] = temp;
            console.log('New fixed quests order:', newQuests.map(q => q.title));
        } else {
            console.log('Cannot move up - already at top of fixed quests list');
        }
        return newQuests;
    });
};

export const moveFixedQuestDown = (questId, setFixedQuests) => {
    console.log('=== MOVE FIXED QUEST DOWN ===');
    console.log('Quest ID:', questId);
    setFixedQuests(prevQuests => {
        console.log('Previous fixed quests:', prevQuests.map(q => q.title));
        const newQuests = [...prevQuests];
        const currentIndex = newQuests.findIndex(q => q.id === questId);
        console.log('Current index:', currentIndex);
        
        if (currentIndex < newQuests.length - 1) {
            console.log(`Moving "${newQuests[currentIndex].title}" from position ${currentIndex} to ${currentIndex + 1}`);
            const temp = newQuests[currentIndex];
            newQuests[currentIndex] = newQuests[currentIndex + 1];
            newQuests[currentIndex + 1] = temp;
            console.log('New fixed quests order:', newQuests.map(q => q.title));
        } else {
            console.log('Cannot move down - already at bottom of fixed quests list');
        }
        return newQuests;
    });
}; 