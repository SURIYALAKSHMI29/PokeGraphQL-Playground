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
            console.log(lastPokemon);

            const _id = lastPokemon ? (parseInt(lastPokemon._id, 10) + 1).toString() : "1";
            console.log(_id);

            const existingPokemon = await Pokemon.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
            if (existingPokemon) {
                throw new Error(`Pokemon with name ${name} already exists`);
            }

            if(!image?.trim()){
                image = undefined;
            }
            console.log(image);

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
        },

        addType: async (_, { typeInput }) => {
            const { name, strongAgainstIds = [], weakAgainstIds = [] } = typeInput;

            const existingType = await Type.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
            if (existingType) {
                throw new Error(`Type with name ${name} already exists`);
            }

            const lastType = await Type.findOne({}, { _id: 1 }).sort({ _id: -1 });
            const _id = lastType ? (parseInt(lastType._id, 10) + 1).toString() : "1";
            console.log(_id);

            const [existingStrongTypes, existingWeakTypes] = await Promise.all([
                Type.find({ _id: { $in: strongAgainstIds } }).distinct("_id"),
                Type.find({ _id: { $in: weakAgainstIds } }).distinct("_id")
            ]);

            const invalidStrongMoves = strongAgainstIds.filter(id => !existingStrongTypes.includes(id));
            const invalidWeakMoves = weakAgainstIds.filter(id => !existingWeakTypes.includes(id));

            if(invalidStrongMoves.length || invalidWeakMoves.length) {
                throw new Error(`Invalid IDs detected:
                    Strong Types: ${invalidStrongMoves.length > 0 ? invalidStrongMoves.join(", ") : "None"},
                    Weak Types: ${invalidWeakMoves.length > 0 ? invalidWeakMoves.join(", ") : "None"}
                `);
            } 

            const type = new Type({ _id, name, strongAgainstIds, weakAgainstIds });
            await type.save();
            return type;
        },

        addMove: async (_, { moveInput }) => {
            const { name, power, accuracy } = moveInput;

            const existingType = await Move.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
            if (existingType) {
                throw new Error(`Move with name ${name} already exists`);
            }

            const lastMove = await Move.findOne({}, { _id: 1 }).sort({ _id: -1 });
            const _id = lastMove ? (parseInt(lastMove._id, 10) + 1).toString() : "1";
            console.log(_id);

            const move = new Move({ _id, name, power, accuracy });
            await move.save();
            return move;
        },

        addTrainer: async (_, { trainerInput }) => {
            const { name, pokemonIds = [] } = trainerInput;

            const existingTrainer = await Trainer.findOne({ name: { $regex: new RegExp(`^${name}$`, "i") } });
            if (existingTrainer) {
                throw new Error(`Trainer with name ${name} already exists`);
            }

            const lastTrainer = await Trainer.findOne({}, { _id: 1 }).sort({ _id: -1 });
            const _id = lastTrainer ? (parseInt(lastTrainer._id, 10) + 1).toString() : "1";
            console.log(_id);

            const existingPokemons = await Pokemon.find({ _id: { $in: pokemonIds } }).distinct("_id");
            const invalidPokemons = pokemonIds.filter(id => !existingPokemons.includes(id));

            if(invalidPokemons.length) {
                throw new Error(`Invalid IDs detected:
                    Pokemons: ${invalidPokemons.length > 0 ? invalidPokemons.join(", ") : "None"}
                `);
            } 

            const trainer = new Trainer({ _id, name, pokemonIds });
            await trainer.save();
            return trainer;
        }
    }
};
