const express = require('express');
const app = express();
const jwt = require('jsonwebtoken')
require('dotenv').config();
const port = process.env.PORT || 5000;
const cors = require('cors')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
// middlewere
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.hyctidv.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
// const client = new MongoClient(uri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
    
//   });
// verify token
const verifyToken = (req,res,next) =>{
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send('unAuthorizedAccess')
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token,process.env.TOKEN_SECRET,(err , decoded)=>{
        if(err){
            res.status(401).send('unauthorized access')
        }
        req.decoded = decoded
    })
    next();

}

const run = async() =>{
    
    try{
        await client.connect();
    console.log("connect");
    const serviceCollection = client.db('food').collection('services');
    const reviewsCollection = client.db('food').collection('reviews');
        // home service api
        app.get('/homeservice',async(req,res)=>{
            const query = {};
            const cursor = serviceCollection.find(query);
            const result = await cursor.limit(3).toArray();
            res.send(result);
        });
        // all service api
        app.get('/services',async(req,res)=>{
            const query = {};
            const cursor = serviceCollection.find(query)
            const result = await cursor.toArray();
            res.send(result)
        });
        // specific service section
        app.get('/services/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {_id:ObjectId(id)}
            const cursor = await serviceCollection.findOne(query);
            res.send(cursor);
        });
        // review section started
        app.post('/review',async(req,res)=>{
            const review = req.body;
            const result = await reviewsCollection.insertOne(review);
            res.send(result); 
        });
        // all reviews
        app.get('/reviews',async(req,res)=>{
            const query = {};
            const cursor = reviewsCollection.find(query).sort({_id:-1});
            const result = await cursor.toArray();
            res.send(result);
        });
        app.get(
            '/', (req,res)=> {
                res.send('hello india')
            }
        )
        // my review
        app.get('/myreviews',verifyToken,async(req,res)=>{
            const decoded = req.decoded;
            if(decoded.email!==req.query.email){
                return res.status(403).send('unauthorized access');
            }
            const email = req.query.email;
            let query = {}
            if(req.query.email){
                query = {email:req.query.email}
            }
            const cursor = reviewsCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });
        // for jwt token
        app.post('/jwt',(req,res)=>{
            const user = req.body;
            const token = jwt.sign(user,process.env.TOKEN_SECRET,{expiresIn:'5d'});
            res.send({token});
        });
        // add service
        app.post('/services',async(req,res)=>{
            const service = req.body;
            const result = await serviceCollection.insertOne(service);
            res.send(result)
        })
        // delete user review 
        app.delete('/myreviews/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {
                _id:ObjectId(id)
            };
            const result = await reviewsCollection.deleteOne(query);
            res.send(result);
        });
        // get specific review
        app.get('/update/:id',async(req,res)=>{
            const id = req.params.id;
            const query = {
                _id:ObjectId(id)
            }
            const result = await reviewsCollection.findOne(query)
            res.send(result)
        })
        // update review
        app.patch('/update/:id',async(req,res)=>{
            const id = req.params.id;
            const updateInfo = req.body;
            console.log(updateInfo)
            const query = {
                _id:ObjectId(id)
            };
            const updatedDoc = {
                $set:{
                    review:updateInfo.message,
                    rating:updateInfo.rating
                }
            }
            const result = await reviewsCollection.updateOne(query,updatedDoc);
            res.send(result);
        })

    }
    finally{

    }
}

run().catch(err=>console.log(err))
// port 
app.listen(port,()=>{
    console.log(`server is running on port ${port}`)
})