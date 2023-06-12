const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const port = process.env.PORT || 5000;


//middleware
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

app.use(cors(corsOptions))
app.use(express.json());


const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    if(!authorization) {
        return res.status(401).send({error: true, message: 'unauthorized access'});
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if(err) {
            return res.status(401).send({error: true, message: 'unauthorized access'})
        }
        req.decoded = decoded;
        next();
    })

}


const {MongoClient, ServerApiVersion, ObjectId} = require('mongodb');
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
        // await client.connect();

        const classCollection = client.db("lensIdDb").collection("class");
        const instructorCollection = client.db("lensIdDb").collection("instructor");
        const usersCollection = client.db("lensIdDb").collection("users");
        const cartCollection = client.db("lensIdDb").collection("carts");


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});

            res.send({token})
        })


        // cart collection apis
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;

            if(!email) {
                return res.send([]);
            }

            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail) {
                return res.status(403).send({error: true, message: 'Forbidden access'})
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

        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await cartCollection.deleteOne(query);
            res.send(result);
            console.log(result);
        })

        // Class Collection APIs:

        app.get('/class', async (req, res) => {
            const result = await classCollection.find().sort({seats_available: -1}).toArray();
            res.send(result);
        })

        // instructor Collection APIs:

        app.get('/instructor', async (req, res) => {
            const result = await instructorCollection.find().sort({enrolled_students: -1}).toArray();
            res.send(result);
        })

        // User Related APIs:

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user);
            const query = {email: user.email}
            const existingUser = await usersCollection.findOne(query);
            console.log('Existing User:', existingUser);
            if(existingUser) {
                return res.send({message: 'user already exists'})
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        });


        app.get('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if(req.decoded.email !== email) {
                res.send({admin: false})
            }

            const query = {email: email}
            const user = await usersCollection.findOne(query);
            const result = {admin: user?.role === 'admin'}
            res.send(result);
        })

        app.get('/users/instructor/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;

            if(req.decoded.email !== email) {
                res.send({instructor: false})
            }

            const query = {email: email}
            const user = await usersCollection.findOne(query);
            const result = {instructor: user?.role === 'instructor'}
            res.send(result);
        })


        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    role: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });

        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = {_id: new ObjectId(id)};
            const updateDoc = {
                $set: {
                    role: 'instructor'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        })

        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await usersCollection.deleteOne(query);
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
