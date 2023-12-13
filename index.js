const express = require ('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors');

app.use(cors());
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5nrexn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db('geniusDb').collection('services');
    const bookingCollection = client.db('geniusDb').collection('bookings');

    // service related api
    app.get('/services', async(req,res)=>{
        const result = await serviceCollection.find().toArray();
        res.send(result);
    })

    app.get('/services/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id: new ObjectId(id)};
      const options = {
        projection: { title:1, img:1, price:1, service_id:1 },
      };
      const result = await serviceCollection.findOne(query,options);
      res.send(result);
    })

    // bookings related api
    app.post('/bookings', async(req,res)=>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })

    app.get('/bookings', async(req,res)=>{
      let query = {};
      if(req.query?.email){
        query = { email : req.query.email}
      };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })

    app.delete('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const query = { _id : new ObjectId(id)};
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/bookings/:id', async(req,res)=>{
      const id = req.params.id;
      const filter = { _id:new ObjectId(id) };
      const updateBooking = req.body;
      const updateDoc = {
        $set: {
          status: updateBooking.status
        },
      };
      const result = await bookingCollection.updateOne(filter,updateDoc)
      res.send(result);
    })



    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);




app.get('/',(req,res)=>{
   res.send('Genius car server is running');
})

app.listen(port,(req,res)=>{
    console.log(`Genius car server is running on port : ${port}`);
})