import { Pokemon, Type, Move, Trainer } from "./models.js";

export const resolvers = {
    Query: {
        pokemons: async () => await Pokemon.find(),
        pokemon: async (_, { _id }) => await Pokemon.findById(_id),
        trainers: async () => await Trainer.find(),
        trainer: async (_, { _id }) => await Trainer.findById(_id),
        types: async () => await Type.find(),
    },

    // Field level Resolvers
    // because of GraphQL's hierarchical nature

    // A field-level resolver (like Pokemon.trainers) 
    // only runs if the client asks for it.
    // better performance

    Pokemon: {
        trainers: async(parent) =>{
            return await Trainer.find({ _id: {$in: parent.trainerIds} });
        },
        moves: async(parent) => await Move.find({ _id: {$in: parent.moveIds} }),
        types: async(parent) => await Type.find({ _id: {$in: parent.typeIds} }),
    },

    Type: {
        strongAgainst: async(parent) => await Type.find({ _id: {$in : parent.strongAgainstIds}}),
        weakAgainst: async(parent) => await Type.find({ _id: {$in : parent.weakAgainstIds}}), 
    },

    Trainer: {
        pokemons: async(parent) => await Pokemon.find({ _id: {$in : parent.pokemonIds}}),
    }
    
};
