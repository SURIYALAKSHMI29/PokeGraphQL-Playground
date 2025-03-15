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

            // **Update existing types**:
            // 1. If the new type is strong against another type, update that type to be weak against this new type.
            await Type.updateMany(
                { _id: { $in: strongAgainstIds } },
                { $addToSet: { weakAgainstIds: _id } }
            );

            // 2. If the new type is weak against another type, update that type to be strong against this new type.
            await Type.updateMany(
                { _id: { $in: weakAgainstIds } },
                { $addToSet: { strongAgainstIds: _id } }
            );
            return type;
        },

        updateType: async (_, {_id, typeInput}) =>{
            const type = await Type.findById(_id);
            if (!type) {
                throw new Error(`Type with ID ${_id} not found`);
            }

            const {name, strongAgainstIds, weakAgainstIds} = typeInput;

            if(strongAgainstIds || weakAgainstIds){
                const [existingStrongTypes, existingWeakTypes] = await Promise.all([
                    strongAgainstIds? Type.find({ _id: { $in: strongAgainstIds } }).distinct("_id"): [],
                    weakAgainstIds? Type.find({ _id: { $in: weakAgainstIds } }).distinct("_id"):[]
                ]);

                const invalidStrongMoves = strongAgainstIds? strongAgainstIds.filter(id => !existingStrongTypes.includes(id)): [];
                const invalidWeakMoves = weakAgainstIds? weakAgainstIds.filter(id => !existingWeakTypes.includes(id)): [];

                if(invalidStrongMoves.length || invalidWeakMoves.length) {
                    throw new Error(`Invalid IDs detected:
                        Strong Types: ${invalidStrongMoves.length > 0 ? invalidStrongMoves.join(", ") : "None"},
                        Weak Types: ${invalidWeakMoves.length > 0 ? invalidWeakMoves.join(", ") : "None"}
                    `);
                }
            }
            if (strongAgainstIds) {
                const oldStrong = type.strongAgainstIds || []; 
            
                await Type.updateMany(
                    { _id: { $in: oldStrong.filter(id => !strongAgainstIds.includes(id)) } },
                    { $pull: { strongAgainstIds: _id } }
                );
            
                await Type.updateMany(
                    { _id: { $in: strongAgainstIds.filter(id => !oldStrong.includes(id)) } },
                    { $addToSet: { strongAgainstIds: _id } } 
                );
        
                type.strongAgainstIds = strongAgainstIds;

                await Type.updateMany(
                    { _id: { $in: strongAgainstIds } },
                    { $addToSet: { weakAgainstIds: _id } }
                );
            }
            
            if (weakAgainstIds) {
                const oldWeakIds = type.weakAgainstIds || []; 
            
                await Type.updateMany(
                    { _id: { $in: oldWeakIds.filter(id => !weakAgainstIds.includes(id)) } },
                    { $pull: { weakAgainstIds: _id } }
                );
            
                await Type.updateMany(
                    { _id: { $in: weakAgainstIds.filter(id => !oldWeakIds.includes(id)) } },
                    { $addToSet: { weakAgainstIds: _id } } 
                );
        
                type.weakAgainstIds = weakAgainstIds;
                
                await Type.updateMany(
                    { _id: { $in: weakAgainstIds } },
                    { $addToSet: { strongAgainstIds: _id } }
                );
            }
            
            if (name) type.name = name;
            await type.save();
            return type;
        },


        deleteType: async (_, { _id }) => {
            const type = await Type.findById(_id);
            if (!type) {
                throw new Error(`Type with ID ${_id} not found`);
            }

            await type.deleteOne( { _id } );
            await Type.updateMany(
                { strongAgainstIds: _id },
                { $pull: { weakAgainstIds: _id } 
            });
            await Type.updateMany(
                { weakAgainstIds: _id },
                { $pull: { strongAgainstIds: _id } 
            });
            return `Type deleted successfully with Id ${_id}`;
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

        updateMove: async (_, {_id, moveInput}) => {
            const move = await Move.findById(_id);

            if(!move) {
                throw new Error(`Move with ID ${_id} not found`);
            }

            const {name, power, accuracy} = moveInput;

            if(name) move.name = name;
            if(power) move.power = power;
            if(accuracy) move.accuracy = accuracy;

            await move.save();    
            return move;
        },

        deleteMove: async (_, { _id }) => {
            const move = await Move.findById(_id);
            if (!move) {
                throw new Error(`Move with ID ${_id} not found`);
            }

            await move.deleteOne( { _id } );
            await Pokemon.updateMany(
                { moveIds: _id },
                { $pull: { moveIds: _id } 
            });
            return `Move deleted successfully with Id ${_id}`;
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
