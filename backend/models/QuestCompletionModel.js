import mongoose from "mongoose";

const QuestCompletionSchema = mongoose.Schema({
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Quest",
        required: [true, "Please add quest to questCompletion"]
    },
    completed: {
        type: Boolean,
        required: [true, "Please provide completion status for quest"]
    },
    tasks: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }
})

export default mongoose.model("QuestCompletion", QuestCompletionSchema)