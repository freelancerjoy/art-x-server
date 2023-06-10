const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

//Middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("ArtX server is Running");
});

const uri = `mongodb+srv://${process.env.USER_NAME}:${process.env.PSASSWORD}@cluster0.dkc5olm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const userCollection = client.db("artxDB").collection("users");
    const classCollection = client.db("artxDB").collection("classes");

    // all classe
    app.get("/allclasses", async (req, res) => {
      const allclasses = await classCollection.find().toArray();
      res.send(allclasses);
    });
    // update status
    app.patch("/statusclass/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const update = req.body;
      console.log(id, update);
      const updateStatus = {
        $set: {
          status: update.status,
        },
      };

      const result = await classCollection.updateOne(query, updateStatus);
      res.send(result);
    });
    // update user role
    app.patch("/updateuser/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatrole = req.body;
      console.log(id, update);
      const updateuser = {
        $set: {
          role: updatrole.role,
        },
      };

      const result = await classCollection.updateOne(query, updateuser);
      res.send(result);
    });

    //
    app.get("/classes", async (req, res) => {
      let quary = {};
      if (req.query?.email) {
        quary = { email: req.query.email };
      } else {
        return;
      }
      const result = await classCollection.find(quary).toArray();
      res.send(result);
    });

    // save classes
    app.post("/addclass", async (req, res) => {
      const course = req.body;
      console.log(course);
      const result = await classCollection.insertOne(course);
      res.send(result);
    });

    // user save
    app.post("/users", async (req, res) => {
      const user = req.body;
      const quary = { email: user.email };
      const existUser = await userCollection.findOne(quary);
      if (existUser) {
        return;
      }
      const result = await userCollection.insertOne(user);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`ArtX server is Running:${port}`);
});
