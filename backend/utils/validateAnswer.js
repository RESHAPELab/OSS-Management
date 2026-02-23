function multipleAnswersValidation (realAnswer, userAnswer) {
    return true
}

function singleAnswerValidation (realAnswer, userAnswer) {
    if (userAnswer === realAnswer) {
        return true
    } 
    else {
        return false
    }
}

function metricAnswerValidation (repoReference, metricUsed, userAnswer) {
    console.log(`[validateAnswer] Metric validation: expected answer (metricUsed):`, metricUsed, '| user answer:', userAnswer);
    return true
}

module.exports = {
    multipleAnswersValidation,
    singleAnswerValidation,
    metricAnswerValidation
}