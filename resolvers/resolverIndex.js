import pokemonResolvers from "./pokemonResolvers.js";
import trainerResolvers from "./trainerResolvers.js";
import typeResolvers from "./typeResolvers.js";
import moveResolvers from "./moveResolvers.js";

export const resolvers = {
    Query: {
        ...pokemonResolvers.Query,
        ...trainerResolvers.Query,
        ...typeResolvers.Query,
        ...moveResolvers.Query,
    },
    Mutation: {
        ...pokemonResolvers.Mutation,
        ...trainerResolvers.Mutation,
        ...typeResolvers.Mutation,
        ...moveResolvers.Mutation,
    },
    Pokemon: pokemonResolvers.Pokemon,
    Trainer: trainerResolvers.Trainer,
    Type: typeResolvers.Type,
};
