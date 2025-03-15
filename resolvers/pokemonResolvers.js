import { Pokemon, Trainer, Move, Type } from "../models.js";

const pokemonResolvers = {
    Query: {
        pokemons: async () => await Pokemon.find(),
        pokemon: async (_, { _id }) => await Pokemon.findById(_id),
    },

    Pokemon: {
        trainers: async(parent) =>{
            return await Trainer.find({ _id: {$in: parent.trainerIds} });
        },
        moves: async(parent) => await Move.find({ _id: {$in: parent.moveIds} }),
        types: async(parent) => await Type.find({ _id: {$in: parent.typeIds} }),
    },

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
    
                if (trainerIds.length > 0) {
                    await Trainer.updateMany(
                        { _id: { $in: trainerIds } },
                        { $addToSet: { pokemonIds: _id } } 
                    );
                }
    
                return pokemon;
            },
    
            updatePokemon: async (_, { _id, pokemonInput }) => {
                const { name, moveIds, typeIds, trainerIds} = pokemonInput;
                let { image } = pokemonInput;
    
                if(!image?.trim()){
                    image = undefined;
                }
    
                const pokemon = await Pokemon.findById(_id);
                if (!pokemon) { 
                    throw new Error(`Pokemon with ID ${_id} not found`);
                }
    
                if (moveIds || typeIds || trainerIds) {
                    const [existingMoves, existingTypes, existingTrainers] = await Promise.all([
                        moveIds ? Move.find({ _id: { $in: moveIds } }).distinct("_id") : [],
                        typeIds ? Type.find({ _id: { $in: typeIds } }).distinct("_id") : [],
                        trainerIds ? Trainer.find({ _id: { $in: trainerIds } }).distinct("_id") : [],
                    ]);
            
                    const invalidMoves = moveIds ? moveIds.filter(id => !existingMoves.includes(id)) : [];
                    const invalidTypes = typeIds ? typeIds.filter(id => !existingTypes.includes(id)) : [];
                    const invalidTrainers = trainerIds ? trainerIds.filter(id => !existingTrainers.includes(id)) : [];
            
                    if (invalidMoves.length || invalidTypes.length || invalidTrainers.length) {
                        throw new Error(`Invalid IDs detected:
                            Moves: ${invalidMoves.length > 0 ? invalidMoves.join(", ") : "None"},
                            Types: ${invalidTypes.length > 0 ? invalidTypes.join(", ") : "None"},
                            Trainers: ${invalidTrainers.length > 0 ? invalidTrainers.join(", ") : "None"}
                        `);
                    }
                }
                
                const oldTrainers = await Trainer.find({ _id: { $in: pokemon.trainerIds } });
                console.log(`Old trainers: ${oldTrainers}`);
    
                // Update trainer IDs only if provided
                if (trainerIds) {
                    const oldTrainerIds = pokemon.trainerIds || []; // Get current trainers
                
                    // 1️⃣ Remove Pokémon from old trainers who are no longer in the new list
                    await Trainer.updateMany(
                        { _id: { $in: oldTrainerIds.filter(id => !trainerIds.includes(id)) } },
                        { $pull: { pokemonIds: _id } }
                    );
                
                    // 2️⃣ Add Pokémon to new trainers who were not in the previous list
                    await Trainer.updateMany(
                        { _id: { $in: trainerIds.filter(id => !oldTrainerIds.includes(id)) } },
                        { $addToSet: { pokemonIds: _id } } // Ensures no duplicate Pokémon IDs
                    );
                
                    // 3️⃣ Update Pokémon's trainer list
                    pokemon.trainerIds = trainerIds;
                }
                
    
                if (name) pokemon.name = name;
                if (image !== undefined) pokemon.image = image;
                if (moveIds) pokemon.moveIds = moveIds;
                if (typeIds) pokemon.typeIds = typeIds;
    
                await pokemon.save();
                return pokemon;
            },
    
            deletePokemon: async (_, { _id }) => {
                const pokemon = await Pokemon.findById(_id);
                if (!pokemon) {
                    throw new Error(`Pokemon with ID ${_id} not found`);
                }
    
                // Remove this Pokémon from all trainers who own it
                await Trainer.updateMany(
                    { pokemonIds: _id }, 
                    { $pull: { pokemonIds: _id } } 
                );
    
                await pokemon.deleteOne( { _id } );
                return `Pokemon deleted successfully with Id ${_id}`;
            },
    },
};

export default pokemonResolvers;
