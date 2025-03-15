import { Move, Pokemon } from "../models.js";

const moveResolvers = {
    Mutation: {
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
    }
};

export default moveResolvers;
