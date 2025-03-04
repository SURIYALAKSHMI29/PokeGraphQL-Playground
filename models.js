import mongoose from "mongoose";

const pokemonSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    image: String,
    moveIds: [String],
    typeIds: [String],
    trainerIds: [String]
});

const typeSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    strongAgainstIds: [String],
    weakAgainstIds: [String]
});

const moveSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    power: Number,
    accuracy: Number
});

const trainerSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    name: { type: String, required: true },
    pokemonIds: [String]
});

// Create Models
export const Pokemon = mongoose.model("Pokemon", pokemonSchema);
export const Type = mongoose.model("Type", typeSchema);
export const Move = mongoose.model("Move", moveSchema);
export const Trainer = mongoose.model("Trainer", trainerSchema);
