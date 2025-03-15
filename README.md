# PokeGraphQL-Playground 🎮🚀

An experimental GraphQL API for Pokémon data using Node.js, MongoDB, and Apollo Server.

## 🚀 Features
- CRUD Operations for Pokémon, Trainers, Moves, and Types
- GraphQL API for structured queries
- MongoDB Integration for persistent data storage
- Relational Data Handling between Pokémon, Trainers, Moves, and Types

## 🔍 Example Queries

## Fetch Pokémon by ID
- query {
  - getPokemon(id: "pokemon-id") {
    - name
    - type
    - moves {
      - name
      - power
    - }
  - }
- }

## 🛠 Tech Stack
- Backend: Node.js, Apollo Server
- Database: MongoDB
- API: GraphQL

📌 For learning & experimentation!
