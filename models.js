import mongoose from "mongoose";

const pokemonSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    image: String,
    moveIds: [Number],
    typeIds: [Number],
    trainerIds: [Number]
}, { versionKey: false });  // to remove the __v field

const typeSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    strongAgainstIds: [Number],
    weakAgainstIds: [Number]
}, { versionKey: false });

const moveSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    power: Number,
    accuracy: Number
}, { versionKey: false });

const trainerSchema = new mongoose.Schema({
    _id: { type: Number, required: true },
    name: { type: String, required: true },
    pokemonIds: [Number]
}, { versionKey: false });

// Create Models
export const Pokemon = mongoose.model("Pokemon", pokemonSchema);
export const Type = mongoose.model("Type", typeSchema);
export const Move = mongoose.model("Move", moveSchema);
export const Trainer = mongoose.model("Trainer", trainerSchema);
