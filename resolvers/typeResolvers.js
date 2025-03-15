import { Type } from "../models.js";

const typeResolvers = {
    Query: {
        types: async () => await Type.find()
    },

    Type: {
        strongAgainst: async(parent) => await Type.find({ _id: {$in : parent.strongAgainstIds}}),
        weakAgainst: async(parent) => await Type.find({ _id: {$in : parent.weakAgainstIds}}), 
    },

    Mutation: {
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
    },
};

export default typeResolvers;
