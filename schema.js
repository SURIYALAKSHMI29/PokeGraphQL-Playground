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

    input TypeInput{
        name: String!
        strongAgainstIds: [Int!],
        weakAgainstIds: [Int!]
    }

    input MoveInput{
        name: String!,
        power: Int!,
        accuracy: Float!
    }

    input TrainerInput{
        name: String!,
        pokemonIds: [Int!]
    }
    
    type Mutation{
        addPokemon(pokemonInput: PokemonInput): Pokemon,
        addType(typeInput: TypeInput): Type,
        addMove(moveInput: MoveInput): Move,
        addTrainer(trainerInput: TrainerInput): Trainer
    }
`;

//  key data types
//  int, float string, boolean, ID