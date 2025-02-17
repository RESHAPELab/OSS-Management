import mongoose from "mongoose";

const QuestCompletionSchema = mongoose.Schema({
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Quest",
        required: [true, "Please add quest to questCompletion"]
    },
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }]
})

export default mongoose.model("QuestCompletion", QuestCompletionSchema)