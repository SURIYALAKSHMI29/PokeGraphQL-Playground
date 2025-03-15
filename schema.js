export const typeDefs = `#graphql
    type Pokemon {
        _id: Int!,
        name: String!,
        image: String,
        moveIds: [Int!],
        moves: [Move],
        typeIds: [Int!],
        types: [Type],
        trainerIds: [Int!],
        trainers: [Trainer]
    }
    type Type{
        _id: Int!
        name: String!
        strongAgainstIds: [Int!],
        weakAgainstIds: [Int!],
        strongAgainst: [Type]  # Relationships (e.g., Fire > Grass)
        weakAgainst: [Type]
    }
    type Move{
        _id: Int!,
        name: String!,
        power: Int,
        accuracy: Float
    }
    type Trainer {
        _id: Int!,
        name: String!,
        pokemonIds: [Int!],
        pokemons: [Pokemon]
    }
    
    type Query{  # entry points to the graph
        pokemon(_id: Int!): Pokemon
        pokemons: [Pokemon]
        types: [Type]
        trainers: [Trainer]
        trainer(_id: Int!): Trainer   
    }

    input PokemonInput{
        name: String!,
        image: String,
        moveIds: [Int!],
        typeIds: [Int!],
        trainerIds: [Int!]
    }

    input PokemonUpdateInput{
        name: String,
        image: String,
        moveIds: [Int],
        typeIds: [Int],
        trainerIds: [Int]
    }

    input TypeInput{
        name: String!
        strongAgainstIds: [Int!],
        weakAgainstIds: [Int!]
    }

    input TypeUpdateInput{
        name: String,
        strongAgainstIds: [Int],
        weakAgainstIds: [Int]
    }

    input MoveInput{
        name: String!,
        power: Int!,
        accuracy: Float!
    }

    input MoveUpdateInput{
        name: String,
        power: Int,
        accuracy: Float
    }

    input TrainerInput{
        name: String!,
        pokemonIds: [Int!]
    }

    input TrainerUpdateInput{
        name: String,
        pokemonIds: [Int]
    }
    
    type Mutation{
        addPokemon(pokemonInput: PokemonInput): Pokemon,
        updatePokemon(_id: Int!, pokemonInput: PokemonUpdateInput): Pokemon,
        deletePokemon(_id: Int!): String,

        addType(typeInput: TypeInput): Type,
        updateType(_id: Int!, typeInput: TypeUpdateInput): Type,
        deleteType(_id: Int!): String,

        addMove(moveInput: MoveInput): Move,
        updateMove(_id: Int!, moveInput: MoveUpdateInput): Move,
        deleteMove(_id: Int!): String,

        addTrainer(trainerInput: TrainerInput): Trainer,
        updateTrainer(_id: Int!, trainerInput: TrainerUpdateInput): Trainer,
        deleteTrainer(_id: Int!): String
    }
`;

//  key data types
//  int, float string, boolean, ID