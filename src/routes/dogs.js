const { Router } = require('express');
const axios = require('axios').default;
const { Temperament, Dog, DogTemperament, Pet, Like, User } = require('../db.js');
const router = Router();
const passport = require('passport');
const { Op } = require('sequelize');

// This route allows us to get all the dog breeds
router.get('/all', async (req, res, next) => {
    try {
        let responseOwn = await Dog.findAll({
            attributes: ['id', 'name', 'image'],
            include: [
                {
                    model: Temperament,
                    as: "temperaments",
                    attributes: ["id", "name"]
                },
            ],
            order: [ [ 'name', 'asc' ] ]
        });
        if (responseOwn.length) {
            responseOwn = responseOwn.map(e => {
                return {
                    id: e.dataValues.id,
                    image: e.dataValues.image,
                    name: e.dataValues.name,
                    temperament: e.dataValues.temperaments.map(e => e.dataValues.name).toString().replace(/,/g, ', '),
                }
            })
            res.send(responseOwn)
        } else {
            res.status(404).send('No dog breeds found')
        }
    } catch (e) {
        next()
    }
})

// This route allows us to get all the dogs name to be used in a select input
router.get('/', async (req, res, next) => {
    try {
        const dogs = await Dog.findAll({ attributes: ['id', 'name'], order: [ [ 'name', 'asc' ] ]})
        return res.send(dogs.map(e => e.dataValues))
    } catch (e) {
        next()
    }
})


// This route allows us to get the dog breeds created by a user
router.get('/own', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        let responseOwn = await Dog.findAll({
            where: {
                [Op.and]:
                    [
                        { userId: req.user.id }
                    ]
            },
            attributes: ['id', 'name', 'image'],
            include: [
                {
                    model: Temperament,
                    as: "temperaments",
                    attributes: ["id", "name"]
                }
            ],
        });
        if (responseOwn.length) {
            responseOwn = responseOwn.map(e => {
                return {
                    id: e.dataValues.id,
                    image: e.dataValues.image,
                    name: e.dataValues.name,
                    temperament: e.dataValues.temperaments.map(e => e.dataValues.name).toString().replace(/,/g, ', '),
                }
            })
            res.send(responseOwn)
        } else {
            res.status(404).send('You have not created any dog breed yet')
        }
    } catch (e) {
        next()
    }
})

// This route allows us to get dog by id
router.get('/:id', async (req, res, next) => {
    try {
        const dog = await Dog.findOne({
            where: { id: parseInt(req.params.id) },
            include: [
                {
                    model: Temperament,
                    as: "temperaments",
                    attributes: ["id", "name"]
                },
                {
                    model: Pet,
                    as: "pets",
                    attributes: ["id", "name", "photo"],
                    include: [
                        {
                            model: Like,
                            as: "likes",
                            include: [
                                {
                                    model: User,
                                    as: "user"
                                }
                            ]
                        },
                        {
                            model: User,
                            as: "user"
                        }
                    ]
                }
            ],
            order: [
                [{ model: Pet, as: 'pets' }, 'createdAt', 'DESC'],
                [{ model: Pet, as: 'pets' }, {model: Like, as: 'likes'}, 'createdAt', 'DESC']
            ]
        }); 
        if (dog) {
            const { id, name, heightmax, heightmin, weightmax, weightmin, lifespanmax, lifespanmin, bred_for, breed_group, origin, image, temperaments, pets, userId } = dog.dataValues;
            res.send({
                id,
                image,
                name,
                temperament: temperaments.map(e => e.dataValues.name).toString().replace(/,/g, ', '),
                temperamentsArray: temperaments.map(e => e.dataValues.name),
                height: `${heightmin ? heightmin : ''}${heightmin && heightmax ? ' - ' : ''}${heightmax ? heightmax : ''}${heightmin || heightmax ? ' cm' : ''}`,
                heightmin,
                heightmax,
                weight: `${weightmin ? weightmin : ''}${weightmin && weightmax ? ' - ' : ''}${weightmax ? weightmax : ''}${weightmin || weightmax ? ' kg' : ''}`,
                weightmin,
                weightmax,
                lifespan: `${lifespanmin ? lifespanmin : ''}${lifespanmin && lifespanmax ? ' - ' : ''}${lifespanmax ? lifespanmax : ''}${lifespanmin || lifespanmax ? ' years' : ''}`,
                lifespanmin,
                lifespanmax,
                bred_for,
                breed_group,
                origin,
                image,
                pets: dog.dataValues.pets.map(e => Object.assign(e.dataValues, {likes: e.dataValues.likes.map(e => e.dataValues ? (({ id, username, fullname, profilepic }) => ({ id, username, fullname, profilepic }))(e.dataValues.user) : null)}, { likesCount: e.dataValues.likes.length }, {user: (({ fullname, profilepic, username }) => ({ fullname, profilepic, username }))(e.dataValues.user)})),
                userId
            })
        } else {
            res.status(404).send(`There is no dog breed with the id ${req.params.id}`);
        }
    } catch (e) {
        console.log(e)
        next();
    }
})

module.exports = router;