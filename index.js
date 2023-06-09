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

        app.get('/class', async (req, res) => {
            const result = await classCollection.find().sort({student_capacity: -1}).toArray();
            res.send(result);
        })

        const instructorCollection = client.db("lensIdDb").collection("instructor");

        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().sort({enrolled_students: -1}).toArray();
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
