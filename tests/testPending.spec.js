const { expect } = require('chai');
const session = require('supertest-session');
const app = require('../src/app.js');

const agent = session(app);

describe('Test de APIS', () => {
    describe('GET /dogs', () => {
        it('Responds with 200 and 8 dogs', async () => {
            var result = await agent.get('/dogs')
            expect(result.statusCode).to.be.equal(200)
            expect(result.body.length).to.be.equal(8)
        })
    });

    describe('GET /temperament', () => {
        it('Responds with 200 and all the temperaments', async () => {
            var result = await agent.get('/temperament')
            expect(result.statusCode).to.be.equal(200)
            expect(result.body.slice(0, 6)).to.deep.equal(['Stubborn', 'Curious', 'Playful', 'Adventurous', 'Active', 'Fun-loving'])
        })
    })

    describe('GET /dogs?name=siberian', () => {
        it('Responds with 200 and the dogs that match with siberian', async () => {
            var result = await agent.get('/dogs?name=siberian')
            expect(result.statusCode).to.be.equal(200)
            expect(result.body).to.deep.equal(
                [{
                    "image": "https://cdn2.thedogapi.com/images/S17ZilqNm.jpg",
                    "name": "Siberian Husky",
                    "temperament": "Outgoing, Friendly, Alert, Gentle, Intelligent"
                }]

            )
        })
    })

    describe('GET /dogs/5', () => {
        it('Responds with 200 and the dog with id 5', async () => {
            var result = await agent.get('/dogs/5')
            expect(result.statusCode).to.be.equal(200)
            expect(result.body).to.deep.equal(
                [{
                    "image": "https://cdn2.thedogapi.com/images/26pHT3Qk7.jpg",
                    "name": "Akbash Dog",
                    "temperament": "Loyal, Independent, Intelligent, Brave",
                    "height": "71 - 86",
                    "weight": "41 - 54",
                    "lifespan": "10 - 12 years"
                }]
            )
        })
    })

    describe('POST /dog', () => {
        var message = "La raza de perro Peruano fue creada exitosamente";
        it('Responds with 200 and message > ' + message, async () => {
            var result = await agent.post('/dog').send({
                name: "Peruano",
                heightmax: 80,
                heightmin: 50,
                weightmax: 90,
                weightmin: 85,
                temperaments: ["bravo", "cariñoso", "Merry"]
            })
            expect(result.statusCode).to.be.equal(200)
            expect(result.body).to.be.equal(message)
        })
    });

});
