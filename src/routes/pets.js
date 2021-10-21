const { Router } = require('express');
const axios = require('axios').default;
const { Temperament, Dog, DogTemperament, User, Pet, Like } = require('../db.js');
const utils = require('../extras/utils.js');
const countries = require('../extras/countries')
const passport = require('passport');
const { Op } = require('sequelize');
const { validURL } = require('../extras/ownUtils')
const { deleteImage } = require('../extras/firebase')

const router = Router();

// This route allows us to create a new pet
router.post('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const { name, photo, dogId } = req.body;
        if (!name || !photo || !dogId) return res.status(400).send('Please provide a name, a link of a photo and a dog breed');
        if (!validURL(photo)) return res.status(400).send('Please provide a valid link of a photo')
        const petCreated = await Pet.create({ name, photo, dogId, userId: req.user.id });
        petCreated ? res.send(`${name} was registered successfully`) : next()
    } catch (e) {
        next()
    }
})

// This route allows us to get all the dog breeds
router.get('/all/:breedid', async (req, res, next) => {
    try {
        if (!req.params.breedid) return res.status(400).send('Please provide a dog');
        const breedId = req.params.breedid;
        let pets = await Pet.findAll({
            where: {
                dogId: breedId
            }
        });
        if (pets.length) {
            pets = pets.map(e => {
                return {
                    id: e.dataValues.id,
                    name: e.dataValues.name,
                    photo: e.dataValues.photo,
                    userId: e.dataValues.userId
                }
            })
            res.send(pets)
        } else {
            res.status(404).send('No dogs found')
        }
    } catch (e) {
        next()
    }
})

// This route allows us to get the pets created by a user
router.get('/own', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        let pets = await Pet.findAll({ where: { userId: req.user.id } });
        if (pets.length) {
            pets = pets.map(e => {
                return {
                    id: e.dataValues.id,
                    name: e.dataValues.name,
                    photo: e.dataValues.photo,
                    userId: e.dataValues.userId
                }
            })
            res.send(pets)
        } else {
            res.status(404).send('You have not register any dog yet')
        }
    } catch (e) {
        next()
    }
})

router.get('/communityAll', async (req, res, next) => {
    try {
        let community = await Pet.findAll({
            include: [
                {
                    model: Like,
                    as: "likes",
                    attributes: ["createdAt"],
                    include: [
                        {
                            model: User,
                            as: "user",
                            attributes: ["id", "fullname", "username", "profilepic"]
                        }
                    ]
                },
                {
                    model: Dog,
                    as: "dog",
                    attributes: ['id', 'name']
                },
                {
                    model: User,
                    as: "user",
                    attributes: ['username', 'fullname', 'profilepic']
                }
            ], 
            attributes: ['id', 'name', 'photo'], 
            order: [['createdAt', 'desc'], [{ model: Like, as: 'likes' }, 'createdAt', 'desc']]
        })
        res.send(community.map(e => { return { ...e.dataValues, likesCount: e.dataValues.likes.length, likes: e.dataValues.likes.map(e => e.user) } }))
    } catch (e) {
        console.log(e)
        next()
    }
})

// This route allows us to get pet by id
router.get('/:id', async (req, res, next) => {
    try {
        const pet = await Pet.findOne({
            where: { id: parseInt(req.params.id) },
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
                    model: Dog,
                    as: "dog"
                }
            ],
            order: [[{model: Like, as: 'likes'}, 'createdAt', 'DESC']]
        });
        if (pet) {
            res.send(Object.assign((({ id, name, photo, dog, likes }) => ({ id, name, photo, dog, likes }))(pet.dataValues), { likes: pet.dataValues.likes.map(e => e.dataValues ? (({ id, username, fullname, profilepic }) => ({ id, username, fullname, profilepic }))(e.dataValues.user) : null) }, { likesCount: pet.dataValues.likes.length }, { dog: (({ id, name, image }) => ({ id, name, image }))(pet.dataValues.dog) }));
        } else {
            res.status(404).send(`There is no dog with the id ${req.params.id}`);
        }
    } catch (e) {
        next();
    }
})

// This route allows us to update the dog breed of a user
router.put('/', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        const { id, name, photo, dogId } = req.body;
        if (!id || !name || !photo || !dogId) return res.status(400).send('Please provide a name, a link of a photo, a dog breed and the dog you want to update');
        if (!validURL(photo)) return res.status(400).send('Please provide a valid link of a photo')
        const pet = await Pet.findOne({
            where: { id },
        })
        if (pet) {
            if (pet.userId === req.user.id) {
                const realName = pet.name;
                const oldPhoto = pet.photo;
                const petUpdated = await pet.update({ name, photo, dogId });
                if (petUpdated) {
                    console.log(oldPhoto)
                    console.log(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(oldPhoto.slice(87, 123)))
                    deleteImage('pets', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(oldPhoto.slice(87, 123)) ? oldPhoto.slice(87, 123) : null);
                    deleteImage('testsPets', pet.id)
                    return res.send(`${petUpdated.name} was updated successfully`)
                } else {
                    return res.status(500).send(`Sorry, ${realName} can not be updated`)
                }
            } else {
                return res.status(404).send(`You can not edit this dog beacuse is not yours`);
            }
        } else {
            res.status(404).send(`There is no dog with the id ${id}`);
        }
    } catch (e) {
        next()
    }
})

// This route allow us to delete the pet of a user 
router.delete('/:pet', passport.authenticate('jwt', { session: false }), async (req, res, next) => {
    try {
        if (!req.params.pet) return res.send(400).send('Please provide a dog')
        const pet = await Pet.findOne({
            where: { id: req.params.pet }
        })
        if (pet) {
            const name = pet.name;
            if (pet.userId === req.user.id) {
                const deletedPetId = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(pet.photo.slice(87, 123)) ? pet.photo.slice(87, 123) : pet.id;
                const petDeleted = await pet.destroy();
                if (!petDeleted.length) {
                    deleteImage('deletePet', deletedPetId)
                    return res.send(`${name} was deleted successfully`)
                } else {
                    return res.status(500).send(`Sorry, ${name} can not be deleted`)
                }
            } else {
                return res.status(404).send(`You can not delete ${name} because is not yours`);
            }
        } else {
            res.status(404).send(`There is no dog with the id ${id}`);
        }
    } catch (e) {
        next()
    }
})

router.delete('/notUsed/:photoImageName', async (req, res) => {
    if (parseInt(req.params.photoImageName)) {
        deleteImage('testsPets', req.params.photoImageName)
    } else {
        const pet = await Pet.findOne({
            where: {
                photo: {
                    [Op.like]: `%${req.params.photoImageName}%`
                }
            }
        })
        if (!pet) deleteImage('deletePet', req.params.photoImageName)
    }
})

module.exports = router;