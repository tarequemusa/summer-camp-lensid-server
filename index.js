const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;






// middleware
app.use(cors());
app.use(express.json());



const {MongoClient, ServerApiVersion} = require('mongodb');
const uri = `mongodb+srv://${ process.env.DB_USER }:${ process.env.DB_PASSWORD }@cluster0.g5abh6e.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run () {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();

        const classCollection = client.db("lensIdDb").collection("class");
        const instructorCollection = client.db("lensIdDb").collection("instructor");
        const usersCollection = client.db("lensIdDb").collection("users");
        const cartCollection = client.db("lensIdDb").collection("carts");


        // Class Collection:

        app.get('/class', async (req, res) => {
            const result = await classCollection.find().sort({seats_available: -1}).toArray();
            res.send(result);
        })

        // instructor Collection:

        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().sort({enrolled_students: -1}).toArray();
            res.send(result);
        })

        // User Collection:

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = {email: user.email}
            const existingUser = await usersCollection.findOne(query);

            if(existingUser) {
                return res.send({message: 'user already exists'})
            }

            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        // cart collection apis
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            if(!email) {
                res.send([]);
            }
            const query = {email: email};
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        });


        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })



        // Send a ping to confirm a successful connection
        await client.db("admin").command({ping: 1});
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);



app.get('/', (req, res) => {
    res.send('Summer Camp LensID is running')
})


app.listen(port, () => {
    console.log(`Summer Camp LensID is running on port ${ port }`);
})
