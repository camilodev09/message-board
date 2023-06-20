const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../server');
const { expect } = chai;

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let threadId;
  let replyId;

  test('Creating a new thread: POST request to /api/threads/{board}', function(done) {
    chai
      .request(server)
      .post('/api/threads/{board}')
      .send({
        text: 'New thread',
        delete_password: 'password'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('_id');
        threadId = res.body._id;
        done();
      });
  });

  test('Viewing the 10 most recent threads with 3 replies each: GET request to /api/threads/{board}', function(done) {
    chai
      .request(server)
      .get('/api/threads/{board}')
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('array');
        expect(res.body.length).to.be.at.most(10);
        done();
      });
  });

  test('Deleting a thread with the incorrect password: DELETE request to /api/threads/{board} with an invalid delete_password', function(done) {
    chai
      .request(server)
      .delete('/api/threads/{board}')
      .send({
        thread_id: threadId,
        delete_password: 'wrong_password'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('incorrect password');
        done();
      });
  });

  test('Deleting a thread with the correct password: DELETE request to /api/threads/{board} with a valid delete_password', function(done) {
    chai
      .request(server)
      .delete('/api/threads/{board}')
      .send({
        thread_id: threadId,
        delete_password: 'password'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('success');
        done();
      });
  });

  test('Reporting a thread: PUT request to /api/threads/{board}', function(done) {
    chai
      .request(server)
      .put('/api/threads/{board}')
      .send({ thread_id: threadId })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('reported');
        done();
      });
  });

  test('Creating a new reply: POST request to /api/replies/{board}', function(done) {
    chai
      .request(server)
      .post('/api/replies/{board}')
      .send({
        text: 'New reply',
        delete_password: 'password',
        thread_id: threadId
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('_id');
        replyId = res.body._id;
        done();
      });
  });

    test('Viewing a single thread with all replies: GET request to /api/replies/{board}', function(done) {
    chai
      .request(server)
      .get('/api/replies/{board}')
      .query({ thread_id: threadId })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.json;
        expect(res.body).to.be.an('object');
        expect(res.body).to.have.property('_id');
        expect(res.body).to.have.property('replies').that.is.an('array');
        done();
      });
  });

  test('Deleting a reply with the incorrect password: DELETE request to /api/replies/{board} with an invalid delete_password', function(done) {
    chai
      .request(server)
      .delete('/api/replies/{board}')
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: 'wrong_password'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('incorrect password');
        done();
      });
  });

  test('Deleting a reply with the correct password: DELETE request to /api/replies/{board} with a valid delete_password', function(done) {
    chai
      .request(server)
      .delete('/api/replies/{board}')
      .send({
        thread_id: threadId,
        reply_id: replyId,
        delete_password: 'password'
      })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('success');
        done();
      });
  });

  test('Reporting a reply: PUT request to /api/replies/{board}', function(done) {
    chai
      .request(server)
      .put('/api/replies/{board}')
      .send({ thread_id: threadId, reply_id: replyId })
      .end(function(err, res) {
        expect(res).to.have.status(200);
        expect(res).to.be.text;
        expect(res.text).to.equal('reported');
        done();
      });
  });

  after(function() {
    delete process.env.NODE_ENV
   });
  

});