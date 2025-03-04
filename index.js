import { ApolloServer } from '@apollo/server';  // npm i @apollo/server
// ApolloServer - to set up a server and configure it, and tells apollo how to handle different types of data and response accordingly
import { startStandaloneServer} from "@apollo/server/standalone"; 
// standAlone - to start the server; start listening for the incoming requests

import mongoose from "mongoose";

import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js"

const server = new ApolloServer({   // creating a server
    typeDefs, resolvers
});

async function startServer() {
    try {
        await mongoose.connect("mongodb://localhost:27017/Pokemons");
        console.log("DB connected");

        const { url } = await startStandaloneServer(server, {
            listen: { port: 4000 },
        });

        console.log(`Our GraphQL server is ⬆️ and 🏃‍♂️ at ${url}`);
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();
