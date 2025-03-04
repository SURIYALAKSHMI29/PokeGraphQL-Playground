export const typeDefs = `#graphql
    type Pokemon {
        _id: ID!,
        name: String!,
        image: String,
        moveIds: [ID!],
        moves: [Move],
        typeIds: [ID!],
        types: [Type],
        trainerIds: [ID!],
        trainers: [Trainer]
    }
    type Type{
        _id: ID!
        name: String!
        strongAgainstIds: [ID!],
        weakAgainstIds: [ID!],
        strongAgainst: [Type]  # Relationships (e.g., Fire > Grass)
        weakAgainst: [Type]
    }
    type Move{
        _id: ID!,
        name: String!,
        power: Int,
        accuracy: Float
    }
    type Trainer {
        _id: ID!,
        name: String!,
        pokemonIds: [ID!],
        pokemons: [Pokemon]
    }
    
    type Query{  # entry points to the graph
        pokemon(_id: ID!): Pokemon
        pokemons: [Pokemon]
        types: [Type]
        trainers: [Trainer]
        trainer(_id: ID!): Trainer   
    }
`;

//  key data types
//  int, float string, boolean, ID