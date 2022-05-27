//Packages

const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

// Middleware

app.use(cors());
app.use(express.json());

//DB Connect

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.tndro.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'forbidden' });
        }
        req.decoded = decoded;
    })
    next();
}

const run = async () => {
    try {
        await client.connect();
        const toolsCollection = client.db("electric-tools-manufacturer").collection("tools");
        const ordersCollection = client.db("electric-tools-manufacturer").collection("orders");
        const reviewsCollection = client.db("electric-tools-manufacturer").collection("reviews");
        const usersCollection = client.db("electric-tools-manufacturer").collection("users");


        app.get('/tools', async (req, res) => {
            const query = {};
            const cursor = toolsCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.get('/tools/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const tool = await toolsCollection.findOne(query);
            res.send(tool);
        })

        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = await ordersCollection.insertOne(order);
            res.send(result);
        })

        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const cursor = ordersCollection.find(query);
            const tools = await cursor.toArray();
            res.send(tools);
        })

        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            console.log(id);
            const query = { _id: ObjectId(id) };
            const result = await ordersCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/reviews', async (req, res) => {
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result);
        })

        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewsCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews);
        })
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN, {
                expiresIn: '7d'
            })
            const filter = { email: email };
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    user
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc, options);
            res.send({ result, accessToken });
        })
    }
    finally { }
}

run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hi');
})

app.listen(port);