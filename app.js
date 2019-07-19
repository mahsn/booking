  
const express = require('express');
const bodyParser = require('body-parser');
const graphqlHttp = require('express-graphql');
const { buildSchema } = require('graphql');
const mongoose  = require('mongoose');
const MongoClient = require('mongodb').MongoClient;

const Event = require('./models/event');
const User = require('./models/user');
const app = express();

app.use(bodyParser.json());

app.use(
  '/graphql',
  graphqlHttp({
    schema: buildSchema(`
        type Event {
            _id: ID!
            title: String!
            description: String!
            price: Float!
            date: String!

        }
        
        type User {
          _id:ID!,
          email: String!,
          password: String!
        }

        input UserInput {
          email: String!,
          password: String!
        }

        input  EventInput {
           title: String!
           description: String!
           price: Float!
           date: String!     
        }

        type RootQuery {
            events: [String!]!
        }

        type RootMutation {
            createEvent(eventInput: EventInput): Event
            createUser(userInput: UserInput): User
          }

        schema {
            query: RootQuery
            mutation: RootMutation
        }
    `),
    rootValue: {
      events: () => {
        Event.find()
        .then(events => {
          return events.map(event => {
            return {...event._doc, _id: event.id };
          });
        }).catch(err => {
          console.log(err);
        });

      },
      createEvent: args => {
        const event = new Event({
            title: args.eventInput.title,
            description: args.eventInput.description,
            price: +args.eventInput.price,
            date: new Date(args.eventInput.date)

        });
        return event.save()
        .then(result => {
          return {...result._doc, _id: event.id};
        })
        .catch(err => {
          console.log(err);
          throw err;
        })
      },
      createUser: args => {
        const user = new User({
          email : args.userInput.email,
          password : args.userInput.password
        });
        return user.save()
          .then(result => {
            return {...result._doc, _id: user.id}
          })
          .catch(err => {
             console.log(err);
             throw err; 
          });
      }
    },
    graphiql: true
  })
);

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_USER}:
    ${process.env.MONGO_PASSWORD}
    @cluster0-ls4m0.gcp.mongodb.net/${process.env.MONGO_DB}?retryWrites=true&w=majority`
    ).then(() => {
     app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });