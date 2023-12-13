const express = require ('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  // origin : ['http://127.0.0.1:5173' , 'http://127.0.0.1:5174'],
  origin : ['http://localhost:5173' , 'http://localhost:5174'],
  credentials : true
}));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.j5nrexn.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// middlewares
const verifyToken = async(req,res,next)=>{
  const token = req.cookies?.token;
  if(!token){
    return res.status(401).send({message:'unauthorized access'});
  }
  jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (error,decoded)=>{
    if(error){
      return res.status(401).send({message:'unauthorized access'});
    }
    req.user = decoded;
    next();
  })
}

async function run() {
  try {
    await client.connect();

    const serviceCollection = client.db('geniusDb').collection('services');
    const bookingCollection = client.db('geniusDb').collection('bookings');


    // jwt related api
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn:'1h'});
      res
      .cookie('token', token, { httpOnly:true, secure:false })
      .send({success:true});
    })


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

    app.get('/bookings',verifyToken, async(req,res)=>{
      if(req.query?.email !== req.user.email){
        return res.status(403).send({message:"forbidden access"})
      };
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