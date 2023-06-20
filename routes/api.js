'use strict';
const mongoose = require('mongoose');
require('dotenv').config();


module.exports = function (app) {

  //mongoosee connect
  const mongoose = require('mongoose');

  mongoose.connect(process.env.DB, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connection successful'))
    .catch((error) => console.log('Error connecting to the database:', error));
  
  //Squema
  const replySchema = new mongoose.Schema({
    text: { type: String, required: true },
    created_on: { type: Date, required: true },
    reported: { type: Boolean, default: false, select: false },
    delete_password: { type: String, required: true, select: false }
  });
  const ThreadSchema = new mongoose.Schema({
    text: { type: String, required: true },
    created_on: { type: Date, required: true },
    bumped_on: { type: Date, required: true },
    replies: {
      type: [replySchema],
      default:  []
    },
    reported: { type: Boolean, default: false, select: false },
    delete_password: { type: String, required: true, select: false }
  });


  //Thread requests
  app.route('/api/threads/:board')
    .get(async (req, res) => {
      const board = req.params.board;

      const Thread = mongoose.model('Thread', ThreadSchema, board);


      const threadArray = await Thread.find().sort({ bumped_on: "desc" }).limit(10);
   
      for (let thread of threadArray) {
      
        thread.replies.sort((a, b) => {
          if (a.created_on > b.created_on) {
            return 1;
          } else {
            return -1;
          }
        });
        thread.replies.splice(3); 
      }
      res.json(threadArray);
    })

    app.post('/api/threads/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);
  
  const { text, delete_password } = req.body;

  const threadCreationDate = new Date();
  const thread = await Thread.create({
    text: text,
    delete_password: delete_password,
    created_on: threadCreationDate,
    bumped_on: threadCreationDate,
    reported: false,
    replies: []
  });

  res.json(thread);
})

    app.delete('/api/threads/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);

  const { thread_id, delete_password } = req.body;

  let thread = await Thread.findById(thread_id).select('+delete_password');
  if (!thread) {
    res.json({ error: 'Thread not found' });
    return;
  }

  if (thread.delete_password === delete_password) {
    await Thread.findByIdAndDelete(thread_id);
    res.send('success');
  } else {
    res.send('incorrect password');
  }
})

app.put('/api/threads/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);

  const { thread_id } = req.body;

  const thread = await Thread.findById(thread_id).select('+reported');
  if (!thread) {
    res.json({ error: 'Thread not found' });
    return;
  }

  thread.reported = true;
  await thread.save();
  res.send('reported');
});


  //Reply requests
  app.route('/api/replies/:board')
    .get(async (req, res) => {
      const board = req.params.board;
     
      const Thread = mongoose.model('Thread', ThreadSchema, board);
      const thread_id = req.query.thread_id;

      const thread = await Thread.findById(thread_id);
      if (!thread) {
        res.json({error: "an error has occurred"});
        return;
      }

      if (thread) {
        res.json(thread);
        return;
      }
    })

 app.post('/api/replies/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);
  
  const { text, delete_password, thread_id } = req.body;

  const replyCreationDate = new Date();
  const newReply = {
    _id: new mongoose.Types.ObjectId(),
    text: text,
    created_on: replyCreationDate,
    delete_password: delete_password,
    reported: false
  };

  const thread = await Thread.findById(thread_id);
  if (!thread) {
    res.json({ error: 'Thread not found' });
    return;
  }

  thread.replies.push(newReply);
  thread.bumped_on = replyCreationDate;
  await thread.save();

  res.json(newReply);
})


  app.delete('/api/replies/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);

  const { thread_id, reply_id, delete_password } = req.body;

  let thread = await Thread.findById(thread_id).select('+replies.delete_password');
  if (!thread) {
    res.json({ error: 'Thread not found' });
    return;
  }

  const reply = thread.replies.id(reply_id);
  if (!reply) {
    res.json({ error: 'Reply not found' });
    return;
  }

  if (reply.delete_password === delete_password) {
    reply.text = '[deleted]';
    await thread.save();
    res.send('success');
  } else {
    res.send('incorrect password');
  }
 })

    
 app.put('/api/replies/:board', async (req, res) => {
  const board = req.params.board;
  const Thread = mongoose.model('Thread', ThreadSchema, board);

  const { thread_id, reply_id } = req.body;

  const thread = await Thread.findById(thread_id).select('+replies.reported');
  if (!thread) {
    res.json({ error: 'Thread not found' });
    return;
  }

  const reply = thread.replies.id(reply_id);
  if (!reply) {
    res.json({ error: 'Reply not found' });
    return;
  }

  reply.reported = true;
  await thread.save();
  res.send('reported');
});
  

};