import { Pokemon, Type, Move, Trainer } from "../models.js";
const trainerResolvers = {
    Query: {
        trainers: async () => await Trainer.find(),

        trainer: async (_, { _id }) => {
            const trainer = await Trainer.findById(_id);
            if (!trainer) {
                throw new Error(`Trainer with ID ${_id} not found`);
            }
            return trainer;
        },
    },

    Trainer: {
        pokemons: async(parent) => await Pokemon.find({ _id: {$in : parent.pokemonIds}}),
    },

    Mutation: {
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

            if (pokemonIds.length > 0) {
                await Pokemon.updateMany(
                    { _id: { $in: pokemonIds } },
                    { $addToSet: { trainerIds: _id } } 
                );
            }
            const trainer = new Trainer({ _id, name, pokemonIds });
            await trainer.save();
            return trainer;
        },

        updateTrainer: async (_, {_id, trainerInput}) => {
            const {name, pokemonIds} = trainerInput;
            const trainer = await Trainer.findById(_id);
            if (!trainer) { 
                throw new Error(`Trainer with ID ${_id} not found`);
            }

            if (pokemonIds) {
                const existingPokemonIds = await Pokemon.find({ _id: { $in: pokemonIds } }).distinct("_id");
        
                const invalidPokemons =  pokemonIds.filter(id => !existingPokemonIds.includes(id));

                if(invalidPokemons.length > 0) {
                    throw new Error(`Invalid IDs detected:
                        Pokemons: ${invalidPokemons.join(", ")}
                    `);
                }

                await Pokemon.updateMany(
                    { _id: { $in: trainer.pokemonIds.filter(id => !pokemonIds.includes(id)) } },
                    { $pull: { trainerIds: _id } }
                );
            
                await Pokemon.updateMany(
                    { _id: { $in: pokemonIds.filter(id => !trainer.pokemonIds.includes(id)) } },
                    { $addToSet: { trainerIds: _id } } 
                );

                trainer.pokemonIds  = pokemonIds;
            }
            
            if (name) trainer.name = name;
            await trainer.save();
            return trainer;
        },

        deleteTrainer: async (_, { _id }) => {
            const trainer = await Trainer.findById(_id);
            if (!trainer) {
                throw new Error(`Trainer with ID ${_id} not found`);
            }

            // Remove this trainer from all pokemons owned by it
            await Pokemon.updateMany(
                {trainerIds: _id}, 
                {$pull: {trainerIds: _id}}
            );

            await trainer.deleteOne( { _id } );
            return `Trainer deleted successfully with Id ${_id}`;
        },
    }
};

export default trainerResolvers;