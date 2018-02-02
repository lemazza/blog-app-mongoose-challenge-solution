'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const faker = require('faker');
const mongoose = require('mongoose');

const expect = chai.expect;

const {app, runServer, closeServer} = require('../server');
const {BlogPost} = require('../models');
const {TEST_DATABASE_URL} = require('../config');

chai.use(chaiHttp);


function seedBlogPostData() {
  console.log('seeding blog post data');
  const seedData = [];

  for (let i =1; i<=10 i++) {
    seedData.push(generateFakeBlogPost());
  }

  return BlogPost.insertMany(seedData);
}

function generateFakeBlogPost() {
  return {
    author: faker.name();
    title: faker.name();
    content: faker.lorem();
  };
}

function tearDownDb() {
  console.warn('Deleting database');
  return mongoose.connection.dropDatabase();
}

describe('BlogPosts API resource', function() {
  before(function(){
    return runServer(TEST_DATABASE_URL);
  });

  beforeEach(function(){
    return seedBlogPostData();
  })

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {

    it('should return all blog posts', function() {
      let res;
      return chai.request(app)
        .get('/posts')
        .then(function(_res) {
          res = _res;
          expect(res).to.have.status(200);
          expect(res.body.blogposts).to.have.length.of.at.least(1);
          return BlogPost.count();
        })
        .then(function(count) {
          expect(res.body.blogposts).to.have.length.of(count);
        });
    });

    it('should return blog posts with right fields', function() {
      let resBlogPost;
      return chai.request(app)
        .get('/posts')
        .then(function(res) {
          expect(res).to.have.status(200);
          expect(res).to.be.json;
          expect(res.body.blogposts).to.be.a('array');
          expect(res.body.blogposts).to.have.length.of.at.least(1);

          res.body.blogposts.forEach(function(post) {
            expect(post).to.be.a('object');
            expect(post).to.include.keys('id', 'author', 'title', 'created', 'content');   
          });
          resBlogPost = res.body.blogposts[0];
          return BlogPost.findById(resBlogPost.id);
        })
        .then(function(post) {
          expect(resBlogPost.id).to.equal(post.id);
          expect(resBlogPost.author).to.equal(post.author);
          expect(resBlogPost.title).to.equal(post.title);
          expect(resBlogPost.created).to.equal(post.created);
          expect(resBlogPost.content).to.equal(post.content);
        });
    });
  });

  describe('POST endpoint', function() {
    it('should add a new blog post', function() {

      const newBlogPost = generateFakeBlogPost();
      let mostRecentGrade;

      return chai.request(app)
        .post('posts')
        .send(newBlogPost)
        .then(function(res) {
          expect(res).to.have.status(201);
          expect(res).to.be.json;
          expect(res.body).to.be.a('object');
          expect(res.body).to.include.keys('id', 'author', 'title', 'created', 'content');
          expect(res.body.id).to.not.be.null;
          expect(res.body.id).to.equal(newBlogPost.id);
          expect(res.body.author).to.equal(newBlogPost.author);
          expect(res.body.title).to.equal(newBlogPost.title);
          expect(res.body.created).to.equal(newBlogPost.created);
          expect(res.body.content).to.equal(newBlogPost.content);
          return BlogPost.findById(res.body.id);
        })
        .then(function(post) {
          expect(post.id).to.equal(newBlogPost.id);
          expect(post.author).to.equal(newBlogPost.author);
          expect(post.title).to.equal(newBlogPost.title);
          expect(post.created).to.equal(newBlogPost.created);
          expect(post.content).to.equal(newBlogPost.content);
        });
    });
  });

  describe('PUT endpoint', function() {
    it('should update fields you send over', function() {
      const updateData = {
        author: 'John Madden',
        title: 'FOOTBALL'
      };

      return BlogPost
        .findOne()
        .then(function(post) {
          updateData.id = post.id

          return chai.request(app)
            .put(`/posts/${post.id}`)
            .send(updateData);
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(updateData.id);
        })
        .then(function(post) {
          expect(post.author).to.equal(updateData.author);
          expect(post.title).to.equal(updateData.title);
        });
    });
  });

  describe('DELETE endpoint', function() {
    it('delete a post by id', function() {

      let post;

      return BlogPost
        .findOne()
        .then(function(_post) {
          post = _post;
          return chai.request(app).delete(`/posts/${post.id}`)
        })
        .then(function(res) {
          expect(res).to.have.status(204);
          return BlogPost.findById(post.id);
        })
        .then(function(_post) {
          expect(_post).to.be.null;
        });
    });
  });

});