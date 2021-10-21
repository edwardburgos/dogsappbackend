/* eslint-disable import/no-extraneous-dependencies */
const { expect } = require('chai');
const session = require('supertest-session');
const app = require('../../src/app.js');
const { Dog, conn } = require('../../src/db.js');

const agent = session(app);
const dog = {
  name: 'Pug',
};

describe('Videogame routes', () => {
 /* before(() => conn.authenticate()
    .catch((err) => {
      console.error('Unable to connect to the database:', err);
    }));
 // beforeEach(() => Dog.sync({ force: true }))
    //.then(() => Dog.create(dog)));

 /* describe('GET /dogs', () => {
    it('should get 200', () =>
      agent.get('/dogs').expect(200)
    );
  });*/

  xdescribe('POST /dog', () => {
    it('Should insert a new dog to the database', () => {
      agent.post('/dog').send({
        name: "Peruano",
      heightmax: 80,
        heightmin: 50,
        weightmax: 90,
        weightmin: 85,
        temperaments: ["bravo", "cariñoso", "Merry"]
      }).expect(404)
      
    })
  });

});
