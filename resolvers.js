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
    },
    

    // MUTATIONS

    Mutation: {
        addPokemon: async (_, { pokemonInput }) => {    
        // not as "addPokemon: async (_, args)", 
        // since { pokemonInput } is effective (Destructuring)

            const { name, moveIds = [], typeIds = [], trainerIds = [] } = pokemonInput;
            let { image } = pokemonInput;

            const lastPokemon = await Pokemon.findOne({}, { _id: 1 }).sort({ _id: -1 });
            // {} → No filter (fetches any Pokémon)
            // { _id: 1 } → Only retrieve the _id field alone
            // .sort({ _id: -1 }): -1 means descending order (highest _id first)

            _id = lastPokemon ? (parseInt(lastPokemon._id, 10) + 1).toString() : "1";

            if(!image?.trim()){
                image = undefined;
            }

            const [existingMoves, existingTypes, existingTrainers] = await Promise.all([
                Move.find({ _id: { $in: moveIds } }).distinct("_id"),
                Type.find({ _id: { $in: typeIds } }).distinct("_id"),
                Trainer.find({ _id: { $in: trainerIds } }).distinct("_id"),
            ]);

            const invalidMoves = moveIds.filter(id => !existingMoves.includes(id));
            const invalidTypes = typeIds.filter(id => !existingTypes.includes(id));
            const invalidTrainers = trainerIds.filter(id => !existingTrainers.includes(id));

            if(invalidMoves.length || invalidTypes.length || invalidTrainers.length) {
                throw new Error(`Invalid IDs detected:
                    Moves: ${invalidMoves.length > 0 ? invalidMoves.join(", ") : "None"},
                    Types: ${invalidTypes.length > 0 ? invalidTypes.join(", ") : "None"},
                    Trainers: ${invalidTrainers.length > 0 ? invalidTrainers.join(", ") : "None"}
                `);
            }
            const pokemon = new Pokemon({ _id, name, image, moveIds, typeIds, trainerIds });
            await pokemon.save();
            return pokemon;
        }
    }
};
